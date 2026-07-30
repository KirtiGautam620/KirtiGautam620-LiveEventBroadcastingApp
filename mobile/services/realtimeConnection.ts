import { supabase } from '@/supabase/client';

// Forces a fresh connection cycle rather than calling connect() alone,
// which is a no-op "unless already connected" — the client's own belief
// about its connection state can lag behind reality (e.g. after the app
// was backgrounded and its timers throttled by the OS). Existing channels
// (presence, chat) aren't cleared by disconnect() and rejoin automatically
// once the socket reopens — this is realtime-js's built-in behavior, not
// something callers need to redo per channel.
export async function reconnectRealtime(): Promise<void> {
  await supabase.realtime.disconnect();
  supabase.realtime.connect();
}
