import type { PostgrestError } from '@supabase/supabase-js';

interface Result<T> {
  data: T | null;
  error: PostgrestError | null;
}

// For queries where "no row" is a real, expected outcome (e.g. getById via
// .maybeSingle()) — throws only on an actual query error, passes null through.
export function unwrapNullable<T>({ data, error }: Result<T>): T | null {
  if (error) throw error;
  return data;
}

// For queries where a row is always expected on success (e.g. .single() after
// an insert/update) — throws on error or on an unexpected null.
export function unwrap<T>(result: Result<T>): T {
  const data = unwrapNullable(result);
  if (data === null) throw new Error('Expected a row, got none.');
  return data;
}
