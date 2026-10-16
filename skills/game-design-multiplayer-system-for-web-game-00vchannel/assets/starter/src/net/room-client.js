import { PROTOCOL, MAX_BYTES, parseMessage } from '../../shared/protocol.js';
// Transport only: it never invents player identity or changes gameplay state.
export class RoomClient {
 constructor(onEvent) { this.onEvent = onEvent; this.generation = 0; this.ws = null; this.round = 0; this.host = false; }
 close() {
  this.generation++; this.abort?.abort(); clearInterval(this.heartbeat); clearTimeout(this.deadline);
  document.removeEventListener('visibilitychange', this.visibility);
  const ws = this.ws; this.ws = null;
  if (ws) { ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null; ws.close(); }
 }
 fail(message) { this.close(); this.onEvent({ type: 'closed', message }); }
 async connect(name, invite = null) {
  this.close(); const generation = this.generation; this.abort = new AbortController();
  const signal = this.abort.signal;
  this.deadline = setTimeout(() => { if (generation === this.generation) this.fail('連線逾時，請重試。'); }, 12000);
  const get = async (url, options = {}) => {
   const response = await fetch(url, { ...options, signal });
   let body; try { body = await response.json(); } catch { throw Error('請先啟動房間服務，或使用已發佈網址。'); }
   if (!response.ok) throw Error(body.error || '連線失敗'); return body;
  };
  try {
   const room = invite || await get('/api/mp/rooms', { method: 'POST' });
   const query = new URLSearchParams({ v: String(PROTOCOL), name, ...(invite ? { invite: room.invite } : { host: room.hostToken }) });
   const path = '/api/mp/rooms/' + room.id;
   await get(path + '?' + query);
   if (generation !== this.generation) return;
   const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + path + '/ws?' + query); this.ws = ws;
   ws.onmessage = event => {
    if (generation !== this.generation) return;
    this.lastMessage = performance.now(); if (event.data === 'pong') return;
    const data = parseMessage(event.data); if (!data) return;
    if (data.type === 'welcome') {
     if (data.protocol !== PROTOCOL) { this.fail('版本不同，請重新整理雙方頁面。'); return; }
     clearTimeout(this.deadline); this.host = data.host; this.id = data.id; this.round = data.round;
     this.onEvent(data);
     if (this.host) {
      const share = new URL(location.href); share.hash = ''; share.search = new URLSearchParams({ room: room.id, invite: room.invite }).toString();
      this.onEvent({ type: 'invite', url: share.href });
     }
     this.startHeartbeat(generation); return;
    }
    if (data.type === 'closed') { this.fail(data.message); return; }
    if (data.type === 'round') this.round = data.round;
    this.onEvent(data);
   };
   ws.onerror = () => { if (generation === this.generation) this.fail('連線失敗，請確認房主在線後重試。'); };
   ws.onclose = () => { if (generation === this.generation) this.fail('連線已中斷，請重新開房或加入。'); };
  } catch (error) { if (generation === this.generation) this.fail(error.message || '連線失敗'); }
 }
 startHeartbeat(generation) {
  let last = performance.now(), lastPing = 0; this.lastMessage = last;
  this.visibility = () => { if (!document.hidden) { last = performance.now(); this.lastMessage = last; lastPing = 0; } };
  document.addEventListener('visibilitychange', this.visibility);
  this.heartbeat = setInterval(() => {
   if (generation !== this.generation || this.ws?.readyState !== WebSocket.OPEN) return;
   const now = performance.now();
   if (now - last > 5000) { this.lastMessage = now; lastPing = 0; }
   last = now;
   if (!document.hidden && now - this.lastMessage > 20000) { this.fail('連線沒有回應，請重新加入。'); return; }
   if (now - lastPing >= 5000) { this.ws.send('ping'); lastPing = now; }
  }, 1000);
 }
 send(data) {
  if (this.ws?.readyState !== WebSocket.OPEN) return false;
  const text = JSON.stringify(data);
  if (new TextEncoder().encode(text).length > MAX_BYTES) { this.fail('同步資料過大，請縮減遊戲狀態。'); return false; }
  if (this.ws.bufferedAmount > MAX_BYTES * 4) { this.fail('連線壅塞，請重新加入。'); return false; }
  this.ws.send(text); return true;
 }
 start() { if (this.host) this.send({ type: 'start' }); }
 input(data) { if (!this.host) this.send({ type: 'input', round: this.round, ...data }); }
 snapshot(data) { if (this.host) this.send({ type: 'snapshot', ...data }); }
}
