import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

export default function ScoreRing({ score = 0, label = '', color = '#6366f1', size = 120 }) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(score, 100)) / 100;

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const step = 16;
    const increment = score / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [score]);

  const getScoreColor = (s) => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#6366f1';
    if (s >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const ringColor = color || getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth={8}
          />
          {/* Score arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${ringColor}80)` }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-bold text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {displayScore}
          </motion.span>
          <span className="text-xs text-gray-500 font-medium">/100</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-gray-300">{label}</p>
        <div
          className="h-0.5 w-8 mx-auto mt-1 rounded-full"
          style={{ backgroundColor: ringColor }}
        />
      </div>
    </div>
  );
}
