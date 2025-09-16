'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Telescope } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className={`${sizeClasses[size]} text-cosmic-400`}
      >
        <Telescope className="w-full h-full" />
      </motion.div>
      
      <div className="text-center">
        <p className="text-starlight-300 text-sm">{message}</p>
        <div className="loading-dots mt-2">
          <div style={{ '--i': 0 } as any}></div>
          <div style={{ '--i': 1 } as any}></div>
          <div style={{ '--i': 2 } as any}></div>
        </div>
      </div>
    </div>
  );
}
