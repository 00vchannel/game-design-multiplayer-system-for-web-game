import { DurableObject } from 'cloudflare:workers';
import { PROTOCOL, MAX_BYTES, parseMessage, validRoomId, validInput, validSnapshot } from '../shared/protocol.js';
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const fail = (message, status = 400) => json({ error: message }, status);
export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/mp/')) return env.ASSETS.fetch(request);
  const origin = request.headers.get('Origin');
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (origin && origin !== url.origin && !(local && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) return fail('來源不符', 403);
  if (url.pathname === '/api/mp/health') return json({ ok: true, protocol: PROTOCOL });
  if (url.pathname === '/api/mp/rooms' && request.method === 'POST') {
   const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(request.headers.get('CF-Connecting-IP') || 'local'));
   const key = Array.from(new Uint8Array(digest), v => v.toString(16).padStart(2, '0')).join('');
   const quota = await env.ROOMS.getByName('quota-' + key).fetch(new Request('https://room/quota', { method: 'POST' }));
   if (!quota.ok) return fail('開房過於頻繁，請稍後重試。', 429);
   const id = crypto.randomUUID(), hostToken = crypto.randomUUID(), invite = crypto.randomUUID();
   const result = await env.ROOMS.getByName(id).fetch(new Request('https://room/init', {
    method: 'POST', body: JSON.stringify({ hostToken, invite, phase: 'lobby', round: 0 })
   }));
   return result.ok ? json({ id, hostToken, invite, protocol: PROTOCOL }) : fail('無法開房', 503);
  }
  const match = url.pathname.match(/^\/api\/mp\/rooms\/([^/]+)(\/ws)?$/);
  if (match && validRoomId(match[1])) {
   if (request.method !== 'GET') return fail('操作不支援', 405);
   return env.ROOMS.getByName(match[1]).fetch(request);
  }
  return fail('找不到服務', 404);
 }
};
export class ClassroomRoom extends DurableObject {
 constructor(ctx, env) {
  super(ctx, env);
  this.sessions = new Map(); this.rates = new Map(); this.meta = null;
  ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  ctx.blockConcurrencyWhile(async () => {
   this.meta = await ctx.storage.get('meta') || null;
   for (const ws of ctx.getWebSockets()) {
    const session = ws.deserializeAttachment(); if (session) this.sessions.set(ws, session);
   }
  });
 }
 players() { return [...this.sessions.values()].map(({ id, name, host }) => ({ id, name, host })); }
 send(ws, data) { try { ws.send(JSON.stringify(data)); } catch { /* close/error callback owns membership cleanup */ } }
 broadcast(data, except) { for (const ws of this.sessions.keys()) if (ws !== except) this.send(ws, data); }
 roster() { this.broadcast({ type: 'roster', players: this.players(), phase: this.meta.phase, round: this.meta.round }); }
 async fetch(request) {
  const url = new URL(request.url);
  if (url.pathname === '/quota') {
   const now = Date.now(); const entries = (await this.ctx.storage.get('quota') || []).filter(at => now - at < 60000);
   if (entries.length >= 12) return fail('開房過於頻繁', 429);
   entries.push(now); await this.ctx.storage.put('quota', entries); await this.ctx.storage.setAlarm(now + 60000); return json({ ok: true });
  }
  if (url.pathname === '/init') {
   if (this.meta) return fail('房間已存在', 409);
   this.meta = await request.json(); await this.ctx.storage.put('meta', this.meta);
   await this.ctx.storage.setAlarm(Date.now() + 2 * 60 * 60 * 1000); return json({ ok: true });
  }
  if (!this.meta || this.meta.phase === 'closed') return fail('房間已關閉，請重新邀請。', 404);
  if (Number(url.searchParams.get('v')) !== PROTOCOL) return fail('版本不同，請重新整理雙方頁面。', 409);
  const host = url.searchParams.get('host') === this.meta.hostToken;
  if (!host && url.searchParams.get('invite') !== this.meta.invite) return fail('邀請無效', 403);
  if (this.meta.phase === 'playing') return fail('本局已開始，請在結束後再加入。', 409);
  if (this.sessions.size >= 4) return fail('房間已滿（最多四人）', 409);
  if (host && this.players().some(p => p.host)) return fail('房主已連線', 409);
  if (!host && !this.players().some(p => p.host)) return fail('房主尚未進入', 409);
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return json({ phase: this.meta.phase, players: this.sessions.size });
  const pair = new WebSocketPair(), ws = pair[1];
  const session = { id: crypto.randomUUID(), name: (url.searchParams.get('name') || '玩家').slice(0, 16), host, seq: 0, revision: 0 };
  this.ctx.acceptWebSocket(ws); ws.serializeAttachment(session); this.sessions.set(ws, session);
  this.send(ws, { type: 'welcome', id: session.id, host, protocol: PROTOCOL, phase: this.meta.phase, round: this.meta.round });
  this.roster(); return new Response(null, { status: 101, webSocket: pair[0] });
 }
 async webSocketMessage(ws, text) {
  const session = this.sessions.get(ws); if (!session || !this.meta || this.meta.phase === 'closed') return;
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_BYTES) { ws.close(1009, '訊息過大或格式不符'); return; }
  const now = Date.now(), rate = this.rates.get(session.id) || { at: now, count: 0 };
  if (now - rate.at >= 1000) { rate.at = now; rate.count = 0; }
  rate.count++; this.rates.set(session.id, rate); if (rate.count > 40) { ws.close(1008, '操作過於頻繁'); return; }
  const data = parseMessage(text); if (!data) return;
  if (session.host && data.type === 'start') {
   if (this.meta.phase === 'playing' || this.sessions.size < 2) { this.send(ws, { type: 'error', message: '至少兩人才能開始；進行中的局不可重開。' }); return; }
   // Change the in-memory gate before awaiting persistence; a second click cannot start a second round.
   this.meta.phase = 'playing'; this.meta.round++;
   for (const [peer, p] of this.sessions) { p.seq = 0; p.revision = 0; peer.serializeAttachment(p); }
   await this.ctx.storage.put('meta', this.meta);
   this.broadcast({ type: 'round', round: this.meta.round, players: this.players() }); return;
  }
  if (data.round !== this.meta.round || this.meta.phase !== 'playing') return;
  if (session.host && data.type === 'snapshot' && validSnapshot(data) && data.revision > session.revision) {
   session.revision = data.revision; ws.serializeAttachment(session);
   if (data.finished) { this.meta.phase = 'finished'; await this.ctx.storage.put('meta', this.meta); }
   this.broadcast({ type: 'snapshot', round: data.round, revision: data.revision, state: data.state, finished: data.finished }, ws);
   return;
  }
  if (!session.host && data.type === 'input' && validInput(data) && data.seq > session.seq) {
   session.seq = data.seq; ws.serializeAttachment(session);
   // Identity comes from the authenticated socket, never from data.id supplied by a player.
   for (const [peer, p] of this.sessions) if (p.host) this.send(peer, {
    type: 'input', id: session.id, round: data.round, seq: data.seq, x: data.x, z: data.z, action: data.action
   });
  }
 }
 async webSocketClose(ws) { await this.drop(ws); }
 async webSocketError(ws) { await this.drop(ws); }
 async drop(ws) {
  const session = this.sessions.get(ws); if (!session) return;
  this.sessions.delete(ws); this.rates.delete(session.id);
  if (session.host) await this.closeRoom('房主已離線，請重新開房。');
  else if (this.meta && this.meta.phase !== 'closed') this.roster();
 }
 async closeRoom(message) {
  if (this.meta) this.meta.phase = 'closed';
  this.broadcast({ type: 'closed', message });
  for (const ws of this.sessions.keys()) { try { ws.close(1000, 'room closed'); } catch {} }
  this.sessions.clear(); this.rates.clear(); await this.ctx.storage.deleteAll();
 }
 async alarm() { await this.closeRoom('房間已到期，請重新開房。'); }
}
