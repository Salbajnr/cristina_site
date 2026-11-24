export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      creator_roles: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          fan_user_id: string;
          creator_user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          fan_user_id: string;
          creator_user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          fan_user_id?: string;
          creator_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      feed_events: {
        Row: {
          id: string;
          resource_type: "content" | "post" | "comment" | "like";
          resource_id: string;
          created_at: string;
        };
        Insert: {
          id?: never;
          resource_type?: never;
          resource_id?: never;
          created_at?: never;
        };
        Update: {
          id?: never;
          resource_type?: never;
          resource_id?: never;
          created_at?: never;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          body?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "content" | "post" | "comment" | "like" | "inquiry" | "purchase" | "subscription" | "message" | "system";
          title: string;
          body: string;
          resource_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: Database["public"]["Tables"]["notifications"]["Row"]["type"];
          title: string;
          body?: string;
          resource_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: Database["public"]["Tables"]["notifications"]["Row"]["type"];
          title?: string;
          body?: string;
          resource_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      start_creator_conversation: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
