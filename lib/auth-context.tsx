'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile, getProfile, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName?: string) => Promise<any>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: 'google' | 'github') => Promise<any>;
  updateProfile: (updates: Partial<Profile>) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip auth initialization if Supabase is not configured
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadProfile(session.user.id);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await getProfile(userId);
      if (error) {
        console.error('Error loading profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    setLoading(true);
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    return result;
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    setLoading(true);
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    setLoading(false);
    return result;
  };

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase not configured');
    setLoading(true);
    await supabase.auth.signOut();
    setProfile(null);
    setLoading(false);
  };

  const signInWithProvider = async (provider: 'google' | 'github') => {
    if (!supabase) throw new Error('Supabase not configured');
    const result = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return result;
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!supabase) {
      // Demo mode - just update local state
      const updatedProfile = { ...profile, ...updates } as Profile;
      setProfile(updatedProfile);
      return { data: updatedProfile, error: null };
    }
    
    if (!user) throw new Error('No user logged in');
    
    try {
      // For now, just update local state in all cases
      const updatedProfile = { ...profile, ...updates } as Profile;
      setProfile(updatedProfile);
      return { data: updatedProfile, error: null };
    } catch (error) {
      console.error('Profile update error:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithProvider,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
