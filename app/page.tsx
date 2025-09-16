'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { AstroEvent, FilterConfig, EVENT_TYPES, isSupabaseConfigured } from '@/lib/supabase';
import { EventPair } from '@/lib/correlation-engine';
import { useAuth } from '@/lib/auth-context';
import { useEventsWithRealtime, useCorrelationsWithRealtime } from '@/lib/realtime-hooks';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventList from '@/components/EventList';
import CorrelationPanel from '@/components/CorrelationPanel';
import EventDetails from '@/components/EventDetails';
import AuthModal from '@/components/AuthModal';
import UserProfile from '@/components/UserProfile';
import FilterPanel from '@/components/FilterPanel';
import ExportModal from '@/components/ExportModal';
import { 
  Telescope, 
  Zap, 
  Download, 
  RefreshCw, 
  Settings, 
  Activity, 
  Gauge, 
  MapPin, 
  Filter,
  Wifi,
  WifiOff,
  User,
  LogIn,
  AlertTriangle
} from 'lucide-react';

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
  const { user, loading: authLoading } = useAuth();
  
  // State management
  const [selectedEvent, setSelectedEvent] = useState<AstroEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  // Filter configuration
  const [currentFilter, setCurrentFilter] = useState<FilterConfig>({
    eventTypes: [...EVENT_TYPES],
    sources: [],
    timeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    coordinates: {
      ra: { min: 0, max: 360 },
      dec: { min: -90, max: 90 }
    },
    confidenceThreshold: 0.1,
    maxAngularSeparation: 5.0,
    maxTimeWindow: 3600
  });

  // Real-time data hooks
  const {
    events,
    isConnected: eventsConnected,
    realtimeEnabled,
    setRealtimeEnabled,
    error: realtimeError
  } = useEventsWithRealtime();

  const {
    correlations,
    isConnected: correlationsConnected
  } = useCorrelationsWithRealtime();

  // Fetch initial data
  useEffect(() => {
    fetchEvents();
  }, [currentFilter]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (currentFilter.eventTypes.length > 0) {
        params.append('event_types', currentFilter.eventTypes.join(','));
      }
      if (currentFilter.sources.length > 0) {
        params.append('sources', currentFilter.sources.join(','));
      }
      if (currentFilter.timeRange.start) {
        params.append('start_time', currentFilter.timeRange.start + 'T00:00:00Z');
      }
      if (currentFilter.timeRange.end) {
        params.append('end_time', currentFilter.timeRange.end + 'T23:59:59Z');
      }
      if (currentFilter.confidenceThreshold) {
        params.append('min_confidence', currentFilter.confidenceThreshold.toString());
      }
      
      const response = await fetch(`/api/events?${params}`);
      const data = await response.json();
      
      if (data.events) {
        // Events will be updated via the realtime hook
        // For now, we could set initial state if needed
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCorrelate = async () => {
    if (events.length < 2) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/correlate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeWindowSeconds: currentFilter.maxTimeWindow || 600,
          angularThresholdDeg: currentFilter.maxAngularSeparation || 1.0,
          minConfidenceScore: currentFilter.confidenceThreshold || 0.1
        })
      });
      
      const data = await response.json();
      // Correlations will be updated via the realtime hook
    } catch (error) {
      console.error('Correlation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilter = (newFilter: FilterConfig) => {
    setCurrentFilter(newFilter);
  };

  // Convert correlations to EventPair format for compatibility
  const eventPairs: EventPair[] = correlations.map(corr => ({
    event1: events.find(e => e.id === corr.event1_id) || {} as AstroEvent,
    event2: events.find(e => e.id === corr.event2_id) || {} as AstroEvent,
    timeDiffSeconds: corr.time_diff_seconds,
    angularSeparationDeg: corr.angular_separation_deg,
    correlationType: corr.correlation_type,
    confidenceScore: corr.confidence_score
  })).filter(pair => pair.event1.id && pair.event2.id);

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
      <Header />
      
      {/* Configuration Notice */}
      {!isSupabaseConfigured && (
        <motion.div 
          className="fixed top-20 left-4 right-4 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mx-auto max-w-2xl">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="text-yellow-400 font-semibold">Demo Mode</h3>
                <p className="text-yellow-300 text-sm mt-1">
                  Configure Supabase credentials in <code className="bg-yellow-400/20 px-1 rounded">.env.local</code> to enable authentication and real-time features.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Real-time Connection Status */}
      <motion.div 
        className="fixed top-20 right-4 z-40"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${
          eventsConnected && correlationsConnected
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {eventsConnected && correlationsConnected ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span>{eventsConnected && correlationsConnected ? 'Live' : 'Offline'}</span>
        </div>
      </motion.div>

      {/* Auth/User Controls */}
      <motion.div 
        className="fixed top-20 left-4 z-40"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {user ? (
          <motion.button
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-cosmic-500/20 text-cosmic-300 border border-cosmic-500/30 rounded-lg text-sm hover:bg-cosmic-500/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <User className="w-4 h-4" />
            <span>{user.email?.split('@')[0]}</span>
          </motion.button>
        ) : (
          <motion.button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-starlight-700/50 text-starlight-300 border border-starlight-600/50 rounded-lg text-sm hover:bg-starlight-600/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </motion.button>
        )}
      </motion.div>
      
      <main className="container mx-auto px-4 py-8 relative z-10"
            style={{ paddingTop: '120px' }}>
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
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <motion.button
              onClick={fetchEvents}
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

            <motion.button
              onClick={() => setFilterModalOpen(true)}
              className="btn-secondary flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </motion.button>

            <motion.button
              onClick={() => setExportModalOpen(true)}
              disabled={events.length === 0}
              className="btn-secondary flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
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
                  correlatedPairs={eventPairs}
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
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={() => setRealtimeEnabled(!realtimeEnabled)}
                    className={`btn-secondary text-sm ${realtimeEnabled ? 'bg-green-500/20 border-green-500/30 text-green-300' : ''}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {realtimeEnabled ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
                    Real-time
                  </motion.button>
                  <motion.button
                    onClick={() => setExportModalOpen(true)}
                    className="btn-secondary text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </motion.button>
                </div>
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
                correlations={eventPairs}
                onParametersChange={(params) => {
                  setCurrentFilter({
                    ...currentFilter,
                    maxTimeWindow: params.timeWindowSeconds,
                    maxAngularSeparation: params.angularThresholdDeg,
                    confidenceThreshold: params.minConfidenceScore
                  });
                }}
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
                  onClick={() => setFilterModalOpen(true)}
                  className="w-full btn-secondary justify-start"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Configure Filters
                </motion.button>
                
                <motion.button
                  onClick={() => setExportModalOpen(true)}
                  className="w-full btn-secondary justify-start"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </motion.button>
                
                <motion.button
                  onClick={() => setRealtimeEnabled(!realtimeEnabled)}
                  className="w-full btn-secondary justify-start"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {realtimeEnabled ? <WifiOff className="w-4 h-4 mr-2" /> : <Wifi className="w-4 h-4 mr-2" />}
                  {realtimeEnabled ? 'Disable' : 'Enable'} Real-time
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
      
      <UserProfile 
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
      
      <FilterPanel 
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApplyFilter={handleApplyFilter}
        currentFilter={currentFilter}
      />
      
      <ExportModal 
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        currentFilter={currentFilter}
        totalEvents={events.length}
      />
    </div>
  );
}
