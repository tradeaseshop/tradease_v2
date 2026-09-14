import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Logo from './Logo';

interface SplashscreenProps {
  onComplete: () => void;
}

export default function Splashscreen({ onComplete }: SplashscreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Dynamic progressive loading stream
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    const timer = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-between h-full w-full bg-slate-950 p-8 select-none font-sans text-center relative overflow-hidden">
      {/* Dynamic Background glowing ambient circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Decorative Top Grid lines */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none" />

      {/* Spacing alignment block */}
      <div className="h-10" />

      {/* Brand logo container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-center scale-110 relative"
      >
        <Logo size="xl" showText={true} animate={true} showTagline={true} />
      </motion.div>

      {/* Loading Progress & Compliance Banner */}
      <div className="w-full max-w-[220px] space-y-6 z-10">
        {/* Animated Loading Bar */}
        <div className="space-y-2">
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-500 to-[#A8D96B] rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </div>
          <div className="flex justify-between items-center text-[8.5px] font-mono tracking-widest font-black text-gray-400 uppercase">
            <span>SECURE ESCROW LINK</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Localized Settlement Compliance Label */}
        <div className="text-[9px] text-gray-500 tracking-wider">
          CBN LICENSE ESCROW CHANNELS • v2.1
        </div>
      </div>
    </div>
  );
}
