import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/supabase/client';

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

let inFlightSignIn: Promise<Session> | null = null;

// Deduplicates concurrent callers (e.g. more than one mounted
// useAnonymousAuth instance) into a single network call, so the app can
// never accidentally create two anonymous identities from one launch.
export function signInAnonymously(): Promise<Session> {
  if (!inFlightSignIn) {
    inFlightSignIn = supabase.auth
      .signInAnonymously()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!data.session) throw new Error('Anonymous sign-in succeeded but returned no session.');
        return data.session;
      })
      .finally(() => {
        inFlightSignIn = null;
      });
  }
  return inFlightSignIn;
}

export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => subscription.unsubscribe();
}
