import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animate?: boolean;
  showTagline?: boolean;
}

// Color sampled directly from the brand logo, so the text wordmark always
// matches the icon exactly rather than relying on a design guess.
const BRAND_GREEN = '#99CC33';

export default function Logo({ size = 'md', showText = true, showTagline = false }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'w-9 h-9', text: 'text-base', tagline: 'text-[8px]' },
    md: { icon: 'w-12 h-12', text: 'text-xl', tagline: 'text-[9px]' },
    lg: { icon: 'w-20 h-20', text: 'text-3xl', tagline: 'text-[10px]' },
    xl: { icon: 'w-28 h-28', text: 'text-4xl', tagline: 'text-[11px]' },
  };

  const selectedSize = sizeClasses[size];

  return (
    <div className="flex flex-col items-center gap-2 font-sans select-none">
      <div className="flex items-center gap-2.5">
        <img
          src="/brand/logo-icon.png"
          alt="TradeEase"
          className={`${selectedSize.icon} rounded-[22%] object-contain shrink-0`}
          draggable={false}
        />
        {showText && (
          <span className={`${selectedSize.text} font-extrabold tracking-tight leading-none`}>
            <span className="text-slate-900 dark:text-white">Trade</span>
            <span style={{ color: BRAND_GREEN }}>Ease</span>
          </span>
        )}
      </div>
      {showTagline && (
        <span className={`${selectedSize.tagline} uppercase tracking-[0.2em] font-semibold text-gray-500 dark:text-gray-400`}>
          Nigeria's Marketplace
        </span>
      )}
    </div>
  );
}
