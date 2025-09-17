'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Settings, 
  Moon, 
  Sun, 
  Monitor,
  Database,
  Wifi,
  Bell,
  Download,
  Upload,
  Github,
  ExternalLink,
  Info
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light' | 'system'>('dark');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('skyweaver-theme') as 'dark' | 'light' | 'system' || 'dark';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);

    // Listen for system theme changes when using system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (savedTheme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const applyTheme = (theme: 'dark' | 'light' | 'system') => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
    
    localStorage.setItem('skyweaver-theme', theme);
  };

  const handleThemeChange = (theme: 'dark' | 'light' | 'system') => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'data', label: 'Data Sources', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'about', label: 'About', icon: Info }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-space-900/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 xl:inset-20 bg-space-800 rounded-2xl border border-starlight-700/30 z-50 overflow-hidden"
          >
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="w-64 bg-space-900/50 border-r border-starlight-700/30 p-6">
                <div className="flex items-center space-x-3 mb-8">
                  <Settings className="w-6 h-6 text-cosmic-400" />
                  <h2 className="text-xl font-bold text-starlight-50">Settings</h2>
                </div>

                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-cosmic-500/20 text-cosmic-300 border border-cosmic-500/30'
                            : 'text-starlight-300 hover:text-starlight-50 hover:bg-starlight-700/20'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                      </motion.button>
                    );
                  })}
                </nav>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-starlight-700/30">
                  <h3 className="text-lg font-semibold text-starlight-50">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h3>
                  <motion.button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-starlight-700/50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-5 h-5 text-starlight-300" />
                  </motion.button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {activeTab === 'general' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-starlight-50 font-medium mb-4">Theme</h4>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'dark', label: 'Dark', icon: Moon },
                            { id: 'light', label: 'Light', icon: Sun },
                            { id: 'system', label: 'System', icon: Monitor }
                          ].map((theme) => {
                            const Icon = theme.icon;
                            const isSelected = currentTheme === theme.id;
                            return (
                              <motion.button
                                key={theme.id}
                                onClick={() => handleThemeChange(theme.id as 'dark' | 'light' | 'system')}
                                className={`flex flex-col items-center p-4 rounded-lg border transition-all duration-200 ${
                                  isSelected
                                    ? 'border-cosmic-500 bg-cosmic-500/20 text-cosmic-300'
                                    : 'border-starlight-700/30 hover:border-cosmic-500/50 text-starlight-300'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-cosmic-300' : 'text-starlight-300'}`} />
                                <span className={`text-sm ${isSelected ? 'text-cosmic-300' : 'text-starlight-300'}`}>{theme.label}</span>
                                {isSelected && (
                                  <motion.div
                                    className="mt-1 w-1 h-1 bg-cosmic-400 rounded-full"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                  />
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-starlight-50 font-medium mb-4">Performance</h4>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-starlight-300">Enable animations</span>
                            <input type="checkbox" defaultChecked className="toggle" />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-starlight-300">Auto-refresh data</span>
                            <input type="checkbox" defaultChecked className="toggle" />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-starlight-300">Show correlation hints</span>
                            <input type="checkbox" defaultChecked className="toggle" />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'data' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-starlight-50 font-medium mb-4">Data Sources</h4>
                        <div className="space-y-3">
                          {[
                            { name: 'LIGO-Virgo-KAGRA', status: 'connected', type: 'Gravitational Waves' },
                            { name: 'Fermi GBM', status: 'connected', type: 'Gamma-Ray Bursts' },
                            { name: 'ZTF', status: 'connected', type: 'Optical Transients' },
                            { name: 'SIMBAD', status: 'connected', type: 'Astronomical Catalogs' }
                          ].map((source) => (
                            <div key={source.name} className="flex items-center justify-between p-4 rounded-lg border border-starlight-700/30">
                              <div>
                                <h5 className="text-starlight-50 font-medium">{source.name}</h5>
                                <p className="text-sm text-starlight-400">{source.type}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Wifi className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-400 capitalize">{source.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-starlight-50 font-medium mb-4">Cache Settings</h4>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-starlight-300">Cache duration (hours)</span>
                            <input 
                              type="number" 
                              defaultValue={24} 
                              className="w-20 bg-space-700 border border-starlight-700/30 rounded px-2 py-1 text-starlight-50"
                            />
                          </label>
                          <button className="btn-secondary flex items-center space-x-2">
                            <Download className="w-4 h-4" />
                            <span>Clear Cache</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'notifications' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-starlight-50 font-medium mb-4">Event Notifications</h4>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-starlight-300">New gravitational wave detections</span>
                            <input type="checkbox" defaultChecked className="toggle" />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-starlight-300">High-confidence correlations</span>
                            <input type="checkbox" defaultChecked className="toggle" />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-starlight-300">Multi-messenger events</span>
                            <input type="checkbox" defaultChecked className="toggle" />
                          </label>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-starlight-50 font-medium mb-4">Notification Methods</h4>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-starlight-300">Browser notifications</span>
                            <input type="checkbox" className="toggle" />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-starlight-300">Email alerts</span>
                            <input type="checkbox" className="toggle" />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'about' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-starlight-50 font-medium mb-4">SkyWeaver</h4>
                        <p className="text-starlight-300 mb-4">
                          Multi-Messenger Astrophysical Event Correlation System
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-starlight-400">Version:</span>
                            <span className="text-starlight-300">0.1.0</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-starlight-400">Build:</span>
                            <span className="text-starlight-300">2025.09.17</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-starlight-400">Framework:</span>
                            <span className="text-starlight-300">Next.js 13.5.1</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-starlight-50 font-medium mb-4">Links</h4>
                        <div className="space-y-3">
                          <motion.a
                            href="https://github.com/ashvin2005/skyweaver"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-lg border border-starlight-700/30 hover:border-cosmic-500/50 transition-all duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center space-x-3">
                              <Github className="w-5 h-5 text-starlight-300" />
                              <span className="text-starlight-300">View on GitHub</span>
                            </div>
                            <ExternalLink className="w-4 h-4 text-starlight-400" />
                          </motion.a>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-starlight-50 font-medium mb-4">Export/Import</h4>
                        <div className="flex space-x-3">
                          <motion.button
                            className="btn-secondary flex items-center space-x-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Download className="w-4 h-4" />
                            <span>Export Settings</span>
                          </motion.button>
                          <motion.button
                            className="btn-secondary flex items-center space-x-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Upload className="w-4 h-4" />
                            <span>Import Settings</span>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
