'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { AstroEvent } from '@/lib/supabase';
import { EventPair, CorrelationEngine } from '@/lib/correlation-engine';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventList from '@/components/EventList';
import CorrelationPanel from '@/components/CorrelationPanel';
import EventDetails from '@/components/EventDetails';
import { Telescope, Zap, Download, RefreshCw, Settings, Activity, Gauge, MapPin } from 'lucide-react';

// Dynamically import SkyMap to avoid SSR issues
const SkyMap = dynamic(() => import('@/components/SkyMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 glass rounded-xl">
      <div className="text-center">
        <div className="loading-dots mb-4">
          <div style={{ '--i': 0 } as any}></div>
          <div style={{ '--i': 1 } as any}></div>
          <div style={{ '--i': 2 } as any}></div>
        </div>
        <p className="text-starlight-400">Loading sky map...</p>
      </div>
    </div>
  )
});

export default function Home() {
  const [events, setEvents] = useState<AstroEvent[]>([]);
  const [correlations, setCorrelations] = useState<EventPair[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AstroEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [correlationParams, setCorrelationParams] = useState({
    timeWindowSeconds: 600,
    angularThresholdDeg: 1.0,
    minConfidenceScore: 0.1
  });

  // Fetch initial demo data
  useEffect(() => {
    fetchDemoData();
  }, []);

  const fetchDemoData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'all' })
      });
      
      const data = await response.json();
      if (data.events) {
        // Convert to AstroEvent format with IDs
        const formattedEvents: AstroEvent[] = data.events.map((event: any, index: number) => ({
          id: `demo-${index}`,
          event_id: event.event_id,
          source: event.source,
          event_type: event.event_type,
          ra: event.ra,
          dec: event.dec,
          time_utc: event.time_utc,
          metadata: event.metadata,
          created_at: new Date().toISOString()
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Failed to fetch demo data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCorrelate = () => {
    if (events.length < 2) return;
    
    setIsLoading(true);
    try {
      const foundCorrelations = CorrelationEngine.correlateEvents(events, correlationParams);
      setCorrelations(foundCorrelations);
    } catch (error) {
      console.error('Correlation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = () => {
    fetchDemoData();
  };

  // Stats for dashboard
  const stats = [
    {
      label: 'Total Events',
      value: events.length,
      icon: Activity,
      color: 'text-space-400',
    },
    {
      label: 'Correlations',
      value: correlations.length,
      icon: Gauge,
      color: 'text-cosmic-400',
    },
    {
      label: 'Sources',
      value: new Set(events.map(e => e.source)).size,
      icon: MapPin,
      color: 'text-nebula-400',
    },
  ];

  return (
    <div className="min-h-screen">
      <Header onSettingsClick={() => {}} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
            <span className="text-starlight-50">Mapping the </span>
            <span className="text-gradient">Cosmic</span>
            <span className="text-starlight-50"> Symphony</span>
          </h1>
          <p className="text-starlight-300 text-lg md:text-xl max-w-3xl mx-auto mb-8">
            Correlate gravitational waves, gamma-ray bursts, and optical transients 
            to unveil the hidden connections in our universe.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <motion.button
              onClick={handleRefreshData}
              disabled={isLoading}
              className="btn-primary flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </motion.button>
            
            <motion.button
              onClick={handleCorrelate}
              disabled={isLoading || events.length < 2}
              className="btn-secondary flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap className="w-4 h-4" />
              <span>Run Correlation</span>
            </motion.button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover-lift"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-starlight-400 text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-starlight-50">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Section - Sky Map */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="xl:col-span-3 space-y-8"
          >
            {/* Sky Map Panel */}
            <div className="card-highlight" id="skymap">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold text-starlight-50">
                  Celestial Event Map
                </h2>
                <div className="flex items-center space-x-2 text-starlight-400">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm">{events.length} events plotted</span>
                </div>
              </div>
              <div className="min-h-[500px]">
                <SkyMap 
                  events={events}
                  correlatedPairs={correlations}
                  onEventClick={setSelectedEvent}
                />
              </div>
            </div>

            {/* Event List Panel */}
            <div className="card" id="events">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold text-starlight-50">
                  Event Timeline
                </h2>
                <motion.button
                  className="btn-secondary text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </motion.button>
              </div>
              <EventList 
                events={events}
                onEventSelect={setSelectedEvent}
                selectedEvent={selectedEvent || undefined}
              />
            </div>
          </motion.div>

          {/* Right Section - Controls and Details */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Correlation Panel */}
            <div className="card" id="correlations">
              <h3 className="font-display text-lg font-bold text-starlight-50 mb-4">
                Correlation Engine
              </h3>
              <CorrelationPanel 
                events={events}
                onParametersChange={setCorrelationParams}
                correlations={correlations}
                onCorrelate={handleCorrelate}
                isLoading={isLoading}
              />
            </div>

            {/* Event Details */}
            <AnimatePresence>
              {selectedEvent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="card-highlight"
                >
                  <h3 className="font-display text-lg font-bold text-starlight-50 mb-4">
                    Event Details
                  </h3>
                  <EventDetails 
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-display text-lg font-bold text-starlight-50 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <motion.button
                  className="w-full btn-secondary justify-start"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Alerts
                </motion.button>
                
                <motion.button
                  className="w-full btn-secondary justify-start"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </motion.button>
                
                <motion.button
                  className="w-full btn-secondary justify-start"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Telescope className="w-4 h-4 mr-2" />
                  Observatory Status
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
