'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { User, Settings, LogOut, Camera, Save, X } from 'lucide-react';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!profile) return;
    
    setLoading(true);
    setError(null);

    try {
      await updateProfile({ full_name: fullName });
      setEditing(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  if (!isOpen || !user || !profile) return null;

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
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-starlight-400 hover:text-starlight-300"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-cosmic-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </div>
              <button className="absolute bottom-0 right-0 bg-starlight-700 hover:bg-starlight-600 rounded-full p-2">
                <Camera className="w-4 h-4 text-starlight-300" />
              </button>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  profile.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                  profile.role === 'researcher' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {profile.role}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Profile Details */}
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-starlight-300 mb-2">
                Full Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="input-field bg-starlight-900/30 text-starlight-300">
                  {profile.full_name || 'Not set'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-starlight-300 mb-2">
                Email
              </label>
              <div className="input-field bg-starlight-900/30 text-starlight-300">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-starlight-300 mb-2">
                Member Since
              </label>
              <div className="input-field bg-starlight-900/30 text-starlight-300">
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {editing ? (
              <div className="flex space-x-3">
                <motion.button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 btn-primary justify-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </motion.button>
                <motion.button
                  onClick={() => {
                    setEditing(false);
                    setFullName(profile.full_name || '');
                  }}
                  className="btn-secondary px-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={() => setEditing(true)}
                className="w-full btn-secondary justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </motion.button>
            )}

            <motion.button
              onClick={handleSignOut}
              className="w-full btn-secondary justify-center text-red-400 border-red-500/30 hover:bg-red-500/10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
