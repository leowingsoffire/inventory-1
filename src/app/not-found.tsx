'use client';

import { motion } from 'framer-motion';
import { Search, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center p-6">
      <motion.div
        className="max-w-md w-full text-center glass-card p-8 rounded-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="text-8xl font-black bg-gradient-to-r from-accent-400 to-purple-400 bg-clip-text text-transparent mb-4"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          404
        </motion.div>
        <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center mx-auto mb-4">
          <Search className="w-6 h-6 text-accent-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-white/50 text-sm mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
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
          <motion.button
            onClick={() => window.history.back()}
            className="glass-button px-5 py-2.5 text-sm flex items-center gap-2 text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
