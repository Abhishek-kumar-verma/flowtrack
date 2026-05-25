import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Reusable stat card – dark theme version.
 *
 * Props:
 *   icon    – React element (lucide icon)
 *   label   – string
 *   value   – string | number
 *   trend   – number (optional; positive=up, negative=down, 0=flat)
 *   color   – 'primary' | 'accent' | 'emerald' | 'amber' | 'cyan' | 'rose' (default 'primary')
 *   suffix  – optional string appended after value
 */
const COLOR_MAP = {
  primary: {
    wrap: 'from-primary-500/20 to-primary-600/10 border-primary-500/20',
    icon: 'text-primary-400',
    value: 'text-primary-400',
  },
  accent: {
    wrap: 'from-accent-500/20 to-accent-600/10 border-accent-500/20',
    icon: 'text-accent-400',
    value: 'text-accent-400',
  },
  emerald: {
    wrap: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
    icon: 'text-emerald-400',
    value: 'text-emerald-400',
  },
  amber: {
    wrap: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
    icon: 'text-amber-400',
    value: 'text-amber-400',
  },
  cyan: {
    wrap: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20',
    icon: 'text-cyan-400',
    value: 'text-cyan-400',
  },
  rose: {
    wrap: 'from-rose-500/20 to-rose-600/10 border-rose-500/20',
    icon: 'text-rose-400',
    value: 'text-rose-400',
  },
};

export default function StatCard({ icon, label, value, trend, color = 'primary', suffix = '' }) {
  const c = COLOR_MAP[color] || COLOR_MAP.primary;

  const TrendIcon =
    trend == null ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend == null ? '' : trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 220 }}
      className="stat-card"
    >
      {/* Icon bubble */}
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.wrap} border flex items-center justify-center flex-shrink-0 ${c.icon}`}>
        {icon}
      </div>

      {/* Value */}
      <p className={`text-2xl font-bold leading-none mt-1 ${c.value}`}>
        {value ?? '—'}
        {suffix && <span className="ml-1 text-sm font-medium text-slate-400">{suffix}</span>}
      </p>

      {/* Label + trend */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {TrendIcon && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={12} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
