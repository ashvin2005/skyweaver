'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AstroEvent } from '@/lib/supabase';
import { EventPair } from '@/lib/correlation-engine';
import { Settings, Link, TrendingUp, Zap, Clock, MapPin } from 'lucide-react';

interface CorrelationPanelProps {
  events: AstroEvent[];
  correlations: EventPair[];
  onParametersChange: (params: {
    timeWindowSeconds: number;
    angularThresholdDeg: number;
    minConfidenceScore: number;
  }) => void;
  onCorrelate: () => void;
  isLoading?: boolean;
}

const CorrelationPanel: React.FC<CorrelationPanelProps> = ({
  events,
  correlations,
  onParametersChange,
  onCorrelate,
  isLoading = false
}) => {
  const [timeWindow, setTimeWindow] = useState(600); // 10 minutes in seconds
  const [angularThreshold, setAngularThreshold] = useState(1.0); // 1 degree
  const [minConfidence, setMinConfidence] = useState(0.1); // 10%

  const handleParameterChange = () => {
    onParametersChange({
      timeWindowSeconds: timeWindow,
      angularThresholdDeg: angularThreshold,
      minConfidenceScore: minConfidence
    });
  };

  React.useEffect(() => {
    handleParameterChange();
  }, [timeWindow, angularThreshold, minConfidence]);

  const formatTimeWindow = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
    return `${Math.round(seconds / 86400)}d`;
  };

  return (
    <div className="space-y-6">
      {/* Parameter Controls */}
      <div className="space-y-4">
        {/* Time Window Control */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-starlight-200">
              <Clock className="w-4 h-4 text-space-400" />
              <span>Time Window</span>
            </label>
            <span className="text-starlight-300 text-sm font-mono">
              {formatTimeWindow(timeWindow)}
            </span>
          </div>
          <input
            type="range"
            min="60"
            max="86400"
            step="60"
            value={timeWindow}
            onChange={(e) => setTimeWindow(Number(e.target.value))}
            className="slider w-full"
          />
          <div className="flex justify-between text-xs text-starlight-500 mt-2">
            <span>1m</span>
            <span>1h</span>
            <span>6h</span>
            <span>1d</span>
          </div>
        </div>

        {/* Angular Threshold Control */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-starlight-200">
              <MapPin className="w-4 h-4 text-cosmic-400" />
              <span>Angular Threshold</span>
            </label>
            <span className="text-starlight-300 text-sm font-mono">
              {angularThreshold.toFixed(1)}°
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={angularThreshold}
            onChange={(e) => setAngularThreshold(Number(e.target.value))}
            className="slider w-full"
          />
          <div className="flex justify-between text-xs text-starlight-500 mt-2">
            <span>0.1°</span>
            <span>1°</span>
            <span>5°</span>
            <span>10°</span>
          </div>
        </div>

        {/* Confidence Threshold Control */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-starlight-200">
              <TrendingUp className="w-4 h-4 text-nebula-400" />
              <span>Min Confidence</span>
            </label>
            <span className="text-starlight-300 text-sm font-mono">
              {(minConfidence * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className="slider w-full"
          />
          <div className="flex justify-between text-xs text-starlight-500 mt-2">
            <span>1%</span>
            <span>25%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Correlation Button */}
      <motion.button
        onClick={onCorrelate}
        disabled={isLoading || events.length < 2}
        className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Zap className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
        <span>{isLoading ? 'Analyzing...' : 'Find Correlations'}</span>
      </motion.button>

      {/* Results Summary */}
      {correlations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center space-x-2 text-starlight-200">
            <Link className="w-4 h-4 text-cosmic-400" />
            <span className="font-medium">Correlation Results</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-starlight-400">Total Pairs</p>
              <p className="text-lg font-bold text-starlight-100">
                {correlations.length}
              </p>
            </div>
            <div>
              <p className="text-starlight-400">Avg Confidence</p>
              <p className="text-lg font-bold text-starlight-100">
                {correlations.length > 0 
                  ? (correlations.reduce((sum, c) => sum + c.confidenceScore, 0) / correlations.length * 100).toFixed(0) + '%'
                  : '0%'
                }
              </p>
            </div>
          </div>

          {/* Top Correlations */}
          <div className="space-y-2">
            <p className="text-starlight-400 text-sm">Strongest Correlations:</p>
            {correlations
              .sort((a, b) => b.confidenceScore - a.confidenceScore)
              .slice(0, 3)
              .map((correlation, index) => (
                <div 
                  key={index}
                  className="text-xs text-starlight-300 bg-starlight-800/30 rounded px-2 py-1"
                >
                  <span className="text-cosmic-400">
                    {correlation.event1.event_type}
                  </span>
                  {' ⟷ '}
                  <span className="text-nebula-400">
                    {correlation.event2.event_type}
                  </span>
                  <span className="float-right text-starlight-400">
                    {(correlation.confidenceScore * 100).toFixed(1)}%
                  </span>
                </div>
              ))
            }
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CorrelationPanel;
