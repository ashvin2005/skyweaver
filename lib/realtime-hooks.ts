'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase, AstroEvent, EventCorrelation, isSupabaseConfigured } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeEventsOptions {
  onNewEvent?: (event: AstroEvent) => void;
  onEventUpdate?: (event: AstroEvent) => void;
  onNewCorrelation?: (correlation: EventCorrelation) => void;
  enabled?: boolean;
}

export function useRealtimeEvents({
  onNewEvent,
  onEventUpdate,
  onNewCorrelation,
  enabled = true
}: UseRealtimeEventsOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured || !supabase) {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Create a channel for real-time updates
    const channel = supabase
      .channel('skyweaver-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'astro_events'
        },
        (payload) => {
          console.log('New event:', payload.new);
          if (onNewEvent && payload.new) {
            onNewEvent(payload.new as AstroEvent);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'astro_events'
        },
        (payload) => {
          console.log('Updated event:', payload.new);
          if (onEventUpdate && payload.new) {
            onEventUpdate(payload.new as AstroEvent);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_correlations'
        },
        (payload) => {
          console.log('New correlation:', payload.new);
          if (onNewCorrelation && payload.new) {
            onNewCorrelation(payload.new as EventCorrelation);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError('Failed to connect to real-time updates');
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setError('Real-time connection timed out');
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [enabled, onNewEvent, onEventUpdate, onNewCorrelation]);

  return {
    isConnected,
    error,
    disconnect: () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    }
  };
}

// Hook for managing event data with real-time updates
export function useEventsWithRealtime(initialEvents: AstroEvent[] = []) {
  const [events, setEvents] = useState<AstroEvent[]>(initialEvents);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  // Fetch initial events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        if (data.events) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error('Failed to fetch initial events:', error);
      } finally {
        setLoading(false);
      }
    };

    if (initialEvents.length === 0) {
      fetchEvents();
    } else {
      setEvents(initialEvents);
      setLoading(false);
    }
  }, []);

  const handleNewEvent = (newEvent: AstroEvent) => {
    setEvents(prev => {
      // Check if event already exists
      const exists = prev.some(event => event.id === newEvent.id);
      if (exists) return prev;
      
      // Add new event at the beginning (most recent first)
      return [newEvent, ...prev];
    });
  };

  const handleEventUpdate = (updatedEvent: AstroEvent) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  const { isConnected, error, disconnect } = useRealtimeEvents({
    onNewEvent: handleNewEvent,
    onEventUpdate: handleEventUpdate,
    enabled: realtimeEnabled
  });

  const addEvent = (newEvent: AstroEvent) => {
    setEvents(prev => [newEvent, ...prev]);
  };

  const updateEvent = (updatedEvent: AstroEvent) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  const removeEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  };

  return {
    events,
    isConnected,
    realtimeEnabled,
    setRealtimeEnabled,
    error,
    disconnect,
    addEvent,
    updateEvent,
    removeEvent,
    loading
  };
}

// Hook for correlation data with real-time updates
export function useCorrelationsWithRealtime(initialCorrelations: EventCorrelation[] = []) {
  const [correlations, setCorrelations] = useState<EventCorrelation[]>(initialCorrelations);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);

  const handleNewCorrelation = (newCorrelation: EventCorrelation) => {
    setCorrelations(prev => {
      // Check if correlation already exists
      const exists = prev.some(corr => corr.id === newCorrelation.id);
      if (exists) return prev;
      
      // Add new correlation at the beginning
      return [newCorrelation, ...prev];
    });
  };

  const { isConnected, error, disconnect } = useRealtimeEvents({
    onNewCorrelation: handleNewCorrelation,
    enabled: realtimeEnabled
  });

  // Update correlations when initialCorrelations change
  useEffect(() => {
    setCorrelations(initialCorrelations);
  }, [initialCorrelations]);

  const addCorrelation = (newCorrelation: EventCorrelation) => {
    setCorrelations(prev => [newCorrelation, ...prev]);
  };

  const updateCorrelation = (updatedCorrelation: EventCorrelation) => {
    setCorrelations(prev => 
      prev.map(corr => 
        corr.id === updatedCorrelation.id ? updatedCorrelation : corr
      )
    );
  };

  const removeCorrelation = (correlationId: string) => {
    setCorrelations(prev => prev.filter(corr => corr.id !== correlationId));
  };

  return {
    correlations,
    isConnected,
    realtimeEnabled,
    setRealtimeEnabled,
    error,
    disconnect,
    addCorrelation,
    updateCorrelation,
    removeCorrelation
  };
}
