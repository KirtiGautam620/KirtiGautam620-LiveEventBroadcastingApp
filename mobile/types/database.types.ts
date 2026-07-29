// Hand-authored to exactly match backend/supabase/migrations/20260730000000_create_core_schema.sql,
// in the same shape `supabase gen types typescript` produces, so it's a drop-in
// replacement once a project exists to generate from for real:
//
//   npx supabase gen types typescript --project-id <project-ref> --schema public > types/database.types.ts
//
// Only the `public` schema is represented (the default scope of that command).
// profiles.id -> auth.users(id) is therefore not expressed as a Relationship
// entry below, since `auth` isn't part of the generated schema.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      streams: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          status: Database['public']['Enums']['stream_status'];
          playback_url: string | null;
          thumbnail_url: string | null;
          started_at: string;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          status?: Database['public']['Enums']['stream_status'];
          playback_url?: string | null;
          thumbnail_url?: string | null;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          status?: Database['public']['Enums']['stream_status'];
          playback_url?: string | null;
          thumbnail_url?: string | null;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'streams_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          seq: number;
          stream_id: string;
          sender_id: string | null;
          content: string;
          client_id: string;
          client_created_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          seq?: number;
          stream_id: string;
          sender_id?: string | null;
          content: string;
          client_id: string;
          client_created_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          seq?: number;
          stream_id?: string;
          sender_id?: string | null;
          content?: string;
          client_id?: string;
          client_created_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_stream_id_fkey';
            columns: ['stream_id'];
            isOneToOne: false;
            referencedRelation: 'streams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      stream_status: 'live' | 'ended';
    };
    CompositeTypes: Record<string, never>;
  };
}

// Simplified, single-schema equivalent of the CLI's multi-schema `Tables<>` /
// `TablesInsert<>` / `TablesUpdate<>` / `Enums<>` helpers. Functionally the
// same for a public-only project; only the multi-schema call syntax differs.
type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
