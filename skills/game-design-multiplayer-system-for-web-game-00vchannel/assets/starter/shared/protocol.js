export const PROTOCOL = 1;
export const MAX_BYTES = 48000;
export const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
export const integer = n => Number.isSafeInteger(n) && n >= 0;
export const validInput = value => isObject(value) && integer(value.seq) && value.seq > 0 &&
 Number.isFinite(value.x) && Math.abs(value.x) <= 1 && Number.isFinite(value.z) && Math.abs(value.z) <= 1 && typeof value.action === 'boolean';
export const validSnapshot = value => isObject(value) && integer(value.round) && integer(value.revision) &&
 typeof value.finished === 'boolean' && isObject(value.state);
export function parseMessage(text) {
 if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_BYTES) return null;
 try { const value = JSON.parse(text); return isObject(value) ? value : null; } catch { return null; }
}
export const validRoomId = id => typeof id === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id);
