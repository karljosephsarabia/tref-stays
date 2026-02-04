import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import trefLogo from "@/assets/tref-logo.png";

const LOADING_DURATION_MS = 2500;

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / LOADING_DURATION_MS) * 100);
      setProgress(p);
    }, 50);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      onComplete();
    }, LOADING_DURATION_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(211,100%,45%)] to-[hsl(211,80%,35%)]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/10" />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="mb-6"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [1, 0.9, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <img src={trefLogo} alt="Tref" className="h-16 w-auto drop-shadow-lg md:h-20" />
        </motion.div>
        <p className="text-white/90 font-semibold text-lg tracking-wide mb-8">Your Perfect Rental Home</p>

        {/* Progress bar */}
        <div className="w-48 h-1.5 rounded-full bg-white/20 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-white to-white/80"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </motion.div>

      {/* Spinner rings */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-10 h-10 border-2 border-white/30 border-t-white rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}

export function LoadingScreenWrapper({ children }: { children: React.ReactNode }) {
  const [showLoading, setShowLoading] = useState(true);

  return (
    <>
      {children}
      <AnimatePresence>
        {showLoading && (
          <LoadingScreen onComplete={() => setShowLoading(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
