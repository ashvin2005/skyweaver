import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey ? 
  createClient<Database>(supabaseUrl, supabaseServiceKey) : null;

export async function POST(request: NextRequest) {
  // Return demo export if Supabase is not configured
  if (!supabaseAdmin) {
    const demoData = {
      events: [
        {
          id: 'demo-1',
          event_type: 'gravitational_wave',
          source: 'ligo',
          time_utc: new Date().toISOString(),
          coordinates: { ra: 185.32, dec: 12.45 },
          confidence_score: 0.95
        }
      ],
      correlations: [
        {
          id: 'demo-corr-1',
          event1_id: 'demo-1',
          event2_id: 'demo-2',
          correlation_type: 'temporal',
          confidence_score: 0.75
        }
      ]
    };

    const { format = 'json' } = await request.json();
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvContent = 'id,event_type,source,time_utc,confidence_score\n' +
        demoData.events.map(e => `${e.id},${e.event_type},${e.source},${e.time_utc},${e.confidence_score}`).join('\n');
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="demo-events.csv"'
        }
      });
    }

    return NextResponse.json(demoData);
  }

  try {
    const body = await request.json();
    const { 
      format = 'json',
      filter = {},
      includeCorrelations = false,
      userId 
    } = body;

    // Build events query with filters
    let eventsQuery = supabaseAdmin
      .from('astro_events')
      .select('*')
      .eq('status', 'active')
      .order('time_utc', { ascending: false });

    // Apply filters
    if (filter.eventTypes?.length > 0) {
      eventsQuery = eventsQuery.in('event_type', filter.eventTypes);
    }
    if (filter.sources?.length > 0) {
      eventsQuery = eventsQuery.in('source', filter.sources);
    }
    if (filter.timeRange?.start) {
      eventsQuery = eventsQuery.gte('time_utc', filter.timeRange.start);
    }
    if (filter.timeRange?.end) {
      eventsQuery = eventsQuery.lte('time_utc', filter.timeRange.end);
    }
    if (filter.confidenceThreshold) {
      eventsQuery = eventsQuery.gte('confidence_score', filter.confidenceThreshold);
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('Events fetch error:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    let correlations = null;
    if (includeCorrelations) {
      const { data: correlationsData, error: correlationsError } = await supabaseAdmin
        .from('event_correlations')
        .select(`
          *,
          event1:event1_id(id, event_id, source, event_type),
          event2:event2_id(id, event_id, source, event_type)
        `)
        .gte('confidence_score', filter.confidenceThreshold || 0);

      if (correlationsError) {
        console.error('Correlations fetch error:', correlationsError);
      } else {
        correlations = correlationsData;
      }
    }

    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        format,
        totalEvents: events?.length || 0,
        totalCorrelations: correlations?.length || 0,
        filters: filter,
        version: '1.0'
      },
      events: events || [],
      ...(includeCorrelations && { correlations: correlations || [] })
    };

    // Log export for audit trail
    if (userId) {
      await supabaseAdmin
        .from('data_exports')
        .insert({
          user_id: userId,
          export_type: format as any,
          filter_config: filter,
          record_count: events?.length || 0,
          file_size_bytes: JSON.stringify(exportData).length,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        } as any);
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(events || []);
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="skyweaver_events_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="skyweaver_data_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported format. Use "csv" or "json"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function convertToCSV(events: any[]): string {
  if (events.length === 0) return '';

  // Define CSV headers
  const headers = [
    'event_id',
    'source',
    'event_type',
    'ra',
    'dec',
    'time_utc',
    'confidence_score',
    'magnitude',
    'error_radius_deg',
    'follow_up_priority',
    'status',
    'created_at'
  ];

  // Create CSV content
  const csvRows = [
    headers.join(','), // Header row
    ...events.map(event => {
      return headers.map(header => {
        const value = event[header];
        // Handle special cases for CSV formatting
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(',');
    })
  ];

  return csvRows.join('\n');
}
