'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, FileText, Database, Loader2, CheckCircle } from 'lucide-react';
import { FilterConfig } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilter: FilterConfig;
  totalEvents: number;
}

export default function ExportModal({ isOpen, onClose, currentFilter, totalEvents }: ExportModalProps) {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [includeCorrelations, setIncludeCorrelations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          filter: currentFilter,
          includeCorrelations,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Get the filename from response headers or create a default one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `skyweaver_export_${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
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
          className="glass-strong rounded-2xl p-8 w-full max-w-md relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Download className="w-6 h-6 text-cosmic-400" />
              <h2 className="font-display text-2xl font-bold text-starlight-50">
                Export Data
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-starlight-400 hover:text-starlight-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 flex items-center space-x-3"
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-300">Export completed successfully!</p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6"
            >
              <p className="text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Export Summary */}
          <div className="bg-starlight-900/30 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-starlight-200 mb-2">Export Summary</h3>
            <div className="space-y-1 text-sm text-starlight-400">
              <p>Events to export: <span className="text-starlight-300 font-medium">{totalEvents}</span></p>
              <p>Event types: <span className="text-starlight-300 font-medium">{currentFilter.eventTypes.length}</span></p>
              <p>Sources: <span className="text-starlight-300 font-medium">{currentFilter.sources.length}</span></p>
              <p>Time range: <span className="text-starlight-300 font-medium">
                {currentFilter.timeRange.start} to {currentFilter.timeRange.end}
              </span></p>
            </div>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <h3 className="font-semibold text-starlight-200 mb-3">Export Format</h3>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                onClick={() => setFormat('json')}
                className={`p-4 rounded-lg border text-left transition-all ${
                  format === 'json'
                    ? 'border-cosmic-400 bg-cosmic-500/20 text-cosmic-300'
                    : 'border-starlight-700 bg-starlight-900/30 text-starlight-400 hover:border-starlight-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5" />
                  <div>
                    <div className="font-medium">JSON</div>
                    <div className="text-xs opacity-75">Structured data</div>
                  </div>
                </div>
              </motion.button>

              <motion.button
                onClick={() => setFormat('csv')}
                className={`p-4 rounded-lg border text-left transition-all ${
                  format === 'csv'
                    ? 'border-cosmic-400 bg-cosmic-500/20 text-cosmic-300'
                    : 'border-starlight-700 bg-starlight-900/30 text-starlight-400 hover:border-starlight-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5" />
                  <div>
                    <div className="font-medium">CSV</div>
                    <div className="text-xs opacity-75">Spreadsheet format</div>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Options */}
          <div className="mb-8">
            <h3 className="font-semibold text-starlight-200 mb-3">Options</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCorrelations}
                  onChange={(e) => setIncludeCorrelations(e.target.checked)}
                  className="rounded border-starlight-600 bg-starlight-900 text-cosmic-500 focus:ring-cosmic-500 focus:ring-offset-0"
                />
                <span className="text-starlight-300">Include event correlations</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <motion.button
              onClick={onClose}
              disabled={loading}
              className="flex-1 btn-secondary justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleExport}
              disabled={loading || totalEvents === 0}
              className="flex-1 btn-primary justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {format.toUpperCase()}
                </>
              )}
            </motion.button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-starlight-400 text-center mt-4">
            {format === 'json' 
              ? 'JSON format includes full event metadata and is suitable for programmatic analysis.'
              : 'CSV format is optimized for spreadsheet applications and statistical analysis.'
            }
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
