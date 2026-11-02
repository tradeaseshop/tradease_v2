import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import Logo from './Logo';

interface SplashscreenProps {
  onComplete: () => void;
}

export default function Splashscreen({ onComplete }: SplashscreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-950 p-8 select-none font-sans text-center relative overflow-hidden">
      {/* Dynamic Background glowing ambient circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Top Grid lines */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none" />

      {/* Brand logo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-center relative z-10"
      >
        <Logo size="xl" showText={true} layout="stack" />
      </motion.div>
    </div>
  );
}
