import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ArrowLeftRight, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

interface WalkthroughProps {
  onComplete: () => void;
}

interface WalkthroughStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  badge: string;
}

export default function Walkthrough({ onComplete }: WalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: WalkthroughStep[] = [
    {
      badge: "SHOP LOCAL",
      title: "Everything You Need, Close By",
      subtitle: "Real vendors, fair prices",
      description: "Phones, clothes, books, groceries, and more, from sellers across Nigeria, all priced in Naira.",
      gradient: "from-emerald-500 to-teal-600",
      icon: (
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
          <ShoppingBag className="w-20 h-20 text-white relative z-10" />
        </div>
      ),
    },
    {
      badge: "TWO SIDES, ONE APP",
      title: "Shop Today, Sell Tomorrow",
      subtitle: "Switch anytime you like",
      description: "Buying and selling both happen right here. Move between the two whenever it suits you.",
      gradient: "from-amber-500 to-orange-600",
      icon: (
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
          <ArrowLeftRight className="w-20 h-20 text-white relative z-10" />
        </div>
      ),
    },
    {
      badge: "GROW YOUR BUSINESS",
      title: "Your Shop, In Your Pocket",
      subtitle: "Simple tools, real results",
      description: "List products, track orders, and get paid, all from your phone.",
      gradient: "from-blue-500 to-indigo-600",
      icon: (
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
          <TrendingUp className="w-20 h-20 text-white relative z-10" />
        </div>
      ),
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 font-sans justify-between overflow-hidden">
      {/* Header controls */}
      <div className="flex items-center justify-between p-6 z-15">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-0 transition-all ${
            currentStep === 0 ? 'pointer-events-none' : 'cursor-pointer'
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onComplete}
          className="px-3.5 py-1.5 bg-gray-200/60 dark:bg-gray-800/60 hover:bg-gray-200 dark:hover:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-full transition-colors cursor-pointer"
        >
          Skip
        </button>
      </div>

      {/* Slide graphics and content box */}
      <div className="flex-1 flex flex-col justify-center px-6 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="flex flex-col items-center text-center self-center"
          >
            {/* Visual Backing Grid Box */}
            <div className={`w-44 h-44 rounded-3xl bg-gradient-to-tr ${steps[currentStep].gradient} flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-8 max-w-full relative overflow-hidden`}>
              {/* Subtle grid texture behind the icon */}
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
              {steps[currentStep].icon}
            </div>

            {/* Content Text Box */}
            <div className="space-y-3 px-2">
              <span className="text-[10px] tracking-widest font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full uppercase">
                {steps[currentStep].badge}
              </span>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight pt-1">
                {steps[currentStep].title}
              </h2>
              <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {steps[currentStep].subtitle}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed pt-2">
                {steps[currentStep].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer controls & steps indicator */}
      <div className="p-6 pb-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40">
        <div className="flex items-center justify-between">
          {/* Step dots */}
          <div className="flex items-center gap-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-6 bg-emerald-500'
                    : 'w-2.5 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action button */}
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-bold rounded-xl shadow-md cursor-pointer select-none transition-transform active:scale-[0.98]"
          >
            {currentStep === steps.length - 1 ? (
              <span>Get Started</span>
            ) : (
              <>
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
