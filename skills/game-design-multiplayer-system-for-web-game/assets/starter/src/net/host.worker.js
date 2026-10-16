import * as game from '../game/adapter.js';
import { validInput } from '../../shared/protocol.js';
// Host-only fixed-step simulation. Rendering and tab visibility must not control this loop.
let state = null, round = 0, revision = 0, active = false;
const latest = new Map(), sequences = new Map();
let last = performance.now(), accumulated = 0, publishTime = 0;
function publish() { postMessage({ type: 'snapshot', round, revision: ++revision, state, finished: game.isFinished(state) }); }
self.onmessage = ({ data }) => {
 try {
  if (data.type === 'round') {
   round = data.round; revision = 0; latest.clear(); sequences.clear(); accumulated = 0;
   last = performance.now(); publishTime = last; state = game.createState(data.players); active = true; publish();
  } else if (data.type === 'roster' && state) {
   game.syncPlayers(state, data.players);
   for (const id of latest.keys()) if (!data.players.some(p => p.id === id)) { latest.delete(id); sequences.delete(id); }
  } else if (data.type === 'input' && active && data.round === round && validInput(data) && data.seq > (sequences.get(data.id) || 0)) {
   sequences.set(data.id, data.seq); latest.set(data.id, { x: data.x, z: data.z, at: performance.now() });
   game.applyInput(state, data.id, data);
  }
 } catch { active = false; postMessage({ type: 'fault', message: '玩法接口執行失敗，請檢查 adapter。' }); }
};
setInterval(() => {
 const now = performance.now(), elapsed = now - last; last = now;
 if (!active || !state) return;
 try {
  // No large catch-up burst after sleep: at most 200ms, then resume normal steps.
  accumulated += Math.min(.2, elapsed / 1000);
  const inputs = new Map([...latest].filter(([, v]) => now - v.at < 400));
  while (accumulated >= .05) { game.step(state, .05, inputs); accumulated -= .05; }
  if (game.isFinished(state)) { publish(); active = false; }
  else if (now - publishTime >= 100) { publish(); publishTime = now; }
 } catch { active = false; postMessage({ type: 'fault', message: '玩法更新失敗，請檢查 adapter。' }); }
}, 50);
