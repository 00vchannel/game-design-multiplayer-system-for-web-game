// Replace this adapter with the student's own rules. No DOM, network or Three.js objects here.
export function createState(players) {
 const state = { players: [], count: 0, remaining: 180 }; syncPlayers(state, players); return state;
}
export function syncPlayers(state, roster) {
 state.players = roster.map((p, i) => state.players.find(old => old.id === p.id) || {
  id: p.id, name: p.name, x: -3 + i * 2, z: 0, cooldown: 0
 });
 // For a carrying/inventory game: return a departing player's item to an available station here.
}
export function applyInput(state, id, input) {
 const p = state.players.find(p => p.id === id);
 if (p && input.action && p.cooldown <= 0 && !isFinished(state)) { state.count++; p.cooldown = .25; }
}
export function step(state, dt, inputs) {
 if (isFinished(state)) return;
 state.remaining = Math.max(0, state.remaining - dt);
 for (const p of state.players) {
  const input = inputs.get(p.id) || { x: 0, z: 0 }; const length = Math.max(1, Math.hypot(input.x, input.z));
  p.x = Math.max(-4.5, Math.min(4.5, p.x + input.x / length * dt * 3));
  p.z = Math.max(-2.5, Math.min(2.5, p.z + input.z / length * dt * 3));
  p.cooldown = Math.max(0, p.cooldown - dt);
 }
}
export function isFinished(state) { return state.count >= 6 || state.remaining <= 0; }
export function validateState(state) {
 return !!state && Number.isInteger(state.count) && state.count >= 0 && state.count <= 6 &&
  Number.isFinite(state.remaining) && state.remaining >= 0 && state.remaining <= 180 &&
  Array.isArray(state.players) && state.players.length <= 4 && new Set(state.players.map(p => p?.id)).size === state.players.length &&
  state.players.every(p => p && typeof p.id === 'string' && typeof p.name === 'string' && p.name.length <= 16 &&
   Number.isFinite(p.x) && Math.abs(p.x) <= 4.5 && Number.isFinite(p.z) && Math.abs(p.z) <= 2.5 && Number.isFinite(p.cooldown));
}
