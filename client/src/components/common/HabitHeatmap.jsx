import { useState } from 'react';
import { motion } from 'framer-motion';

export default function HabitHeatmap({ data = [], days = 30 }) {
  const [tooltip, setTooltip] = useState(null);

  // Build a 30-day grid
  const today = new Date();
  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const entry = data.find(d => d.date === dateStr);
    cells.push({
      date: dateStr,
      completed: entry?.completed ?? false,
      count: entry?.count ?? 0,
      display: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }

  // Split into rows of 7 (weeks)
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <div className="relative">
      <div className="flex flex-col gap-1">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1">
            {row.map((cell, cellIdx) => (
              <motion.div
                key={cell.date}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (rowIdx * 7 + cellIdx) * 0.01, duration: 0.2 }}
                className={`relative w-6 h-6 rounded-sm cursor-pointer transition-all duration-150 hover:ring-1 hover:ring-white/30 ${
                  cell.completed
                    ? 'bg-emerald-500 border border-emerald-400 shadow-sm shadow-emerald-500/30'
                    : 'bg-gray-800 border border-gray-700'
                }`}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({ ...cell, x: rect.left, y: rect.top });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl pointer-events-none"
          style={{ left: tooltip.x - 40, top: tooltip.y - 52 }}
        >
          <div className={`font-semibold ${tooltip.completed ? 'text-emerald-400' : 'text-gray-400'}`}>
            {tooltip.completed ? 'Completed' : 'Missed'}
          </div>
          <div className="text-gray-500">{tooltip.display}</div>
        </div>
      )}
    </div>
  );
}
