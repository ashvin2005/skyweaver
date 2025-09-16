'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Telescope, Zap, Settings, Github, ExternalLink } from 'lucide-react';

interface HeaderProps {
  onSettingsClick?: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-strong border-b border-starlight-700/30 sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="relative">
              <Telescope className="h-8 w-8 text-cosmic-400" />
              <motion.div
                className="absolute inset-0 bg-cosmic-400 rounded-full opacity-20"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-starlight-50">
                Sky<span className="text-gradient">Weaver</span>
              </h1>
              <p className="text-xs text-starlight-400 hidden sm:block">
                Multi-Messenger Astronomy
              </p>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <motion.a
              href="#events"
              className="text-starlight-300 hover:text-starlight-50 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Events
            </motion.a>
            <motion.a
              href="#correlations"
              className="text-starlight-300 hover:text-starlight-50 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Correlations
            </motion.a>
            <motion.a
              href="#skymap"
              className="text-starlight-300 hover:text-starlight-50 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sky Map
            </motion.a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={onSettingsClick}
              className="p-2 glass rounded-lg hover:bg-starlight-700/50 transition-all duration-200"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="h-5 w-5 text-starlight-300" />
            </motion.button>
            
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 glass rounded-lg hover:bg-starlight-700/50 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github className="h-5 w-5 text-starlight-300" />
            </motion.a>

            <motion.button
              className="btn-primary hidden sm:flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap className="h-4 w-4" />
              <span>Live Data</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
