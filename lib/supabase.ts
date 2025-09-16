import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Flag to check if Supabase is properly configured
export const isSupabaseConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key';

// Only create client if properly configured, otherwise use null
export const supabase = isSupabaseConfigured ? 
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) : null;

// Helper function to get supabase client safely
export function getSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }
  return supabase;
}

// Profile type for user profiles
export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  preferences?: any;
  created_at?: string;
  updated_at?: string;
}

// AstroEvent interface that matches component expectations
export interface AstroEvent {
  id: string;
  event_id: string;
  event_type: string;
  source: string;
  time_utc: string;
  ra: number;
  dec: number;
  confidence_score?: number;
  magnitude?: number;
  metadata?: any;
  created_at: string;
  updated_at?: string;
}

// EventCorrelation interface that matches component expectations  
export interface EventCorrelation {
  id: string;
  event1_id: string;
  event2_id: string;
  correlation_type: string;
  confidence_score: number;
  time_diff_seconds: number;
  angular_separation_deg: number;
  created_at: string;
}

// Keep the original database types for reference
export type DbAstroEvent = Database['public']['Tables']['astrophysical_events']['Row'];
export type DbAstroEventInsert = Database['public']['Tables']['astrophysical_events']['Insert'];
export type DbAstroEventUpdate = Database['public']['Tables']['astrophysical_events']['Update'];

export type DbEventCorrelation = Database['public']['Tables']['event_correlations']['Row'];
export type DbEventCorrelationInsert = Database['public']['Tables']['event_correlations']['Insert'];

export type DataSource = Database['public']['Tables']['data_sources']['Row'];
export type DataSourceInsert = Database['public']['Tables']['data_sources']['Insert'];

export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type CorrelationJob = Database['public']['Tables']['correlation_jobs']['Row'];

// Event types enum
export const EVENT_TYPES = [
  'gravitational_wave',
  'gamma_ray_burst', 
  'optical_transient',
  'neutrino',
  'radio_burst'
] as const;

export type EventType = typeof EVENT_TYPES[number];

// Filter configuration type
export interface FilterConfig {
  eventTypes: EventType[];
  sources: string[];
  timeRange: {
    start: string;
    end: string;
  };
  coordinates: {
    ra: { min: number; max: number };
    dec: { min: number; max: number };
  };
  confidenceThreshold: number;
  maxAngularSeparation?: number;
  maxTimeWindow?: number;
}

// Real-time subscription types
export interface RealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  new: any;
  old: any;
}

// Auth helpers
export const getCurrentUser = async () => {
  const client = getSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  return user;
};

export const getProfile = async (userId: string): Promise<{ data: Profile | null, error: any }> => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data: data ? data as Profile : null, error };
  } catch (error) {
    // Return a default profile if profiles table doesn't exist
    return { 
      data: {
        id: userId,
        email: '',
        full_name: 'Demo User',
        role: 'researcher'
      }, 
      error: null 
    };
  }
};