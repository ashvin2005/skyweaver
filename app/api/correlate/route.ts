import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { CorrelationEngine, CorrelationParams } from '@/lib/correlation-engine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey ? 
  createClient<Database>(supabaseUrl, supabaseServiceKey) : null;

export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json();
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

    // Run correlation analysis
    const correlations = CorrelationEngine.correlateEvents(events, {
      timeWindowSeconds,
      angularThresholdDeg,
      minConfidenceScore
    });

    // Store correlations in database
    if (correlations.length > 0) {
      const correlationRecords = correlations.map(corr => ({
        event1_id: corr.event1.id,
        event2_id: corr.event2.id,
        time_diff_seconds: corr.timeDiffSeconds,
        angular_separation_deg: corr.angularSeparationDeg,
        correlation_type: corr.correlationType,
        confidence_score: corr.confidenceScore
      }));

      const { error: insertError } = await supabaseAdmin
        .from('event_correlations')
        .insert(correlationRecords as any);

      if (insertError) {
        console.error('Failed to store correlations:', insertError);
        // Continue anyway, just log the error
      }
    }

    // Find event clusters
    const clusters = CorrelationEngine.findEventClusters(correlations);

    return NextResponse.json({
      correlations: correlations.map(corr => ({
        event1: corr.event1,
        event2: corr.event2,
        timeDiffSeconds: corr.timeDiffSeconds,
        angularSeparationDeg: corr.angularSeparationDeg,
        correlationType: corr.correlationType,
        confidenceScore: corr.confidenceScore
      })),
      clusters: clusters.map(cluster => ({
        events: cluster,
        size: cluster.length
      })),
      parameters: {
        timeWindowSeconds,
        angularThresholdDeg,
        minConfidenceScore
      },
      summary: {
        totalEvents: events.length,
        correlationsFound: correlations.length,
        clustersFound: clusters.length
      }
    });
  } catch (error) {
    console.error('Correlation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}