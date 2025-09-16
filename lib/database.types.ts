export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      astrophysical_events: {
        Row: {
          id: string
          created_at: string
          user_id: string
          event_type: string
          name: string
          description: string | null
          ra: number
          dec: number
          magnitude: number | null
          redshift: number | null
          discovery_date: string | null
          source_id: string | null
          metadata: Json | null
          is_verified: boolean
          priority: 'low' | 'medium' | 'high' | 'critical'
          tags: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          event_type: string
          name: string
          description?: string | null
          ra: number
          dec: number
          magnitude?: number | null
          redshift?: number | null
          discovery_date?: string | null
          source_id?: string | null
          metadata?: Json | null
          is_verified?: boolean
          priority?: 'low' | 'medium' | 'high' | 'critical'
          tags?: string[]
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          event_type?: string
          name?: string
          description?: string | null
          ra?: number
          dec?: number
          magnitude?: number | null
          redshift?: number | null
          discovery_date?: string | null
          source_id?: string | null
          metadata?: Json | null
          is_verified?: boolean
          priority?: 'low' | 'medium' | 'high' | 'critical'
          tags?: string[]
        }
      }
      event_correlations: {
        Row: {
          id: string
          created_at: string
          event1_id: string
          event2_id: string
          correlation_type: string
          confidence_score: number
          description: string | null
          parameters: Json | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          event1_id: string
          event2_id: string
          correlation_type: string
          confidence_score: number
          description?: string | null
          parameters?: Json | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          event1_id?: string
          event2_id?: string
          correlation_type?: string
          confidence_score?: number
          description?: string | null
          parameters?: Json | null
          user_id?: string
        }
      }
      data_sources: {
        Row: {
          id: string
          created_at: string
          name: string
          type: string
          url: string | null
          api_key: string | null
          description: string | null
          is_active: boolean
          user_id: string
          last_sync: string | null
          sync_frequency: string | null
          config: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          type: string
          url?: string | null
          api_key?: string | null
          description?: string | null
          is_active?: boolean
          user_id: string
          last_sync?: string | null
          sync_frequency?: string | null
          config?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          type?: string
          url?: string | null
          api_key?: string | null
          description?: string | null
          is_active?: boolean
          user_id?: string
          last_sync?: string | null
          sync_frequency?: string | null
          config?: Json | null
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          default_filters: Json | null
          notification_settings: Json | null
          display_preferences: Json | null
          export_preferences: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          default_filters?: Json | null
          notification_settings?: Json | null
          display_preferences?: Json | null
          export_preferences?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          default_filters?: Json | null
          notification_settings?: Json | null
          display_preferences?: Json | null
          export_preferences?: Json | null
        }
      }
      correlation_jobs: {
        Row: {
          id: string
          created_at: string
          user_id: string
          status: 'pending' | 'running' | 'completed' | 'failed'
          job_type: string
          parameters: Json | null
          results: Json | null
          error_message: string | null
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          job_type: string
          parameters?: Json | null
          results?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          job_type?: string
          parameters?: Json | null
          results?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
