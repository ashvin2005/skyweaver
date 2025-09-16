import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { AstroDataFetcher } from '@/lib/astro-apis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client for server-side operations
const supabaseAdmin = supabaseUrl && supabaseServiceKey ? 
  createClient<Database>(supabaseUrl, supabaseServiceKey) : null;

export async function GET(request: NextRequest) {
  try {
    // If Supabase is configured, get sources from database
    if (supabaseAdmin) {
      const { data: sources, error } = await supabaseAdmin
        .from('data_sources')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Database error:', error);
        // Fall back to demo data
      } else if (sources && sources.length > 0) {
        return NextResponse.json({ sources });
      }
    }

    // Demo/fallback data
    const demoSources = [
      {
        id: 'ligo-virgo',
        name: 'LIGO-Virgo Collaboration',
        type: 'gravitational_wave',
        description: 'Gravitational wave detections from LIGO and Virgo observatories',
        is_active: true,
        url: 'https://www.gw-openscience.org/eventapi/json/GWTC/',
        last_sync: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'ztf',
        name: 'Zwicky Transient Facility',
        type: 'optical_transient',
        description: 'Optical transient discoveries from ZTF survey',
        is_active: true,
        url: 'https://ztf.uw.edu/alerts/',
        last_sync: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'fermi-gbm',
        name: 'Fermi Gamma-ray Burst Monitor',
        type: 'gamma_ray_burst',
        description: 'Gamma-ray burst detections from Fermi GBM',
        is_active: true,
        url: 'https://heasarc.gsfc.nasa.gov/db-perl/W3Browse/w3table.pl?tablehead=name%3Dfermigbrst',
        last_sync: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'swift-bat',
        name: 'Swift Burst Alert Telescope',
        type: 'gamma_ray_burst',
        description: 'Gamma-ray burst and X-ray transient detections from Swift BAT',
        is_active: true,
        url: 'https://swift.gsfc.nasa.gov/results/batgrbcat/',
        last_sync: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ];

    return NextResponse.json({ sources: demoSources });
  } catch (error) {
    console.error('Sources API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { source, startTime, endTime } = await request.json();

    let events = [];

    switch (source) {
      case 'all':
        events = await AstroDataFetcher.fetchAllEvents(startTime, endTime);
        break;
      case 'ligo-virgo':
        events = await AstroDataFetcher.fetchGravitationalWaves(startTime, endTime);
        break;
      case 'ztf':
        events = await AstroDataFetcher.fetchOpticalTransients(startTime, endTime);
        break;
      case 'fermi-gbm':
      case 'swift-bat':
        events = await AstroDataFetcher.fetchGammaRayBursts(startTime, endTime);
        break;
      default:
        return NextResponse.json({ error: 'Unknown source' }, { status: 400 });
    }

    return NextResponse.json({ 
      events,
      source,
      count: events.length,
      timeRange: { startTime, endTime }
    });
  } catch (error) {
    console.error('Data fetch API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}