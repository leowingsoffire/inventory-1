'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Eye, EyeOff, ArrowRight, Shield, AlertCircle, Mail, Zap, Terminal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useAuth } from '@/lib/auth-context';
import { APP_VERSION } from '@/lib/version';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [glitchText, setGlitchText] = useState(false);
  const router = useRouter();
  const { theme, lang, setLang } = useApp();
  const { login: authLogin } = useAuth();

  // Periodic glitch effect on title
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchText(true);
      setTimeout(() => setGlitchText(false), 200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authLogin(login, password);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      setResetSent(true);
    } catch {
      setResetSent(true);
    }
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050a12] flex items-center justify-center p-4 relative overflow-hidden">
      {/* ======= NIAGARA FALLS ANIMATED BACKGROUND ======= */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        {/* Sky gradient — dusk sky with warm-to-cool transition */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, #0b1628 0%, #132844 15%, #1a3a5c 25%, #2d6187 35%, #4a8fad 45%, #1c4a5e 55%, #0e2a3a 70%, #081820 100%)',
        }} />

        {/* Distant horizon glow — golden hour reflection */}
        <motion.div
          className="absolute w-full h-[40%] top-[20%]"
          style={{ background: 'radial-gradient(ellipse 120% 60% at 50% 100%, rgba(255,180,80,0.08) 0%, rgba(255,140,50,0.04) 30%, transparent 70%)' }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Stars in the upper sky */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              width: `${1 + Math.random() * 1.5}px`,
              height: `${1 + Math.random() * 1.5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 25}%`,
            }}
            animate={{ opacity: [0.1, 0.7, 0.1] }}
            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}

        {/* Cliff / rock face — left side */}
        <div className="absolute left-0 top-[30%] bottom-0 w-[22%]" style={{
          background: 'linear-gradient(135deg, #0a1a1a 0%, #162828 30%, #1a3030 50%, #0d1e20 80%, #08141a 100%)',
          clipPath: 'polygon(0% 0%, 85% 5%, 95% 15%, 88% 30%, 92% 45%, 80% 55%, 75% 70%, 70% 100%, 0% 100%)',
        }} />
        {/* Rock texture overlay left */}
        <div className="absolute left-0 top-[30%] bottom-0 w-[22%] opacity-30" style={{
          background: 'repeating-linear-gradient(160deg, rgba(255,255,255,0.02) 0px, transparent 2px, transparent 6px, rgba(255,255,255,0.01) 8px)',
          clipPath: 'polygon(0% 0%, 85% 5%, 95% 15%, 88% 30%, 92% 45%, 80% 55%, 75% 70%, 70% 100%, 0% 100%)',
        }} />
        {/* Vegetation on left cliff */}
        <div className="absolute left-[5%] top-[28%] w-[14%] h-[8%]" style={{
          background: 'radial-gradient(ellipse, rgba(20,80,40,0.7) 0%, rgba(15,60,30,0.4) 50%, transparent 80%)',
          borderRadius: '60% 40% 50% 50%',
        }} />

        {/* Cliff / rock face — right side */}
        <div className="absolute right-0 top-[32%] bottom-0 w-[20%]" style={{
          background: 'linear-gradient(225deg, #0a1a1a 0%, #162828 30%, #1a3030 50%, #0d1e20 80%, #08141a 100%)',
          clipPath: 'polygon(15% 3%, 100% 0%, 100% 100%, 30% 100%, 25% 75%, 10% 60%, 5% 45%, 12% 25%)',
        }} />
        {/* Vegetation on right cliff */}
        <div className="absolute right-[3%] top-[30%] w-[12%] h-[7%]" style={{
          background: 'radial-gradient(ellipse, rgba(20,80,40,0.6) 0%, rgba(15,60,30,0.3) 50%, transparent 80%)',
          borderRadius: '50% 60% 50% 50%',
        }} />

        {/* ===== WATERFALL - HORSESHOE SHAPE ===== */}
        {/* Main waterfall curtain — central cascade */}
        <div className="absolute left-[18%] right-[18%] top-[38%] h-[35%] overflow-hidden" style={{
          borderRadius: '0 0 50% 50% / 0 0 20% 20%',
        }}>
          {/* Base water color */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, rgba(120,200,220,0.15) 0%, rgba(80,170,200,0.25) 20%, rgba(140,210,230,0.35) 40%, rgba(200,240,255,0.5) 60%, rgba(255,255,255,0.6) 80%, rgba(200,240,255,0.7) 100%)',
          }} />

          {/* Animated water streaks — layer 1 (slow, wide) */}
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(180deg, rgba(255,255,255,0.08) 0px, rgba(200,235,255,0.12) 3px, transparent 6px, transparent 14px)`,
              backgroundSize: '100% 20px',
            }}
            animate={{ backgroundPositionY: ['0px', '200px'] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Animated water streaks — layer 2 (fast, thin) */}
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(178deg, rgba(255,255,255,0.15) 0px, transparent 1px, transparent 4px, rgba(200,240,255,0.1) 5px, transparent 8px)`,
              backgroundSize: '100% 12px',
            }}
            animate={{ backgroundPositionY: ['0px', '300px'] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
          />

          {/* Animated water streaks — layer 3 (medium, organic) */}
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(182deg, transparent 0px, rgba(255,255,255,0.06) 2px, transparent 4px, transparent 10px, rgba(180,230,255,0.08) 12px, transparent 15px)`,
              backgroundSize: '100% 18px',
            }}
            animate={{ backgroundPositionY: ['0px', '250px'] }}
            transition={{ duration: 0.65, repeat: Infinity, ease: 'linear' }}
          />

          {/* Vertical foam lines */}
          {[15, 28, 42, 55, 68, 82].map((left, i) => (
            <motion.div
              key={`foam-${i}`}
              className="absolute top-0 bottom-0"
              style={{
                left: `${left}%`,
                width: '2px',
                background: `linear-gradient(180deg, rgba(255,255,255,${0.05 + i * 0.02}) 0%, rgba(255,255,255,${0.15 + i * 0.03}) 50%, rgba(255,255,255,${0.3 + i * 0.02}) 100%)`,
              }}
              animate={{ opacity: [0.3, 0.8, 0.3], scaleX: [1, 1.5, 1] }}
              transition={{ duration: 1.5 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}

          {/* Water edge — top (lip of the falls) */}
          <div className="absolute top-0 left-0 right-0 h-[6px]" style={{
            background: 'linear-gradient(180deg, rgba(80,160,180,0.6) 0%, rgba(120,200,220,0.3) 100%)',
          }} />
          <motion.div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), rgba(255,255,255,0.6), rgba(255,255,255,0.4), transparent)' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* ===== MIST CLOUDS ===== */}
        <motion.div
          className="absolute left-[10%] right-[10%] top-[55%] h-[25%]"
          style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 30%, rgba(200,230,255,0.25) 0%, rgba(180,220,250,0.1) 40%, transparent 70%)' }}
          animate={{ opacity: [0.3, 0.7, 0.4, 0.8, 0.3], scale: [1, 1.05, 0.98, 1.03, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute left-[20%] right-[15%] top-[50%] h-[20%]"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 40% 50%, rgba(220,240,255,0.2) 0%, transparent 60%)' }}
          animate={{ opacity: [0.2, 0.5, 0.2], x: [0, 30, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Rising mist columns */}
        <motion.div
          className="absolute left-[35%] top-[48%] w-[30%] h-[30%]"
          style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 100%, rgba(200,235,255,0.2) 0%, transparent 60%)' }}
          animate={{ y: [0, -40, -10, -50, 0], opacity: [0.15, 0.35, 0.2, 0.4, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ===== POOL / BASE WATER ===== */}
        <div className="absolute left-0 right-0 bottom-0 h-[28%]" style={{
          background: 'linear-gradient(180deg, rgba(15,60,80,0.8) 0%, rgba(10,50,70,0.9) 30%, rgba(8,40,55,0.95) 60%, rgba(5,25,40,1) 100%)',
        }} />

        {/* Pool surface shimmer / ripples */}
        <motion.div
          className="absolute left-0 right-0 bottom-[18%] h-[12%]"
          style={{
            backgroundImage: `radial-gradient(ellipse 3px 1px at 20% 50%, rgba(180,230,255,0.15) 0%, transparent 100%),
              radial-gradient(ellipse 4px 1px at 50% 30%, rgba(200,240,255,0.12) 0%, transparent 100%),
              radial-gradient(ellipse 3px 1px at 80% 60%, rgba(180,230,255,0.1) 0%, transparent 100%),
              radial-gradient(ellipse 5px 2px at 35% 70%, rgba(255,255,255,0.08) 0%, transparent 100%)`,
          }}
          animate={{ opacity: [0.4, 0.8, 0.4], scaleX: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Concentric ripple rings at the base */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={`ripple-${i}`}
            className="absolute rounded-full border"
            style={{
              left: `${40 + i * 5}%`,
              bottom: `${22 + i * 2}%`,
              width: '60px',
              height: '15px',
              borderColor: `rgba(200,235,255,${0.15 - i * 0.03})`,
              transform: 'translate(-50%, 50%)',
            }}
            animate={{ scaleX: [1, 2.5, 4], scaleY: [1, 1.5, 2], opacity: [0.3, 0.15, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: 'easeOut' }}
          />
        ))}

        {/* Turbulence splash at base of falls */}
        <motion.div
          className="absolute left-[25%] right-[25%] bottom-[22%] h-[8%]"
          style={{ background: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(255,255,255,0.25) 0%, rgba(200,240,255,0.1) 40%, transparent 70%)' }}
          animate={{ opacity: [0.3, 0.7, 0.4, 0.6, 0.3], scaleY: [1, 1.3, 0.9, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Spray droplets rising from the impact zone */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`spray-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${1 + Math.random() * 3}px`,
              height: `${1 + Math.random() * 3}px`,
              backgroundColor: `rgba(200,235,255,${0.2 + Math.random() * 0.4})`,
              left: `${30 + Math.random() * 40}%`,
              bottom: `${25 + Math.random() * 10}%`,
            }}
            animate={{
              y: [0, -(40 + Math.random() * 80), -(20 + Math.random() * 40)],
              x: [0, (Math.random() - 0.5) * 60],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.2, 0.3],
            }}
            transition={{
              duration: 1.5 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* ===== RAINBOW EFFECT ===== */}
        <motion.div
          className="absolute left-[15%] top-[35%] w-[70%] h-[35%]"
          style={{
            background: `conic-gradient(from 200deg at 50% 100%, 
              rgba(255,0,0,0.04) 0deg, 
              rgba(255,127,0,0.05) 15deg, 
              rgba(255,255,0,0.04) 30deg, 
              rgba(0,255,0,0.04) 45deg, 
              rgba(0,127,255,0.05) 60deg, 
              rgba(75,0,130,0.04) 75deg, 
              rgba(148,0,211,0.03) 90deg, 
              transparent 110deg)`,
            borderRadius: '50% 50% 0 0',
          }}
          animate={{ opacity: [0.3, 0.7, 0.4, 0.8, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ===== UPPER RIVER (water flowing toward the edge) ===== */}
        <div className="absolute left-[18%] right-[18%] top-[35%] h-[4%]" style={{
          background: 'linear-gradient(180deg, rgba(40,100,120,0.5) 0%, rgba(80,160,180,0.6) 70%, rgba(120,200,220,0.4) 100%)',
          borderRadius: '0 0 50% 50% / 0 0 100% 100%',
        }} />
        {/* Horizontal water flow animation */}
        <motion.div
          className="absolute left-[18%] right-[18%] top-[35%] h-[4%] overflow-hidden"
          style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, transparent 3px, transparent 12px)',
              backgroundSize: '16px 100%',
            }}
            animate={{ backgroundPositionX: ['0px', '160px'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        {/* Ambient light reflections on water */}
        <motion.div
          className="absolute left-[30%] bottom-[10%] w-[40%] h-[10%]"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(100,180,220,0.06) 0%, transparent 70%)' }}
          animate={{ opacity: [0.3, 0.6, 0.3], scaleX: [0.9, 1.1, 0.9] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Subtle overall mist overlay */}
        <motion.div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 65%, rgba(180,220,240,0.06) 0%, transparent 60%)' }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Main card */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Outer glow border — water-glass effect */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-sky-400/25 via-cyan-300/15 to-teal-400/25 blur-[1px]" />
        <motion.div
          className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-sky-400/40 via-cyan-300/25 to-teal-400/40 opacity-60"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative rounded-2xl bg-[#0a1a2a]/75 backdrop-blur-2xl border border-white/[0.1] p-8 overflow-hidden">
          {/* Inner corner accents — water droplet teal */}
          <div className="absolute top-0 left-0 w-12 h-[1px] bg-gradient-to-r from-cyan-300/50 to-transparent" />
          <div className="absolute top-0 left-0 w-[1px] h-12 bg-gradient-to-b from-cyan-300/50 to-transparent" />
          <div className="absolute bottom-0 right-0 w-12 h-[1px] bg-gradient-to-l from-teal-400/50 to-transparent" />
          <div className="absolute bottom-0 right-0 w-[1px] h-12 bg-gradient-to-t from-teal-400/50 to-transparent" />

          {/* Logo section */}
          <div className="text-center mb-8">
            {/* Animated Logo — Gold Shining Cyber Tech */}
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
              {/* Ambient gold aura */}
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,200,50,0.15) 0%, rgba(255,180,30,0.05) 40%, transparent 70%)' }}
                animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.12, 0.95] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Outer rotating ring — gold dashed */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: '1.5px dashed rgba(255,200,60,0.3)' }}
                animate={{ rotate: 360, opacity: [0.2, 0.5, 0.2] }}
                transition={{ rotate: { duration: 12, repeat: Infinity, ease: 'linear' }, opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
              />
              {/* Middle pulsing ring — warm gold */}
              <motion.div
                className="absolute inset-2 rounded-full"
                style={{ border: '1px solid rgba(255,190,50,0.2)' }}
                animate={{ scale: [1, 1.06, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Inner counter-rotating ring — dotted gold */}
              <motion.div
                className="absolute inset-4 rounded-full"
                style={{ border: '1px dotted rgba(255,210,80,0.18)' }}
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              />
              {/* Icon container — gold gradient */}
              <motion.div
                className="relative w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(255,200,50,0.2) 0%, rgba(255,160,30,0.1) 50%, rgba(255,210,80,0.2) 100%)', border: '1px solid rgba(255,200,60,0.25)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Cpu className="w-6 h-6" style={{ color: '#ffc850' }} />
                {/* Gold shimmer sweep */}
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,215,100,0.3) 48%, rgba(255,240,180,0.15) 52%, transparent 65%)' }}
                  animate={{ x: ['-120%', '220%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2.5 }}
                />
              </motion.div>
              {/* Corner sparkle dots — gold */}
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <motion.div
                  key={deg}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, #ffd060 0%, #ffb830 100%)',
                    top: `${50 - 46 * Math.cos((deg * Math.PI) / 180)}%`,
                    left: `${50 + 46 * Math.sin((deg * Math.PI) / 180)}%`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 4px rgba(255,200,50,0.4)',
                  }}
                  animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1.3, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: deg / 300, ease: 'easeInOut' }}
                />
              ))}
              {/* Orbiting light particle */}
              <motion.div
                className="absolute w-1 h-1 rounded-full"
                style={{ background: '#ffe680', boxShadow: '0 0 6px rgba(255,220,80,0.6)' }}
                animate={{
                  top: [0, 50, 100, 50, 0].map(v => `${v}%`),
                  left: [50, 100, 50, 0, 50].map(v => `${v}%`),
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* Gold Shining Title with Glitch */}
            <motion.h1
              className="text-3xl font-bold mb-1 relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span
                style={{
                  background: 'linear-gradient(90deg, #ffd700 0%, #fff5cc 20%, #ffc107 40%, #fff5cc 60%, #ffd700 80%, #ffecb3 100%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'goldShimmer 4s ease-in-out infinite',
                  filter: 'drop-shadow(0 0 8px rgba(255,200,50,0.3))',
                }}
              >
                Unitech IT System
              </span>
              {glitchText && (
                <>
                  <span
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, #ffd700, #ffecb3, #ffc107)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      clipPath: 'inset(20% 0 40% 0)',
                      transform: 'translateX(-2px)',
                    }}
                  >
                    Unitech IT System
                  </span>
                  <span
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, #ffecb3, #ffd700, #ffc107)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      clipPath: 'inset(60% 0 10% 0)',
                      transform: 'translateX(2px)',
                    }}
                  >
                    Unitech IT System
                  </span>
                </>
              )}
            </motion.h1>
            <motion.div
              className="flex items-center justify-center gap-2 text-sm"
              style={{ color: 'rgba(255,210,100,0.5)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'IT Inventory Management System' : 'IT 资产管理系统'}</span>
            </motion.div>
          </div>

          {/* Language Toggle */}
          <div className="flex justify-center mb-6">
            <div className="flex rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06] p-0.5">
              <button
                onClick={() => setLang('en')}
                className={`px-4 py-1.5 text-sm rounded-lg transition-all ${lang === 'en' ? 'bg-gradient-to-r from-sky-500/15 to-teal-500/15 text-cyan-200 border border-sky-400/20' : 'text-white/40 hover:text-white/60'}`}
              >
                English
              </button>
              <button
                onClick={() => setLang('zh')}
                className={`px-4 py-1.5 text-sm rounded-lg transition-all ${lang === 'zh' ? 'bg-gradient-to-r from-sky-500/15 to-teal-500/15 text-cyan-200 border border-sky-400/20' : 'text-white/40 hover:text-white/60'}`}
              >
                中文
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <label className="flex items-center gap-1.5 text-white/50 text-xs mb-1.5 uppercase tracking-wider font-medium">
                <Zap className="w-3 h-3 text-sky-300/60" />
                {lang === 'en' ? 'Username or Email' : '用户名或邮箱'}
              </label>
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-teal-500/0 group-focus-within:from-sky-400/25 group-focus-within:via-cyan-400/20 group-focus-within:to-teal-400/25 transition-all duration-300" />
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="relative w-full px-4 py-3 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:bg-white/[0.06] transition-all"
                  placeholder="myoadmin / admin@unitech.sg"
                  required
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <label className="flex items-center gap-1.5 text-white/50 text-xs mb-1.5 uppercase tracking-wider font-medium">
                <Shield className="w-3 h-3 text-teal-300/60" />
                {lang === 'en' ? 'Password' : '密码'}
              </label>
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-teal-500/0 group-focus-within:from-sky-400/25 group-focus-within:via-cyan-400/20 group-focus-within:to-teal-400/25 transition-all duration-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative w-full px-4 py-3 pr-12 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:bg-white/[0.06] transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-cyan-200 transition-colors z-10"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-red-300 text-xs">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sign In button */}
            <motion.button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 rounded-xl font-medium overflow-hidden group disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {/* Button gradient background — waterfall teal */}
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-teal-500 via-sky-400 to-cyan-500"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Shine sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              />
              <span className="relative flex items-center justify-center gap-2 text-white">
                {loading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    {lang === 'en' ? 'Initialize Session' : '初始化会话'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Forgot password link */}
          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="text-sky-300/60 hover:text-cyan-200 text-xs transition-colors"
            >
              <Mail className="w-3 h-3 inline mr-1" />
              {lang === 'en' ? 'Forgot Password?' : '忘记密码？'}
            </button>
          </motion.div>

          {/* Forgot Password Modal */}
          <AnimatePresence>
            {showReset && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="relative w-full max-w-sm rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/[0.08] p-6"
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                >
                  <div className="absolute top-0 left-0 w-8 h-[1px] bg-gradient-to-r from-sky-300/30 to-transparent" />
                  <div className="absolute top-0 left-0 w-[1px] h-8 bg-gradient-to-b from-sky-300/30 to-transparent" />
                  {resetSent ? (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                        <Mail className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">
                        {lang === 'en' ? 'Check Your Email' : '检查您的邮箱'}
                      </h3>
                      <p className="text-white/40 text-sm mb-4">
                        {lang === 'en'
                          ? 'If an account exists with that email, a password reset link has been sent.'
                          : '如果该邮箱存在账户，密码重置链接已发送。'}
                      </p>
                      <button
                        onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(''); }}
                        className="px-4 py-2 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-xl text-sm"
                      >
                        {lang === 'en' ? 'Back to Login' : '返回登录'}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleResetRequest}>
                      <h3 className="text-white font-semibold mb-2">
                        {lang === 'en' ? 'Reset Password' : '重置密码'}
                      </h3>
                      <p className="text-white/40 text-xs mb-4">
                        {lang === 'en'
                          ? 'Enter your personal email (Gmail, etc.) to receive a reset link.'
                          : '输入您的个人邮箱（Gmail等）以接收重置链接。'}
                      </p>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="your.email@gmail.com"
                        className="w-full px-4 py-3 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-sky-400/30 mb-3"
                        required
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setShowReset(false); setResetEmail(''); }}
                          className="flex-1 py-2 rounded-xl text-sm border border-white/[0.08] text-white/60 hover:bg-white/[0.04] transition-all"
                        >
                          {lang === 'en' ? 'Cancel' : '取消'}
                        </button>
                        <button
                          type="submit"
                          disabled={resetLoading}
                          className="flex-1 py-2 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                        >
                          {resetLoading ? '...' : (lang === 'en' ? 'Send Reset Link' : '发送重置链接')}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Demo Accounts — always visible */}
          <motion.div
            className="mt-5 p-3 rounded-xl bg-gradient-to-br from-sky-500/[0.06] to-teal-500/[0.06] border border-sky-400/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-300 animate-pulse" />
              <p className="text-sky-200/60 text-[10px] uppercase tracking-widest font-medium">
                {lang === 'en' ? 'Access Credentials' : '访问凭据'}
              </p>
            </div>
            <div className="text-white/35 text-[9px] text-center space-y-0.5 font-mono">
              <p><span className="text-cyan-200/70">myoadmin</span> / myo123 — Myo Min (Dev Admin)</p>
              <p><span className="text-sky-200/70">yuadmin</span> / yu123 — Yulius Herman (Finance)</p>
              <p><span className="text-teal-200/70">admin</span> / admin123 — System Admin</p>
            </div>
          </motion.div>

          {/* Footer */}
          <div className="mt-4 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-white/20 text-[10px]">
              <div className="w-4 h-[1px] bg-gradient-to-r from-transparent to-white/20" />
              <span>© 2026 Unitech IT System • Singapore</span>
              <div className="w-4 h-[1px] bg-gradient-to-l from-transparent to-white/20" />
            </div>
            <span className="text-white/15 text-[9px] font-mono tracking-wider">v{APP_VERSION}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
