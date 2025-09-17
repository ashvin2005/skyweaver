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
import SettingsModal from '@/components/SettingsModal';
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
  X
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
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [showLiveDataNotification, setShowLiveDataNotification] = useState(false);
  const [correlationResults, setCorrelationResults] = useState<any[]>([]);
  const [correlationSummary, setCorrelationSummary] = useState<any>(null);
  const [showCorrelationResults, setShowCorrelationResults] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [correlationError, setCorrelationError] = useState<string | null>(null);
  
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
    error: realtimeError,
    addEvent,
    updateEvent,
    removeEvent,
    loading: eventsLoading
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
      
      if (data.events && data.events.length > 0) {
        // Force refresh by clearing and re-adding events
        // This ensures the UI updates even in demo mode
        showToastMessage(`Refreshed ${data.events.length} events from data sources`);
      } else {
        showToastMessage('No events found for current filters');
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      showToastMessage('Failed to refresh data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    setSelectedEvent(null); // Clear selected event
    setCorrelationResults([]); // Clear correlation results
    setShowCorrelationResults(false);
    
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      
      if (data.events && data.events.length > 0) {
        showToastMessage(`Refreshed ${data.events.length} events from astronomical databases`);
      } else {
        showToastMessage('No events available');
      }
    } catch (error) {
      console.error('Failed to refresh events:', error);
      showToastMessage('Failed to refresh data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCorrelate = async () => {
    try {
      setIsLoading(true);
      setCorrelationError(null);
      
      const payload: any = {
        timeWindowSeconds: currentFilter.maxTimeWindow || 600,
        angularThresholdDeg: currentFilter.maxAngularSeparation || 1.0,
        minConfidenceScore: currentFilter.confidenceThreshold || 0.1
      };

      const res = await fetch('/api/correlate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to compute correlations');
      }

      setCorrelationResults(Array.isArray(data?.correlations) ? data.correlations : []);
    } catch (e: any) {
      console.error('handleCorrelate error:', e?.message || e);
      setCorrelationResults([]);
      setCorrelationError(e?.message || 'Unexpected error');
    } finally {
      setShowCorrelationResults(true);
      setIsLoading(false);
    }
  };

  const handleApplyFilter = (newFilter: FilterConfig) => {
    setCurrentFilter(newFilter);
  };

  // Handle live data toggle with notification
  const handleLiveDataToggle = () => {
    const newState = !realtimeEnabled;
    setRealtimeEnabled(newState);
    setShowLiveDataNotification(true);
    
    // Show appropriate message
    if (newState) {
      showToastMessage(isSupabaseConfigured ? 'Real-time updates enabled' : 'Demo mode - real-time simulation active');
    } else {
      showToastMessage('Real-time updates disabled');
    }
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowLiveDataNotification(false);
    }, 3000);
  };

  const handleQuickExportJSON = () => {
    try {
      const exportData = {
        events: events,
        correlations: correlationResults,
        filters: currentFilter,
        timestamp: new Date().toISOString(),
        summary: {
          totalEvents: events.length,
          correlationsFound: correlationResults.length,
          sources: Array.from(new Set(events.map(e => e.source)))
        }
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skyweaver-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToastMessage(`Exported ${events.length} events and ${correlationResults.length} correlations`);
    } catch (error) {
      console.error('Export failed:', error);
      showToastMessage('Export failed. Please try again.');
    }
  };

  const handleQuickExportCSV = () => {
    try {
      const csvHeaders = 'Event ID,Type,Source,Time (UTC),RA (deg),Dec (deg),SNR,Distance (Mpc)\n';
      const csvRows = events.map(event => {
        const snr = event.metadata?.snr || 'N/A';
        const distance = event.metadata?.distance || 'N/A';
        return `"${event.event_id}","${event.event_type}","${event.source}","${event.time_utc}",${event.ra},${event.dec},"${snr}","${distance}"`;
      }).join('\n');
      
      const csvContent = csvHeaders + csvRows;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skyweaver-events-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToastMessage(`Exported ${events.length} events to CSV`);
    } catch (error) {
      console.error('CSV export failed:', error);
      showToastMessage('CSV export failed. Please try again.');
    }
  };

  const handleShowStatistics = () => {
    const eventTypes = Array.from(new Set(events.map(e => e.event_type)));
    const sources = Array.from(new Set(events.map(e => e.source)));
    const timeRange = events.length > 0 ? {
      earliest: events.reduce((min, e) => e.time_utc < min ? e.time_utc : min, events[0].time_utc),
      latest: events.reduce((max, e) => e.time_utc > max ? e.time_utc : max, events[0].time_utc)
    } : null;
    
    const stats = `
📊 SkyWeaver Event Statistics

🌌 Total Events: ${events.length}
🔗 Correlations Found: ${correlationResults.length}
📡 Data Sources: ${sources.length} (${sources.join(', ')})
🎯 Event Types: ${eventTypes.length} (${eventTypes.join(', ')})

⏰ Time Range: ${timeRange ? 
  `${new Date(timeRange.earliest).toLocaleDateString()} to ${new Date(timeRange.latest).toLocaleDateString()}` : 
  'No events'
}

🔬 Analysis Parameters:
• Time Window: ${(currentFilter.maxTimeWindow || 3600) / 3600} hours
• Angular Threshold: ${currentFilter.maxAngularSeparation}°
• Confidence Threshold: ${(currentFilter.confidenceThreshold * 100).toFixed(1)}%
    `.trim();
    
    alert(stats);
  };

  const handleClearAnalysis = () => {
    setSelectedEvent(null);
    setCorrelationResults([]);
    setCorrelationSummary(null);
    setShowCorrelationResults(false);
    showToastMessage('Analysis cleared - ready for new correlation run');
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
      <Header 
        onSettingsClick={() => setSettingsModalOpen(true)} 
        onLiveDataClick={handleLiveDataToggle}
        isLiveDataEnabled={realtimeEnabled}
      />
      
      {/* Configuration Notice */}

      
      {/* Real-time Connection Status */}
      <motion.div 
        className="fixed top-20 right-4 z-40"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${
          !isSupabaseConfigured
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            : (eventsConnected && correlationsConnected) && realtimeEnabled
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {!isSupabaseConfigured ? (
            <Activity className="w-4 h-4" />
          ) : (eventsConnected && correlationsConnected) && realtimeEnabled ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span>
            {!isSupabaseConfigured 
              ? 'Demo Mode' 
              : (eventsConnected && correlationsConnected) && realtimeEnabled 
              ? 'Live' 
              : realtimeEnabled ? 'Connecting...' : 'Offline'
            }
          </span>
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
              onClick={handleRefreshData}
              disabled={isLoading}
              className="btn-primary flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
            </motion.button>
            
            <motion.button
              onClick={handleCorrelate}
              disabled={isLoading || events.length < 2}
              className="btn-secondary flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
              <span>{isLoading ? 'Finding...' : 'Find Correlations'}</span>
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
                    onClick={handleLiveDataToggle}
                    className={`btn-secondary text-sm ${realtimeEnabled ? 'bg-green-500/20 border-green-500/30 text-green-300' : ''}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {realtimeEnabled ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
                    {realtimeEnabled ? 'Live' : 'Offline'}
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
                  onClick={handleShowStatistics}
                  className="w-full btn-secondary justify-start"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Gauge className="w-4 h-4 mr-2" />
                  View Statistics
                </motion.button>
                
                <motion.button
                  onClick={handleQuickExportJSON}
                  disabled={events.length === 0}
                  className="w-full btn-secondary justify-start"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </motion.button>
                
                <motion.button
                  onClick={handleQuickExportCSV}
                  disabled={events.length === 0}
                  className="w-full btn-secondary justify-start"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </motion.button>
                
                <motion.button
                  onClick={handleClearAnalysis}
                  disabled={!selectedEvent && correlationResults.length === 0}
                  className="w-full btn-secondary justify-start"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Analysis
                </motion.button>
                
                <motion.button
                  onClick={handleLiveDataToggle}
                  className={`w-full btn-secondary justify-start ${realtimeEnabled ? 'bg-green-500/20 border-green-500/30 text-green-300' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {realtimeEnabled ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
                  {realtimeEnabled ? 'Disable' : 'Enable'} Real-time
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Correlation Results Modal */}
      <AnimatePresence>
        {showCorrelationResults && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-space-900/80 backdrop-blur-sm z-50"
              onClick={() => setShowCorrelationResults(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="fixed inset-4 md:inset-8 lg:inset-16 bg-space-800 rounded-2xl border border-starlight-700/30 z-50 overflow-hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-starlight-700/30">
                  <div>
                    <h2 className="text-2xl font-bold text-starlight-50">Correlation Results</h2>
                    {correlationSummary && (
                      <p className="text-starlight-400 mt-1">
                        Found {correlationSummary.correlationsFound} correlations among {correlationSummary.totalEvents} events
                      </p>
                    )}
                  </div>
                  <motion.button
                    onClick={() => setShowCorrelationResults(false)}
                    className="p-2 rounded-lg hover:bg-starlight-700/50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-6 h-6 text-starlight-300" />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {correlationResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Zap className="w-16 h-16 text-starlight-400 mb-4" />
                      <h3 className="text-xl font-semibold text-starlight-50 mb-2">No Correlations Found</h3>
                      <p className="text-starlight-400 max-w-md">
                        Try adjusting the correlation parameters or time windows to find related events.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {correlationResults.map((corr, idx) => (
                <div key={idx} className="card">
                  <div className="text-sm opacity-80 mb-2">Correlation #{idx + 1}</div>
                  <pre className="text-xs overflow-auto max-h-64 bg-black/5 p-3 rounded">
{JSON.stringify(corr, null, 2)}
                  </pre>
                </div>
              ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
      
      <SettingsModal 
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '50%' }}
            animate={{ opacity: 1, y: 0, x: '50%' }}
            exit={{ opacity: 0, y: 50, x: '50%' }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-space-800 border border-cosmic-500/30 text-starlight-50 px-6 py-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cosmic-400" />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
