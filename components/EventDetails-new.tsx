'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AstroEvent } from '@/lib/supabase';
import { X, ExternalLink, Calendar, MapPin, Database, Zap, Radio, Eye, Star, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EventDetailsProps {
  event: AstroEvent | null;
  onClose: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ event, onClose }) => {
  if (!event) return null;

  const formatMetadata = (metadata: any) => {
    if (!metadata || typeof metadata !== 'object') return [];
    
    return Object.entries(metadata).map(([key, value]) => ({
      key: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: typeof value === 'number' ? 
        (value < 0.001 ? value.toExponential(2) : value.toFixed(3)) : 
        String(value)
    }));
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'gravitational_wave': return <Radio className="w-6 h-6" />;
      case 'gamma_ray_burst': return <Zap className="w-6 h-6" />;
      case 'optical_transient': return <Eye className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'gravitational_wave': return 'bg-cosmic-500/20 border-cosmic-400/50 text-cosmic-300';
      case 'gamma_ray_burst': return 'bg-nebula-500/20 border-nebula-400/50 text-nebula-300';
      case 'optical_transient': return 'bg-space-500/20 border-space-400/50 text-space-300';
      default: return 'bg-starlight-500/20 border-starlight-400/50 text-starlight-300';
    }
  };

  const getEventTypeDisplay = (eventType: string) => {
    switch (eventType) {
      case 'gravitational_wave': return 'Gravitational Wave Event';
      case 'gamma_ray_burst': return 'Gamma-Ray Burst';
      case 'optical_transient': return 'Optical Transient';
      default: return eventType.replace('_', ' ').toUpperCase();
    }
  };

  const metadataEntries = formatMetadata(event.metadata);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-strong rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-starlight-600/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 glass-strong rounded-t-xl px-6 py-4 border-b border-starlight-600/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-full border ${getEventTypeColor(event.event_type)}`}>
                  {getEventIcon(event.event_type)}
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-starlight-100">
                    {event.event_id}
                  </h2>
                  <p className="text-starlight-400">
                    {getEventTypeDisplay(event.event_type)}
                  </p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 glass rounded-lg hover:bg-starlight-700/50 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-starlight-400" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="w-4 h-4 text-space-400" />
                  <h3 className="font-medium text-starlight-200">Detection Time</h3>
                </div>
                <p className="text-starlight-100 font-mono text-sm">
                  {new Date(event.time_utc).toLocaleString()}
                </p>
                <p className="text-starlight-400 text-sm mt-1">
                  {formatDistanceToNow(new Date(event.time_utc), { addSuffix: true })}
                </p>
              </div>

              <div className="glass rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-4 h-4 text-cosmic-400" />
                  <h3 className="font-medium text-starlight-200">Celestial Coordinates</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-starlight-100 font-mono text-sm">
                    RA: {event.ra.toFixed(6)}°
                  </p>
                  <p className="text-starlight-100 font-mono text-sm">
                    Dec: {event.dec.toFixed(6)}°
                  </p>
                </div>
              </div>

              <div className="glass rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Database className="w-4 h-4 text-nebula-400" />
                  <h3 className="font-medium text-starlight-200">Data Source</h3>
                </div>
                <p className="text-starlight-100 text-sm">
                  {event.source}
                </p>
              </div>

              {event.confidence_score && (
                <div className="glass rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="w-4 h-4 text-starlight-400" />
                    <h3 className="font-medium text-starlight-200">Confidence Score</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-starlight-100 font-mono text-lg">
                        {(event.confidence_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-starlight-700/50 rounded-full h-2">
                      <motion.div 
                        className="bg-gradient-to-r from-space-500 to-cosmic-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${event.confidence_score * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata */}
            {metadataEntries.length > 0 && (
              <div className="glass rounded-lg p-4">
                <h3 className="font-medium text-starlight-200 mb-4 flex items-center space-x-2">
                  <Database className="w-4 h-4 text-starlight-400" />
                  <span>Event Metadata</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {metadataEntries.map(({ key, value }, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-starlight-800/30 rounded-lg p-3"
                    >
                      <dt className="text-xs text-starlight-400 font-medium uppercase tracking-wide">
                        {key}
                      </dt>
                      <dd className="text-sm text-starlight-100 font-mono mt-1 break-all">
                        {value}
                      </dd>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                className="btn-primary flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ExternalLink className="w-4 h-4" />
                <span>View in Catalog</span>
              </motion.button>
              
              <motion.button
                className="btn-secondary flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Database className="w-4 h-4" />
                <span>Export Data</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventDetails;
