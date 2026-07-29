import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

import { getSession, onAuthStateChange, signInAnonymously } from '@/services/auth';

export interface UseAnonymousAuthResult {
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  /** Re-runs the sign-in attempt after a permanent failure. */
  retry: () => void;
}

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 1000, 3000];

// Ensures an anonymous session exists on launch: reuses a persisted session
// if one restored from storage, otherwise signs in anonymously (retrying
// transient failures with backoff) so the app never shows a login screen.
export function useAnonymousAuth(): UseAnonymousAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function ensureSession() {
      setIsLoading(true);
      setError(null);

      try {
        const existing = await getSession();
        if (existing) {
          if (!cancelled) {
            setSession(existing);
            setIsLoading(false);
          }
          return;
        }
      } catch {
        // Reading the persisted session failed (e.g. corrupted storage) —
        // fall through to a fresh anonymous sign-in rather than getting stuck.
      }

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        if (cancelled) return;
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS[attempt]));
          if (cancelled) return;
        }

        try {
          const newSession = await signInAnonymously();
          if (!cancelled) {
            setSession(newSession);
            setIsLoading(false);
          }
          return;
        } catch (err) {
          if (attempt === MAX_ATTEMPTS - 1 && !cancelled) {
            setError(err instanceof Error ? err : new Error('Anonymous sign-in failed.'));
            setIsLoading(false);
          }
        }
      }
    }

    void ensureSession();

    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  useEffect(() => onAuthStateChange(setSession), []);

  const retry = useCallback(() => setRetryToken((token) => token + 1), []);

  return { session, isLoading, error, retry };
}
