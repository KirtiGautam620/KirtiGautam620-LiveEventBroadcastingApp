import type { Tables, TablesInsert, TablesUpdate } from './database.types';

export type Profile = Tables<'profiles'>;
export type ProfileUpdateInput = Pick<
  TablesUpdate<'profiles'>,
  'username' | 'display_name' | 'avatar_url'
>;

export type Stream = Tables<'streams'>;
export type StreamStatus = Stream['status'];
export type StartStreamInput = Pick<
  TablesInsert<'streams'>,
  'creator_id' | 'title' | 'description' | 'playback_url' | 'thumbnail_url'
>;

// Stream with its creator's profile embedded — what StreamRepository.listLive()
// actually returns, since rendering a stream card needs the creator's name/avatar
// and a per-card profile fetch would be an N+1 query.
export type StreamWithCreator = Stream & {
  creator: Pick<Profile, 'username' | 'display_name' | 'avatar_url'> | null;
};

export type Message = Tables<'messages'>;
export type SendMessageInput = Pick<
  TablesInsert<'messages'>,
  'stream_id' | 'sender_id' | 'content' | 'client_id' | 'client_created_at'
>;
