export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      shifts: {
        Row: {
          client_id: string;
          created_at: string;
          date: string;
          end_time: string | null;
          ends_next_day: boolean;
          id: string;
          note: string;
          start_time: string | null;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          client_id?: string;
          created_at?: string;
          date: string;
          end_time?: string | null;
          ends_next_day?: boolean;
          id?: string;
          note?: string;
          start_time?: string | null;
          type: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          date?: string;
          end_time?: string | null;
          ends_next_day?: boolean;
          id?: string;
          note?: string;
          start_time?: string | null;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      shift_templates: {
        Row: {
          created_at: string;
          end_time: string;
          shift_type: string;
          start_time: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          end_time: string;
          shift_type: string;
          start_time: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          shift_type?: string;
          start_time?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
