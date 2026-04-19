'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, X, Camera, AlertCircle, CheckCircle2, Keyboard } from 'lucide-react';
import { useApp } from '@/lib/context';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const { lang } = useApp();
  const [error, setError] = useState('');
  const [scannedCode, setScannedCode] = useState('');
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const scanner = html5QrCodeRef.current as { stop: () => Promise<void>; clear: () => void };
        await scanner.stop();
        scanner.clear();
      } catch {
        // Scanner may already be stopped
      }
      html5QrCodeRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (mode !== 'camera') return;

    let mounted = true;

    const startCamera = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted || !scannerRef.current) return;

        const scannerId = 'barcode-scanner-region';
        scannerRef.current.id = scannerId;

        const scanner = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 150 }, aspectRatio: 1.5 },
          (decodedText: string) => {
            setScannedCode(decodedText);
            scanner.stop().catch(() => {});
          },
          () => {}
        );
      } catch {
        if (mounted) {
          setError(lang === 'en'
            ? 'Camera access denied. Use manual entry instead.'
            : '相机访问被拒绝。请使用手动输入。');
          setMode('manual');
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [mode, lang, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setScannedCode(manualInput.trim());
  };

  const handleConfirm = () => {
    if (scannedCode) {
      onScan(scannedCode);
      onClose();
    }
  };

  const handleClose = async () => {
    await stopCamera();
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-card p-6 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-cyan-400" />
            {lang === 'en' ? 'Barcode / QR Scanner' : '条码 / 二维码扫描'}
          </h3>
          <button onClick={handleClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-4">
          <button
            onClick={() => { setMode('camera'); setScannedCode(''); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              mode === 'camera' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            {lang === 'en' ? 'Camera' : '相机'}
          </button>
          <button
            onClick={() => { stopCamera(); setMode('manual'); setScannedCode(''); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              mode === 'manual' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            {lang === 'en' ? 'Manual' : '手动'}
          </button>
        </div>

        {/* Camera Mode */}
        {mode === 'camera' && !scannedCode && (
          <div className="relative">
            <div ref={scannerRef} className="rounded-xl overflow-hidden bg-black/30 min-h-[240px]" />
            <motion.div
              className="absolute top-1/2 left-4 right-4 h-0.5 bg-cyan-400/60"
              animate={{ y: [-50, 50] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            />
            <p className="text-white/40 text-xs text-center mt-3">
              {lang === 'en' ? 'Point camera at barcode or QR code' : '将相机对准条码或二维码'}
            </p>
          </div>
        )}

        {/* Manual Mode */}
        {mode === 'manual' && !scannedCode && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="text-white/40 text-xs mb-1 block">
                {lang === 'en' ? 'Enter barcode / serial / asset tag' : '输入条码 / 序列号 / 资产编号'}
              </label>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="glass-input w-full px-4 py-3 text-sm"
                placeholder={lang === 'en' ? 'e.g. UT-LP-001 or S/N: C02XK1TZ...' : '例如 UT-LP-001 或 S/N: C02XK1TZ...'}
                autoFocus
              />
            </div>
            <motion.button
              type="submit"
              disabled={!manualInput.trim()}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-all"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {lang === 'en' ? 'Look Up Asset' : '查询资产'}
            </motion.button>
          </form>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-amber-400 text-xs mt-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Scan Result */}
        <AnimatePresence>
          {scannedCode && (
            <motion.div
              className="mt-4 space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle2 className="w-5 h-5" />
                {lang === 'en' ? 'Code detected!' : '检测到编码！'}
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white/40 text-xs mb-1">{lang === 'en' ? 'Scanned Value' : '扫描结果'}</p>
                <p className="text-white font-mono text-sm">{scannedCode}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setScannedCode(''); setManualInput(''); }}
                  className="flex-1 glass-button py-2 text-sm"
                >
                  {lang === 'en' ? 'Scan Again' : '重新扫描'}
                </button>
                <motion.button
                  onClick={handleConfirm}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {lang === 'en' ? 'Confirm & Find' : '确认并查找'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
