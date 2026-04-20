'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import FloatingAI from '@/components/FloatingAI';

const KEEP_OPEN_ROUTES = ['/dashboard'];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { theme, themeOverrides, sidebarOpen, setSidebarOpen } = useApp();
  const pathname = usePathname();

  // Auto-collapse sidebar on feature pages
  useEffect(() => {
    if (!KEEP_OPEN_ROUTES.includes(pathname)) {
      setSidebarOpen(false);
    }
  }, [pathname, setSidebarOpen]);

  // Auto-collapse on small screens
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1279px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setSidebarOpen(false);
    };
    handler(mql); // check on mount
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [setSidebarOpen]);

  const bgStyle = themeOverrides.gradientFrom ? {
    background: `linear-gradient(to bottom right, ${themeOverrides.gradientFrom}, ${themeOverrides.gradientVia || themeOverrides.gradientFrom}, ${themeOverrides.gradientTo || themeOverrides.gradientFrom})`,
  } : undefined;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgStyle ? '' : theme.gradient} animated-gradient relative`} style={bgStyle}>
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
