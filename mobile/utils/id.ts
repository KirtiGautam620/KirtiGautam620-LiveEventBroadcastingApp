// RFC4122 v4-ish UUID, sufficient for a client-side idempotency key (see
// messages.client_id) — not used for anything security-sensitive, so
// Math.random() is fine and avoids adding a native crypto module dependency
// (crypto.randomUUID() isn't reliably available in this Hermes runtime
// without expo-crypto).
export function generateClientId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
