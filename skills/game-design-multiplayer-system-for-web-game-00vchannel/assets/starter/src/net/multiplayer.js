import { RoomClient } from './room-client.js';
import { validateState } from '../game/adapter.js';
import { validSnapshot } from '../../shared/protocol.js';
export class Multiplayer {
 constructor(onChange) {
  this.onChange = onChange; this.client = new RoomClient(event => this.receive(event));
  this.reset();
 }
 reset() { this.worker?.terminate(); this.worker = null; this.id = ''; this.host = false; this.round = 0; this.seq = 0; this.revision = 0; this.players = []; this.state = null; this.phase = 'idle'; this.share = ''; this.message = ''; this.lastSnapshot = 0; }
 view() { return { id: this.id, host: this.host, round: this.round, players: this.players, state: this.state, phase: this.phase, share: this.share, message: this.message, lastSnapshot: this.lastSnapshot }; }
 notify() { this.onChange(this.view()); }
 connect(name, invite) { this.client.close(); this.reset(); this.phase = 'connecting'; this.notify(); return this.client.connect(name, invite); }
 close() { this.client.close(); this.reset(); this.notify(); }
 start() { this.client.start(); }
 input(x, z, action = false) {
  if (this.phase !== 'playing') return;
  const input = { type: 'input', id: this.id, round: this.round, seq: ++this.seq, x, z, action };
  if (this.host) this.worker?.postMessage(input); else this.client.input(input);
 }
 receive(event) {
  if (event.type === 'welcome') {
   this.id = event.id; this.host = event.host; this.round = event.round; this.phase = event.phase;
   if (this.host) {
    this.worker = new Worker(new URL('./host.worker.js', import.meta.url), { type: 'module' });
    this.worker.onmessage = ({ data }) => {
     if (data.type === 'fault') { this.client.fail(data.message); return; }
     if (data.round !== this.round) return;
     if (!validSnapshot(data) || !validateState(data.state)) { this.client.fail('玩法產生無效狀態，請檢查 adapter。'); return; }
     this.state = data.state; this.lastSnapshot = performance.now();
     this.client.snapshot(data); if (data.finished) this.phase = 'finished'; this.notify();
    };
    this.worker.onerror = () => this.client.fail('房主模擬無法啟動，請檢查玩法程式。');
   }
  } else if (event.type === 'invite') this.share = event.url;
  else if (event.type === 'roster') { this.players = event.players; this.worker?.postMessage(event); }
  else if (event.type === 'round') {
   this.round = event.round; this.seq = 0; this.revision = 0; this.state = null; this.players = event.players; this.phase = 'playing'; this.message = ''; this.lastSnapshot = performance.now();
   this.worker?.postMessage(event);
  } else if (event.type === 'input' && this.host) this.worker?.postMessage(event);
  else if (event.type === 'snapshot' && !this.host && event.round === this.round && event.revision > this.revision) {
   if (!validSnapshot(event) || !validateState(event.state)) { this.client.fail('遊戲資料不相容，請雙方更新至相同版本。'); return; }
   this.revision = event.revision; this.state = event.state; this.lastSnapshot = performance.now(); if (event.finished) this.phase = 'finished';
  } else if (event.type === 'closed') {
   this.worker?.terminate(); this.worker = null; this.phase = 'closed'; this.message = event.message; this.share = '';
  } else if (event.type === 'error') this.message = event.message;
  this.notify();
 }
}
