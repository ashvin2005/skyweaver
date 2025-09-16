import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client for server-side operations
const supabaseAdmin = supabaseUrl && supabaseServiceKey ? 
  createClient<Database>(supabaseUrl, supabaseServiceKey) : null;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters for filtering
    const eventTypes = searchParams.get('event_types')?.split(',') || [];
    const sources = searchParams.get('sources')?.split(',') || [];
    const startTime = searchParams.get('start_time');
    const endTime = searchParams.get('end_time');
    const minConfidence = parseFloat(searchParams.get('min_confidence') || '0');
    const maxResults = parseInt(searchParams.get('max_results') || '1000');

    // Try to fetch from database if Supabase is configured
    if (supabaseAdmin) {
      try {
        // Build query
        let query = supabaseAdmin
          .from('astro_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(maxResults);

        // Apply filters
        if (eventTypes.length > 0) {
          query = query.in('event_type', eventTypes);
        }
        
        if (sources.length > 0) {
          query = query.in('source', sources);
        }
        
        if (startTime) {
          query = query.gte('time_utc', startTime);
        }
        
        if (endTime) {
          query = query.lte('time_utc', endTime);
        }

        const { data: events, error } = await query;

        if (error) {
          console.error('Database error, falling back to demo data:', error);
          throw new Error('Database query failed'); // Force fallback
        }

        if (events && events.length > 0) {
          // Get statistics
          const { data: stats } = await supabaseAdmin
            .from('astro_events')
            .select('event_type, source');

          const eventStats = stats?.reduce((acc: any, event: any) => {
            acc.by_type[event.event_type] = (acc.by_type[event.event_type] || 0) + 1;
            acc.by_source[event.source] = (acc.by_source[event.source] || 0) + 1;
            return acc;
          }, { by_type: {}, by_source: {} }) || { by_type: {}, by_source: {} };

          return NextResponse.json({
            events,
            total: events.length,
            stats: {
              total_events: events.length,
              ...eventStats,
              confidence_avg: events.reduce((sum: number, e: { confidence_score?: number | null }) => sum + (e.confidence_score || 0), 0) / events.length
            }
          });
        }
      } catch (dbError) {
        // This catch block handles errors from the database query
        // or if we manually throw to force a fallback.
        console.warn('Database query failed, serving demo events.', (dbError as Error).message);
      }
    }

    // Return demo data if Supabase is not configured or if the database query failed
    return NextResponse.json({
      events: [
        {
          id: 'demo-1',
          event_id: 'GW240101_123456',
          event_type: 'gravitational_wave',
          source: 'LIGO',
          time_utc: new Date().toISOString(),
          ra: 185.32,
          dec: 12.45,
          confidence_score: 0.95,
          magnitude: 23.4,
          metadata: { detector: 'H1,L1', snr: 12.5 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-2',
          event_id: 'GRB240101_234567',
          event_type: 'gamma_ray_burst',
          source: 'Fermi',
          time_utc: new Date(Date.now() - 3600000).toISOString(),
          ra: 142.18,
          dec: -8.72,
          confidence_score: 0.88,
          magnitude: 18.2,
          metadata: { energy_kev: 100000, fluence: 1.2e-6 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-3',
          event_id: 'AT240101_345678',
          event_type: 'optical_transient',
          source: 'ZTF',
          time_utc: new Date(Date.now() - 7200000).toISOString(),
          ra: 220.45,
          dec: 35.67,
          confidence_score: 0.76,
          magnitude: 19.8,
          metadata: { filter: 'g', exposure_time: 30 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      total: 3,
      stats: {
        total_events: 3,
        by_type: { gravitational_wave: 1, gamma_ray_burst: 1, optical_transient: 1 },
        by_source: { LIGO: 1, Fermi: 1, ZTF: 1 },
        confidence_avg: 0.863
      }
    });
  } catch (error) {
    console.error('Unhandled API error in GET /api/events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Return error if Supabase is not configured
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Database not configured - demo mode only' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    
    // Handle both single event and array of events
    const events = Array.isArray(body) ? body : [body];

    // Validate required fields for each event
    for (const event of events) {
      const { event_id, source, event_type, ra, dec, time_utc } = event;
      if (!event_id || !source || !event_type || ra === undefined || dec === undefined || !time_utc) {
        return NextResponse.json(
          { error: 'Missing required fields: event_id, source, event_type, ra, dec, time_utc' },
          { status: 400 }
        );
      }
    }

    // Insert events
    const eventsToInsert = events.map((event: any) => ({
      event_id: event.event_id,
      source: event.source,
      event_type: event.event_type,
      ra: event.ra,
      dec: event.dec,
      time_utc: event.time_utc,
      metadata: event.metadata || {},
      confidence_score: event.confidence_score || 0,
      magnitude: event.magnitude,
      error_radius_deg: event.error_radius_deg,
      follow_up_priority: event.follow_up_priority || 0,
    }));

    const { data: insertedEvents, error } = await supabaseAdmin
      .from('astro_events')
      .insert(eventsToInsert as any)
      .select();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create events' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      events: insertedEvents,
      count: insertedEvents?.length || 0 
    }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}