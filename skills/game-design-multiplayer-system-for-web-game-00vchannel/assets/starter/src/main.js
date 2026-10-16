import './style.css';
import { Multiplayer } from './net/multiplayer.js';
import { validRoomId } from '../shared/protocol.js';
const el = id => document.getElementById(id), canvas = el('game'), ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const invite = params.has('room') ? { id: params.get('room'), invite: params.get('invite') } : null;
el('connect').textContent = invite ? '加入房間' : '開房';
let view, touch = { x: 0, z: 0 }, keys = new Set();
const axes = () => ({ x: document.hidden ? 0 : Math.max(-1, Math.min(1, touch.x + Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')))), z: document.hidden ? 0 : Math.max(-1, Math.min(1, touch.z + Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup')))) });
const game = new Multiplayer(next => {
 view = next;
 el('connect-form').hidden = !['idle', 'closed'].includes(view.phase);
 el('room').hidden = ['idle', 'closed'].includes(view.phase);
 el('connect').disabled = view.phase === 'connecting';
 el('error').hidden = !view.message; el('error').textContent = view.message;
 el('roster').textContent = view.players.map(p => p.name + (p.host ? '（房主）' : '')).join('、');
 el('start').hidden = !view.host; el('start').disabled = view.players.length < 2 || !['lobby', 'finished'].includes(view.phase);
 el('start').textContent = view.phase === 'finished' ? '再開一局' : '開始';
 el('share-label').hidden = el('copy').hidden = !view.share; el('share').value = view.share;
 el('score').textContent = '共同互動：' + (view.state?.count ?? 0) + ' / 6';
 el('time').textContent = view.state ? '剩餘 ' + Math.ceil(view.state.remaining) + ' 秒' : '';
});
view = game.view();
el('connect-form').addEventListener('submit', event => {
 event.preventDefault();
 if (invite && (!validRoomId(invite.id) || !validRoomId(invite.invite))) { el('error').hidden = false; el('error').textContent = '邀請連結不完整。'; return; }
 game.connect(el('name').value.trim() || '玩家', invite);
});
el('start').onclick = () => game.start();
el('leave').onclick = () => game.close();
el('share').onfocus = event => event.target.select();
el('copy').onclick = async () => { try { await navigator.clipboard.writeText(view.share); el('copy').textContent = '已複製'; } catch { el('share').focus(); el('share').select(); } };
const send = action => { const { x, z } = axes(); game.input(x, z, action); };
const clear = () => { keys.clear(); touch = { x: 0, z: 0 }; send(false); };
window.addEventListener('keydown', event => {
 if (event.target.closest('input,textarea,button')) return;
 const k = event.key.toLowerCase(); if (!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) return;
 event.preventDefault(); keys.add(k); if (k === ' ' && !event.repeat) send(true);
});
window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', clear);
document.addEventListener('visibilitychange', clear); // Release inputs only. Never close the room here.
window.addEventListener('pagehide', () => game.close()); // Actual navigation/unload, not visibility.
for (const button of document.querySelectorAll('[data-x]')) {
 button.onpointerdown = event => { button.setPointerCapture(event.pointerId); touch = { x: Number(button.dataset.x), z: Number(button.dataset.z) }; send(false); };
 button.onpointerup = button.onpointercancel = button.onlostpointercapture = () => { touch = { x: 0, z: 0 }; send(false); };
}
el('action').onclick = () => send(true);
setInterval(() => {
 send(false);
 el('status').textContent = view.phase === 'playing' && performance.now() - view.lastSnapshot > 3000 ? '等待房主同步…' : ({ idle: '尚未連線', connecting: '連線中…', lobby: '等待開局', playing: '連線中 · 第 ' + view.round + ' 局', finished: '本局完成', closed: '房間已關閉' }[view.phase]);
}, 100);
const colors = ['#345b83','#96603c','#715398','#3f7663'];
function render() {
 ctx.fillStyle = '#f7f7f5'; ctx.fillRect(0, 0, 960, 540);
 ctx.strokeStyle = '#d8dde3'; ctx.lineWidth = 1;
 for (let x = 0; x <= 960; x += 96) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 540); ctx.stroke(); }
 for (let y = 0; y <= 540; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke(); }
 for (const [i, p] of (view.state?.players || []).entries()) {
  if (!view.players.some(current => current.id === p.id)) continue;
  const x = 480 + p.x * 90, y = 270 + p.z * 90;
  ctx.fillStyle = colors[i % 4]; ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
  if (p.id === view.id) { ctx.strokeStyle = '#262b35'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 29, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = '#262b35'; ctx.font = '18px system-ui'; ctx.textAlign = 'center'; ctx.fillText(p.name, x, y - 36);
 }
 requestAnimationFrame(render); // Rendering only; simulation is in host.worker.js.
}
render();
