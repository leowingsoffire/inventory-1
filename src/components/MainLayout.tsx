'use client';

import { motion } from 'framer-motion';
import { useApp } from '@/lib/context';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import FloatingAI from '@/components/FloatingAI';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { theme, sidebarOpen } = useApp();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} animated-gradient relative`}>
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: `radial-gradient(circle, ${theme.orbColors[0]} 0%, transparent 70%)` }}
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -80, 60, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          initial={{ top: '10%', left: '20%' }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: `radial-gradient(circle, ${theme.orbColors[1]} 0%, transparent 70%)` }}
          animate={{
            x: [0, -80, 40, 0],
            y: [0, 60, -40, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          initial={{ top: '60%', right: '10%' }}
        />
        <motion.div
          className="absolute w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: `radial-gradient(circle, ${theme.orbColors[2]} 0%, transparent 70%)` }}
          animate={{
            x: [0, 60, -30, 0],
            y: [0, -60, 80, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          initial={{ bottom: '10%', left: '50%' }}
        />
      </div>

      <Sidebar />
      <div className="relative z-10" style={{ marginLeft: sidebarOpen ? 260 : 72, transition: 'margin-left 0.3s ease-in-out' }}>
        <Header />
        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      <FloatingAI />
    </div>
  );
}
