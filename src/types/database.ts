// Database type stubs — replace with `supabase gen types typescript` output
// after connecting your project: https://supabase.com/docs/guides/api/generating-types

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id:           string
          username:     string
          display_name: string | null
          avatar_url:   string | null
          created_at:   string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      subjects: {
        Row: {
          id:         string
          user_id:    string
          name:       string
          exam_date:  string | null
          strength:   'weak' | 'average' | 'strong'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['subjects']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>
      }
      topics: {
        Row: {
          id:             string
          subject_id:     string
          user_id:        string
          title:          string
          status:         'pending' | 'completed' | 'overdue'
          priority_score: number
          created_at:     string
          completed_at:   string | null
          deleted_at:     string | null
        }
        Insert: Omit<Database['public']['Tables']['topics']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['topics']['Insert']>
      }
      daily_plans: {
        Row: {
          id:            string
          user_id:       string
          topic_id:      string
          assigned_date: string
          is_completed:  boolean
          carried_over:  boolean
          version:       number
          created_at:    string
        }
        Insert: Omit<Database['public']['Tables']['daily_plans']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['daily_plans']['Insert']>
      }
      daily_plan_versions: {
        Row: {
          id:             string
          user_id:        string
          plan_date:      string
          version_number: number
          snapshot:       Json
          change_reason:  string
          created_at:     string
        }
        Insert: Omit<Database['public']['Tables']['daily_plan_versions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['daily_plan_versions']['Insert']>
      }
      study_logs: {
        Row: {
          id:            string
          user_id:       string
          subject_id:    string
          log_date:      string
          hours_studied: number
          created_at:    string
        }
        Insert: Omit<Database['public']['Tables']['study_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['study_logs']['Insert']>
      }
      scores: {
        Row: {
          id:                string
          user_id:           string
          score_date:        string
          daily_points:      number
          cumulative_points: number
          streak_count:      number
          raw_topic_points:  number
          raw_time_points:   number
          penalty_applied:   boolean
          updated_at:        string
        }
        Insert: Omit<Database['public']['Tables']['scores']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['scores']['Insert']>
      }
      friendships: {
        Row: {
          id:           string
          requester_id: string
          addressee_id: string
          status:       'pending' | 'accepted' | 'declined' | 'blocked'
          created_at:   string
          updated_at:   string
        }
        Insert: Omit<Database['public']['Tables']['friendships']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['friendships']['Insert']>
      }
      activity_events: {
        Row: {
          id:         string
          user_id:    string
          event_type: 'topic_completed' | 'hours_logged' | 'streak_milestone' | 'friend_joined'
          payload:    Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['activity_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['activity_events']['Insert']>
      }
    }
    Views:   Record<string, never>
    Functions: Record<string, never>
    Enums: {
      subject_strength:  'weak' | 'average' | 'strong'
      plan_intensity:    'chill' | 'balanced' | 'aggressive'
      topic_status:      'pending' | 'completed' | 'overdue'
      friendship_status: 'pending' | 'accepted' | 'declined' | 'blocked'
    }
  }
}
