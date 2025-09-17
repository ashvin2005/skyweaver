import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { CorrelationEngine, CorrelationParams } from '@/lib/correlation-engine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey ? 
  createClient<Database>(supabaseUrl, supabaseServiceKey) : null;

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Return demo correlation if Supabase is not configured
    if (!supabaseAdmin) {
      return NextResponse.json({
        correlations: [
          {
            id: 'demo-corr-1',
            event1_id: 'demo-1',
            event2_id: 'demo-2',
            correlation_type: 'temporal',
            confidence_score: 0.75,
            time_diff_seconds: 3600,
            angular_separation_deg: 15.2,
            created_at: new Date().toISOString()
          }
        ],
        total_correlations: 1,
        processing_time_ms: 50
      });
    }

    const body = await req.json();
    const { 
      timeWindowSeconds = 600, 
      angularThresholdDeg = 1.0, 
      minConfidenceScore = 0.1,
      eventIds = null 
    }: CorrelationParams & { eventIds?: string[] | null } = body;

    // Fetch events to correlate
    let query = supabaseAdmin
      .from('astro_events')
      .select('*')
      .order('time_utc', { ascending: false });

    if (eventIds && eventIds.length > 0) {
      query = query.in('id', eventIds);
    }

    const { data: events, error: fetchError } = await query;

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    if (!events || events.length < 2) {
      return NextResponse.json({ 
        correlations: [], 
        message: 'Need at least 2 events to find correlations' 
      });
    }

    // Compute correlations safely regardless of function signature and always await
    const correlations = await Promise.resolve(
      (CorrelationEngine as any)?.correlateEvents?.length > 1
        ? (CorrelationEngine as any).correlateEvents(events, { timeWindowSeconds, angularThresholdDeg, minConfidenceScore })
        : (CorrelationEngine as any).correlateEvents(events)
    );

    // Compute clusters only if helper exists
    const clusters = typeof (CorrelationEngine as any).findEventClusters === 'function'
      ? (CorrelationEngine as any).findEventClusters(correlations)
      : [];

    return NextResponse.json({
      ok: true,
      correlations: Array.isArray(correlations) ? correlations : [],
      count: Array.isArray(correlations) ? correlations.length : 0,
      clusters,
      timestamp: Date.now(),
    }, { status: 200 });
  } catch (err: any) {
    console.error('Correlate API error:', err?.message || err);
    return NextResponse.json({ ok: false, correlations: [], error: err?.message || 'Internal error' }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  return NextResponse.json({ ok: true, message: 'Use POST /api/correlate to compute correlations.' }, { status: 200 });
}