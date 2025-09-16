'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AstroEvent } from '@/lib/supabase';

// Dynamically import Plot to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading sky map...</div>
}) as any;

interface SkyMapProps {
  events: AstroEvent[];
  correlatedPairs?: Array<{
    event1: AstroEvent;
    event2: AstroEvent;
    confidenceScore: number;
  }>;
  onEventClick?: (event: AstroEvent) => void;
}

const SkyMap: React.FC<SkyMapProps> = ({ events, correlatedPairs = [], onEventClick }) => {
  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'gravitational_wave': return '#a855f7'; // cosmic-500
      case 'gamma_ray_burst': return '#22c55e'; // nebula-500
      case 'optical_transient': return '#6366f1'; // space-500
      default: return '#94a3b8'; // starlight-500
    }
  };

  const getEventSymbol = (eventType: string) => {
    switch (eventType) {
      case 'gravitational_wave': return 'circle';
      case 'gamma_ray_burst': return 'diamond';
      case 'optical_transient': return 'star';
      default: return 'square';
    }
  };

  const getEventDisplayName = (eventType: string) => {
    switch (eventType) {
      case 'gravitational_wave': return 'Gravitational Waves';
      case 'gamma_ray_burst': return 'Gamma-Ray Bursts';
      case 'optical_transient': return 'Optical Transients';
      default: return eventType.replace('_', ' ').toUpperCase();
    }
  };

  // Group events by type for better visualization
  const eventsByType = events.reduce((acc, event) => {
    if (!acc[event.event_type]) {
      acc[event.event_type] = [];
    }
    acc[event.event_type].push(event);
    return acc;
  }, {} as Record<string, AstroEvent[]>);

  const traces = Object.entries(eventsByType).map(([eventType, typeEvents]) => ({
    x: typeEvents.map(e => e.ra),
    y: typeEvents.map(e => e.dec),
    mode: 'markers' as const,
    type: 'scatter' as const,
    name: getEventDisplayName(eventType),
    marker: {
      color: getEventColor(eventType),
      size: 14,
      symbol: getEventSymbol(eventType),
      line: {
        color: 'white',
        width: 2
      }
    },
    text: typeEvents.map(e => 
      `${e.event_id}<br>` +
      `Type: ${e.event_type}<br>` +
      `Time: ${new Date(e.time_utc).toISOString().slice(0, 19)}<br>` +
      `RA: ${e.ra.toFixed(3)}°<br>` +
      `Dec: ${e.dec.toFixed(3)}°`
    ),
    hovertemplate: '%{text}<extra></extra>',
    customdata: typeEvents
  }));

  // Add correlation lines
  if (correlatedPairs.length > 0) {
    const correlationTrace: any = {
      x: correlatedPairs.flatMap(pair => [pair.event1.ra, pair.event2.ra, null]),
      y: correlatedPairs.flatMap(pair => [pair.event1.dec, pair.event2.dec, null]),
      mode: 'lines' as const,
      type: 'scatter' as const,
      name: 'Event Correlations',
      line: {
        color: '#22c55e', // nebula-500
        width: 3,
        dash: 'dot'
      },
      hoverinfo: 'skip' as const,
      showlegend: true
    };
    traces.push(correlationTrace);
  }

  return (
    <div className="w-full h-full bg-starlight-950/50 rounded-xl overflow-hidden backdrop-blur-sm border border-starlight-700/30">
      <Plot
        data={traces}
        layout={{
          title: {
            text: 'Celestial Coordinate System',
            font: { 
              color: '#f1f5f9', // starlight-100
              size: 18,
              family: 'Poppins, sans-serif'
            },
            x: 0.5,
            xanchor: 'center'
          },
          xaxis: {
            title: {
              text: 'Right Ascension (degrees)',
              font: { 
                color: '#cbd5e1', // starlight-400
                size: 14,
                family: 'Inter, sans-serif'
              }
            },
            range: [0, 360],
            color: '#cbd5e1', // starlight-400
            gridcolor: '#475569', // starlight-600
            zerolinecolor: '#64748b', // starlight-500
            tickfont: { 
              color: '#94a3b8', // starlight-500
              size: 12 
            },
            showgrid: true,
            gridwidth: 1
          },
          yaxis: {
            title: {
              text: 'Declination (degrees)',
              font: { 
                color: '#cbd5e1', // starlight-400
                size: 14,
                family: 'Inter, sans-serif'
              }
            },
            range: [-90, 90],
            color: '#cbd5e1', // starlight-400
            gridcolor: '#475569', // starlight-600
            zerolinecolor: '#64748b', // starlight-500
            tickfont: { 
              color: '#94a3b8', // starlight-500
              size: 12 
            },
            showgrid: true,
            gridwidth: 1
          },
          plot_bgcolor: 'rgba(15, 23, 42, 0.8)', // space-950 with opacity
          paper_bgcolor: 'rgba(15, 23, 42, 0.4)', // space-950 with opacity
          font: { 
            color: '#f1f5f9', // starlight-100
            family: 'Inter, sans-serif'
          },
          legend: {
            font: { 
              color: '#f1f5f9', // starlight-100
              size: 12,
              family: 'Inter, sans-serif'
            },
            bgcolor: 'rgba(30, 41, 59, 0.8)', // starlight-800 with opacity
            bordercolor: '#475569', // starlight-600
            borderwidth: 1,
            x: 1,
            xanchor: 'right',
            y: 1,
            yanchor: 'top'
          },
          margin: { t: 60, r: 20, b: 60, l: 80 },
          hovermode: 'closest',
          showlegend: true
        }}
        config={{
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
          toImageButtonOptions: {
            format: 'png',
            filename: 'skyweaver-skymap',
            height: 600,
            width: 800,
            scale: 2
          }
        }}
        style={{ width: '100%', height: '100%' }}
        onClick={(data: any) => {
          if (data.points && data.points[0] && onEventClick) {
            const point = data.points[0];
            if (point.customdata) {
              onEventClick(point.customdata as AstroEvent);
            }
          }
        }}
      />
    </div>
  );
};

export default SkyMap;