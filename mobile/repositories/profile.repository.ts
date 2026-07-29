import { supabase } from '@/supabase/client';
import type { Profile, ProfileUpdateInput } from '@/types/database';

import { unwrap, unwrapNullable } from './_shared';

export interface ProfileRepository {
  getById(id: string): Promise<Profile | null>;
  getByUsername(username: string): Promise<Profile | null>;
  update(id: string, patch: ProfileUpdateInput): Promise<Profile>;
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
    return unwrap(result);
  },

  // No create(): profile rows are auto-provisioned by the
  // handle_new_user trigger on auth.users insert (see the migration), not
  // created by app code.
};
