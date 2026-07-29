-- Core schema for the live event broadcasting platform: profiles, streams, messages.
-- Requires: Supabase project (Postgres 15+, auth.users already present).

-- ============================================================================
-- Shared helpers
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- profiles
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive uniqueness: "Alice" and "alice" must not both exist.
create unique index profiles_username_key on public.profiles (lower(username));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-provision a profile row the moment an auth user is created, so
-- auth.uid() always has a matching profiles row to reference.
-- search_path is set to '' (not 'public') per Supabase's current SECURITY
-- DEFINER hardening guidance, which is why every reference below is
-- schema-qualified (public.profiles) rather than bare.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data ->> 'display_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Profiles are readable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid ()) is not null and id = (select auth.uid ()));

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid ()) is not null and id = (select auth.uid ()))
  with check ((select auth.uid ()) is not null and id = (select auth.uid ()));

-- ============================================================================
-- streams
-- ============================================================================

create type public.stream_status as enum ('live', 'ended');

create table public.streams (
  id uuid primary key default gen_random_uuid (),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  status public.stream_status not null default 'live',
  playback_url text,
  thumbnail_url text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint streams_ended_at_matches_status check (
    (status = 'live' and ended_at is null)
    or (status = 'ended' and ended_at is not null)
  )
);

-- A creator can only have one stream live at a time.
create unique index streams_one_live_per_creator
  on public.streams (creator_id)
  where (status = 'live');

-- Foreign key columns are not auto-indexed by Postgres.
create index streams_creator_id_idx on public.streams (creator_id);

-- Shape of the "browse live streams, newest first" query.
create index streams_status_started_at_idx on public.streams (status, started_at desc);

create trigger streams_set_updated_at
  before update on public.streams
  for each row execute function public.set_updated_at();

alter table public.streams enable row level security;

create policy "Streams are readable by any authenticated user"
  on public.streams for select
  to authenticated
  using (true);

create policy "Users can create streams as themselves"
  on public.streams for insert
  to authenticated
  with check ((select auth.uid ()) is not null and creator_id = (select auth.uid ()));

create policy "Creators can update their own streams"
  on public.streams for update
  to authenticated
  using ((select auth.uid ()) is not null and creator_id = (select auth.uid ()))
  with check ((select auth.uid ()) is not null and creator_id = (select auth.uid ()));

create policy "Creators can delete their own streams"
  on public.streams for delete
  to authenticated
  using ((select auth.uid ()) is not null and creator_id = (select auth.uid ()));

-- ============================================================================
-- messages
-- ============================================================================

create table public.messages (
  id uuid primary key default gen_random_uuid (),
  -- Server-assigned monotonic sequence: the authoritative chat order.
  -- Client clocks can skew or be wrong; a database sequence can't.
  seq bigserial,
  stream_id uuid not null references public.streams (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  content text not null,
  client_id uuid not null,
  -- Display-only "composed at" timestamp from the device (useful for
  -- showing when an offline-queued message was actually typed). Not used
  -- for ordering — see seq.
  client_created_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint messages_content_length check (char_length(content) between 1 and 500)
);

-- Offline-sync idempotency, scoped per stream: the mobile app generates
-- client_id when a message is composed (online or offline) and re-sends it
-- unchanged on retry, so a flaky-connection resubmit can't create a
-- duplicate row.
create unique index messages_stream_sender_client_id_key
  on public.messages (stream_id, sender_id, client_id);

-- Shape of the "load this stream's chat, in authoritative order" query.
create index messages_stream_id_seq_idx on public.messages (stream_id, seq);

-- Foreign key column, not covered by the composite index above (stream_id
-- is its leading column, so it can't serve sender_id-only lookups) — needed
-- for the on delete set null cascade when a profile is deleted.
create index messages_sender_id_idx on public.messages (sender_id);

alter table public.messages enable row level security;

create policy "Messages are readable by any authenticated user"
  on public.messages for select
  to authenticated
  using (true);

create policy "Users can send messages as themselves to live streams"
  on public.messages for insert
  to authenticated
  with check (
    (select auth.uid ()) is not null
    and sender_id = (select auth.uid ())
    and exists (
      select 1
      from public.streams s
      where s.id = stream_id
        and s.status = 'live'
    )
  );

create policy "Users can delete their own messages"
  on public.messages for delete
  to authenticated
  using ((select auth.uid ()) is not null and sender_id = (select auth.uid ()));

-- ============================================================================
-- Realtime configuration
-- ============================================================================

-- streams and messages are broadcast over Realtime (Postgres Changes).
-- profiles is intentionally excluded: avatar/name edits aren't time-critical,
-- and every row change would be pure replication overhead here.
alter publication supabase_realtime add table public.streams;
alter publication supabase_realtime add table public.messages;

-- FULL replica identity so UPDATE payloads (e.g. status: live -> ended)
-- include the old row, not just the new one, letting clients reconcile
-- local state without a follow-up fetch. Note: RLS does not filter DELETE
-- broadcasts on Realtime (Postgres can't check access on a row that's
-- gone), so a deleted stream's full last-known row is broadcast to every
-- subscriber regardless of policy — acceptable here since the streams
-- SELECT policy already exposes all rows to every authenticated user.
alter table public.streams replica identity full;

-- messages intentionally keeps the default (primary-key-only) replica
-- identity: message content shouldn't be re-broadcast in full on delete.

-- ============================================================================
-- Presence configuration
-- ============================================================================

-- Presence has no persisted schema and needs none: it's ephemeral,
-- per-connection state held in memory by the Realtime server, never
-- written to Postgres. Concurrent viewer count for a stream is derived
-- entirely from client-side Presence state on a public Realtime channel —
-- implemented in the mobile app, not here.
--
-- Channel convention (client-side contract, documented for reference):
--   Channel:          supabase.channel(`stream:${streamId}`)
--   Presence key:     auth.uid() of the connected viewer
--   Tracked payload:  { user_id: uuid, username: text, joined_at: timestamptz }
--   Viewer count:     number of distinct presence keys on the channel
--
-- This is a public (non-private) channel: streams and profiles are already
-- readable by any authenticated user (see RLS policies above), so there is
-- no per-stream access control to enforce at channel-join time, and no
-- realtime.messages policies are required.
