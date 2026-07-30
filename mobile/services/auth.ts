import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/supabase/client';

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// getSession() only reads whatever's cached in local storage — it does not
// contact the server, so it can return a session whose access token is no
// longer valid there (revoked, or persisted from before the project's
// current auth config/keys) without ever knowing. getUser() makes a real
// authenticated request, so it's what actually confirms the token still
// works before every subsequent write (e.g. the display-name save) relies
// on it.
export async function isSessionValid(): Promise<boolean> {
  const { error } = await supabase.auth.getUser();
  return !error;
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
