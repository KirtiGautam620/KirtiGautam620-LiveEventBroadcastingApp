import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/supabase/client';
import type { Profile, ProfileUpdateInput } from '@/types/database';

import { unwrap, unwrapNullable } from './_shared';

export interface ProfileRepository {
  getById(id: string): Promise<Profile | null>;
  getByUsername(username: string): Promise<Profile | null>;
  /**
   * Updates display_name/username/avatar_url for the given user, creating
   * the profile row first if one doesn't exist yet (see PGRST116 handling
   * below) — id is always auth.uid(), never invented or replaced.
   */
  update(id: string, patch: ProfileUpdateInput): Promise<Profile>;
}

function logProfileError(
  operation: 'update' | 'insert',
  id: string,
  payload: Record<string, unknown>,
  error: PostgrestError,
): void {
  console.error(`[profileRepository.${operation}] Failed to ${operation} profile`, {
    table: 'profiles',
    operation,
    userId: id,
    payload,
    supabaseErrorMessage: error.message,
    supabaseErrorCode: error.code,
    supabaseErrorDetails: error.details,
    supabaseErrorHint: error.hint,
  });
}

// Mirrors handle_new_user's own fallback convention exactly (see
// backend/supabase/migrations/20260730000000_create_core_schema.sql), so a
// client-created row looks identical to a trigger-provisioned one.
function fallbackUsername(id: string): string {
  return `user_${id.slice(0, 8)}`;
}

export const profileRepository: ProfileRepository = {
  async getById(id) {
    const result = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    return unwrapNullable(result);
  },

  async getByUsername(username) {
    // Case-insensitive match, consistent with the unique index on
    // lower(username). Not guaranteed to use that index for large tables
    // (ilike doesn't rewrite to a lower() comparison the way eq would), but
    // at this app's scale that's not a practical concern.
    const result = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', username)
      .maybeSingle();
    return unwrapNullable(result);
  },

  async update(id, patch) {
    const result = await supabase.from('profiles').update(patch).eq('id', id).select().single();

    if (result.error?.code === 'PGRST116') {
      // update() matched 0 rows: no profile exists yet for this id.
      // handle_new_user provisions one on every auth.users insert (see the
      // migration), but that's not a guarantee every account has one —
      // e.g. an account created before that trigger existed — so this
      // falls back to creating the row itself instead of leaving the user
      // permanently stuck. username has no column default (only the
      // trigger sets one), so it must be supplied here or the insert
      // itself violates the NOT NULL constraint; `patch` is spread last so
      // an explicit username in it (not the case for the display-name-only
      // caller) still wins over the fallback.
      const insertResult = await supabase
        .from('profiles')
        .insert({ id, username: fallbackUsername(id), ...patch })
        .select()
        .single();

      if (insertResult.error) {
        logProfileError('insert', id, patch, insertResult.error);
      }
      return unwrap(insertResult);
    }

    if (result.error) {
      logProfileError('update', id, patch, result.error);
    }
    return unwrap(result);
  },
};
