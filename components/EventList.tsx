'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AstroEvent } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { Zap, Eye, Radio, Star, Clock, MapPin } from 'lucide-react';

interface EventListProps {
  events: AstroEvent[];
  onEventSelect?: (event: AstroEvent) => void;
  selectedEvent?: AstroEvent;
}

const EventList: React.FC<EventListProps> = ({ events, onEventSelect, selectedEvent }) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'gravitational_wave': return <Radio className="w-4 h-4" />;
      case 'gamma_ray_burst': return <Zap className="w-4 h-4" />;
      case 'optical_transient': return <Eye className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'gravitational_wave': return 'border-cosmic-400/50 bg-cosmic-500/10 hover:bg-cosmic-500/20';
      case 'gamma_ray_burst': return 'border-nebula-400/50 bg-nebula-500/10 hover:bg-nebula-500/20';
      case 'optical_transient': return 'border-space-400/50 bg-space-500/10 hover:bg-space-500/20';
      default: return 'border-starlight-400/50 bg-starlight-500/10 hover:bg-starlight-500/20';
    }
  };

  const getEventTypeDisplay = (eventType: string) => {
    switch (eventType) {
      case 'gravitational_wave': return 'Gravitational Wave';
      case 'gamma_ray_burst': return 'Gamma-Ray Burst';
      case 'optical_transient': return 'Optical Transient';
      default: return eventType.replace('_', ' ').toUpperCase();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-starlight-100">
          Recent Events
        </h3>
        <div className="flex items-center space-x-2 text-starlight-400 text-sm">
          <div className="w-2 h-2 bg-nebula-400 rounded-full animate-pulse"></div>
          <span>{events.length} detected</span>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
        <AnimatePresence>
          {events.slice(0, 20).map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className={`glass rounded-lg p-4 cursor-pointer transition-all duration-200 hover-lift border ${
                selectedEvent?.id === event.id 
                  ? 'ring-2 ring-cosmic-400 bg-cosmic-500/20 border-cosmic-400/50' 
                  : getEventColor(event.event_type)
              }`}
              onClick={() => onEventSelect?.(event)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    event.event_type === 'gravitational_wave' ? 'bg-cosmic-500/20 text-cosmic-400' :
                    event.event_type === 'gamma_ray_burst' ? 'bg-nebula-500/20 text-nebula-400' :
                    event.event_type === 'optical_transient' ? 'bg-space-500/20 text-space-400' :
                    'bg-starlight-500/20 text-starlight-400'
                  }`}>
                    {getEventIcon(event.event_type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-starlight-100 text-sm">
                      {event.event_id}
                    </h4>
                    <p className="text-xs text-starlight-400">
                      {getEventTypeDisplay(event.event_type)}
                    </p>
                    <p className="text-xs text-starlight-500">
                      {event.source}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-xs text-starlight-400 mb-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(event.time_utc), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-starlight-500">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {event.ra.toFixed(1)}°, {event.dec.toFixed(1)}°
                    </span>
                  </div>
                </div>
              </div>
              
              {event.confidence_score && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-starlight-400 mb-1">
                    <span>Confidence</span>
                    <span className="font-mono">{(event.confidence_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-starlight-700/50 rounded-full h-1.5">
                    <motion.div 
                      className="bg-gradient-to-r from-space-500 to-cosmic-500 h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${event.confidence_score * 100}%` }}
                      transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {events.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-starlight-400"
          >
            <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No events detected</p>
            <p className="text-sm">Waiting for astronomical phenomena...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EventList;
