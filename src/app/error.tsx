'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center p-6">
      <motion.div
        className="max-w-md w-full text-center glass-card p-8 rounded-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-6"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </motion.div>
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-white/50 text-sm mb-6">An unexpected error occurred. Please try again or return to the dashboard.</p>
        <div className="flex gap-3 justify-center">
          <motion.button
            onClick={reset}
            className="glass-button px-5 py-2.5 text-sm flex items-center gap-2 text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </motion.button>
          <Link href="/dashboard">
            <motion.div
              className="glass-button px-5 py-2.5 text-sm flex items-center gap-2 text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
