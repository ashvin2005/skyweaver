'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Save, RotateCcw, Calendar, MapPin, Target, Zap } from 'lucide-react';
import { FilterConfig, EVENT_TYPES, EventType } from '@/lib/supabase';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilter: (filter: FilterConfig) => void;
  currentFilter: FilterConfig;
}

export default function FilterPanel({ isOpen, onClose, onApplyFilter, currentFilter }: FilterPanelProps) {
  const [filter, setFilter] = useState<FilterConfig>(currentFilter);
  const [availableSources, setAvailableSources] = useState<string[]>([
    'LIGO-Virgo', 'Swift-BAT', 'ZTF', 'IceCube', 'CHIME', 'Fermi-GBM'
  ]);

  useEffect(() => {
    setFilter(currentFilter);
  }, [currentFilter]);

  const handleEventTypeToggle = (eventType: EventType) => {
    const updatedTypes = filter.eventTypes.includes(eventType)
      ? filter.eventTypes.filter(t => t !== eventType)
      : [...filter.eventTypes, eventType];
    
    setFilter({ ...filter, eventTypes: updatedTypes });
  };

  const handleSourceToggle = (source: string) => {
    const updatedSources = filter.sources.includes(source)
      ? filter.sources.filter(s => s !== source)
      : [...filter.sources, source];
    
    setFilter({ ...filter, sources: updatedSources });
  };

  const handleTimeRangeChange = (field: 'start' | 'end', value: string) => {
    setFilter({
      ...filter,
      timeRange: {
        ...filter.timeRange,
        [field]: value
      }
    });
  };

  const handleCoordinateChange = (axis: 'ra' | 'dec', bound: 'min' | 'max', value: number) => {
    setFilter({
      ...filter,
      coordinates: {
        ...filter.coordinates,
        [axis]: {
          ...filter.coordinates[axis],
          [bound]: value
        }
      }
    });
  };

  const handleReset = () => {
    const defaultFilter: FilterConfig = {
      eventTypes: [...EVENT_TYPES],
      sources: [...availableSources],
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
    };
    setFilter(defaultFilter);
  };

  const handleApply = () => {
    onApplyFilter(filter);
    onClose();
  };

  const getEventTypeColor = (eventType: EventType) => {
    switch (eventType) {
      case 'gravitational_wave': return 'cosmic';
      case 'gamma_ray_burst': return 'nebula';
      case 'optical_transient': return 'space';
      case 'neutrino': return 'starlight';
      case 'radio_burst': return 'cosmic';
      default: return 'starlight';
    }
  };

  const getEventTypeIcon = (eventType: EventType) => {
    switch (eventType) {
      case 'gravitational_wave': return '〰️';
      case 'gamma_ray_burst': return '💥';
      case 'optical_transient': return '✨';
      case 'neutrino': return '⚛️';
      case 'radio_burst': return '📡';
      default: return '⭐';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-strong rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Filter className="w-6 h-6 text-cosmic-400" />
              <h2 className="font-display text-2xl font-bold text-starlight-50">
                Event Filters
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-starlight-400 hover:text-starlight-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Event Types */}
              <div>
                <h3 className="font-semibold text-starlight-200 mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-cosmic-400" />
                  Event Types
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {EVENT_TYPES.map((eventType) => {
                    const isSelected = filter.eventTypes.includes(eventType);
                    const colorClass = getEventTypeColor(eventType);
                    return (
                      <motion.button
                        key={eventType}
                        onClick={() => handleEventTypeToggle(eventType)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? `border-${colorClass}-400 bg-${colorClass}-500/20 text-${colorClass}-300`
                            : 'border-starlight-700 bg-starlight-900/30 text-starlight-400 hover:border-starlight-600'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getEventTypeIcon(eventType)}</span>
                          <span className="font-medium capitalize">
                            {eventType.replace('_', ' ')}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Sources */}
              <div>
                <h3 className="font-semibold text-starlight-200 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-nebula-400" />
                  Sources
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {availableSources.map((source) => {
                    const isSelected = filter.sources.includes(source);
                    return (
                      <motion.button
                        key={source}
                        onClick={() => handleSourceToggle(source)}
                        className={`p-2 rounded-lg border text-sm transition-all ${
                          isSelected
                            ? 'border-nebula-400 bg-nebula-500/20 text-nebula-300'
                            : 'border-starlight-700 bg-starlight-900/30 text-starlight-400 hover:border-starlight-600'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {source}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Time Range */}
              <div>
                <h3 className="font-semibold text-starlight-200 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-space-400" />
                  Time Range
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-starlight-400 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={filter.timeRange.start.split('T')[0]}
                      onChange={(e) => handleTimeRangeChange('start', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-starlight-400 mb-2">End Date</label>
                    <input
                      type="date"
                      value={filter.timeRange.end.split('T')[0]}
                      onChange={(e) => handleTimeRangeChange('end', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Coordinates */}
              <div>
                <h3 className="font-semibold text-starlight-200 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-starlight-400" />
                  Sky Coordinates
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-starlight-400 mb-2">
                      Right Ascension (RA) - degrees
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filter.coordinates.ra.min}
                        onChange={(e) => handleCoordinateChange('ra', 'min', parseFloat(e.target.value) || 0)}
                        className="input-field flex-1"
                        min="0"
                        max="360"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filter.coordinates.ra.max}
                        onChange={(e) => handleCoordinateChange('ra', 'max', parseFloat(e.target.value) || 360)}
                        className="input-field flex-1"
                        min="0"
                        max="360"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-starlight-400 mb-2">
                      Declination (Dec) - degrees
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filter.coordinates.dec.min}
                        onChange={(e) => handleCoordinateChange('dec', 'min', parseFloat(e.target.value) || -90)}
                        className="input-field flex-1"
                        min="-90"
                        max="90"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filter.coordinates.dec.max}
                        onChange={(e) => handleCoordinateChange('dec', 'max', parseFloat(e.target.value) || 90)}
                        className="input-field flex-1"
                        min="-90"
                        max="90"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Parameters */}
              <div>
                <h3 className="font-semibold text-starlight-200 mb-4">
                  Advanced Parameters
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-starlight-400 mb-2">
                      Confidence Threshold: {filter.confidenceThreshold}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={filter.confidenceThreshold}
                      onChange={(e) => setFilter({ ...filter, confidenceThreshold: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  
                  {filter.maxAngularSeparation !== undefined && (
                    <div>
                      <label className="block text-sm text-starlight-400 mb-2">
                        Max Angular Separation (deg)
                      </label>
                      <input
                        type="number"
                        value={filter.maxAngularSeparation}
                        onChange={(e) => setFilter({ ...filter, maxAngularSeparation: parseFloat(e.target.value) || 5.0 })}
                        className="input-field"
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                  )}

                  {filter.maxTimeWindow !== undefined && (
                    <div>
                      <label className="block text-sm text-starlight-400 mb-2">
                        Max Time Window (seconds)
                      </label>
                      <input
                        type="number"
                        value={filter.maxTimeWindow}
                        onChange={(e) => setFilter({ ...filter, maxTimeWindow: parseInt(e.target.value) || 3600 })}
                        className="input-field"
                        min="1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-starlight-700">
            <motion.button
              onClick={handleReset}
              className="btn-secondary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </motion.button>

            <div className="flex space-x-3">
              <motion.button
                onClick={onClose}
                className="btn-secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleApply}
                className="btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
