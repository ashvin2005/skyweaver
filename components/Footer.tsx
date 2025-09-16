'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Telescope, Github, ExternalLink } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="glass-strong border-t border-starlight-700/30 mt-16"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Telescope className="h-6 w-6 text-cosmic-400" />
              <span className="font-display font-bold text-lg text-starlight-50">
                Sky<span className="text-gradient">Weaver</span>
              </span>
            </div>
            <p className="text-starlight-400 text-sm max-w-md mb-4">
              Advanced multi-messenger astrophysical event correlation system. 
              Connecting gravitational waves, gamma-ray bursts, and optical transients 
              to unlock the secrets of the universe.
            </p>
            <div className="flex items-center space-x-1 text-starlight-400 text-sm">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-400 animate-pulse" />
              <span>for astronomy</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold text-starlight-200 mb-4">
              Features
            </h3>
            <ul className="space-y-2 text-starlight-400 text-sm">
              <li>
                <a href="#" className="hover:text-starlight-200 transition-colors duration-200">
                  Event Correlation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-starlight-200 transition-colors duration-200">
                  Sky Visualization
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-starlight-200 transition-colors duration-200">
                  Real-time Analysis
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-starlight-200 transition-colors duration-200">
                  Data Export
                </a>
              </li>
            </ul>
          </div>

          {/* Data Sources */}
          <div>
            <h3 className="font-display font-semibold text-starlight-200 mb-4">
              Data Sources
            </h3>
            <ul className="space-y-2 text-starlight-400 text-sm">
              <li className="flex items-center space-x-2">
                <ExternalLink className="h-3 w-3" />
                <a href="#" className="hover:text-starlight-200 transition-colors duration-200">
                  GWOSC
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <ExternalLink className="h-3 w-3" />
                <a href="#" className="hover:text-starlight-200 transition-colors duration-200">
                  NASA HEASARC
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <ExternalLink className="h-3 w-3" />
                <a href="#" className="hover:text-starlight-200 transition-colors duration-200">
                  ZTF/TNS
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <ExternalLink className="h-3 w-3" />
                <a href="#" className="hover:text-starlight-200 transition-colors duration-200">
                  SIMBAD
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-starlight-700/30 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-starlight-500 text-sm">
            © {currentYear} SkyWeaver. Advancing multi-messenger astronomy.
          </p>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <motion.a
              href="#"
              className="text-starlight-400 hover:text-starlight-200 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Github className="h-5 w-5" />
            </motion.a>
            <span className="text-starlight-500 text-sm">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
