import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animate?: boolean;
  showTagline?: boolean;
}

export default function Logo({ size = 'md', showText = true, animate = true, showTagline = true }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'w-8 h-8', text: 'text-lg', container: 'gap-1.5' },
    md: { icon: 'w-12 h-12', text: 'text-2xl', container: 'gap-2' },
    lg: { icon: 'w-20 h-20', text: 'text-4xl', container: 'gap-3' },
    xl: { icon: 'w-32 h-32', text: 'text-5xl', container: 'gap-4' },
  };

  const selectedSize = sizeClasses[size];

  return (
    <div className={`flex items-center justify-center ${selectedSize.container} font-sans`}>
      <div className={`relative ${selectedSize.icon}`}>
        {/* Animated Background Ring */}
        {animate && (
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping scale-75 opacity-75" />
        )}
        
        {/* SVG Icon */}
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          {/* Main Shield & Letter T */}
          <path
            d="M12 16C12 10.4772 16.4772 6 22 6H42C47.5228 6 52 10.4772 52 16V36C52 46.5 44 54 32 58C20 54 12 46.5 12 36V16Z"
            fill="url(#logo-grad-primary)"
          />
          {/* Inner details representing exchange & curves */}
          <path
            d="M20 18H44"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M32 18V46"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Curved Arrow representing Trade Exchange */}
          <path
            d="M26 34C26 30 30 28 34 30C38 32 38 36 34 38C30 40 26 40 23 37"
            stroke="#A8D96B"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Spark light green star */}
          <path
            d="M34 26L35.5 28.5L38 29L36 31L36.5 33.5L34 32L31.5 33.5L32 31L30 29L32.5 28.5L34 26Z"
            fill="#A8D96B"
          />
          
          <defs>
            <linearGradient id="logo-grad-primary" x1="12" y1="6" x2="52" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6DBE2E" />
              <stop stopColor="#0D2E2A" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col items-start leading-none select-none">
          <span className={`${selectedSize.text} font-extrabold tracking-tight`}>
            <span className="text-slate-900 dark:text-white">Trade</span>
            <span className="text-[#A8D96B]">Ease</span>
          </span>
          {showTagline && (
            <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
              Naija Multivendor
            </span>
          )}
        </div>
      )}
    </div>
  );
}
