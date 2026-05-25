import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getColor(count) {
  if (!count || count === 0) return 'bg-gray-800 border-gray-700';
  if (count <= 2) return 'bg-emerald-900 border-emerald-800';
  if (count <= 4) return 'bg-emerald-700 border-emerald-600';
  if (count <= 7) return 'bg-emerald-500 border-emerald-400';
  return 'bg-emerald-400 border-emerald-300';
}

function getColorIntensity(count) {
  if (!count || count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
}

export default function ActivityHeatmap({ data = [], year }) {
  const [tooltip, setTooltip] = useState(null);
  const currentYear = year || new Date().getFullYear();

  const { weeks, monthLabels } = useMemo(() => {
    const dataMap = {};
    data.forEach(d => {
      dataMap[d.date] = d.count;
    });

    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    // Pad to start of week (Sunday)
    const startDow = startDate.getDay();
    const gridStart = new Date(startDate);
    gridStart.setDate(gridStart.getDate() - startDow);

    const weeks = [];
    const monthLabelPositions = {};
    let currentDate = new Date(gridStart);
    let weekIdx = 0;

    while (currentDate <= endDate || currentDate.getDay() !== 0) {
      if (currentDate > endDate && currentDate.getDay() === 0) break;
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isCurrentYear = currentDate.getFullYear() === currentYear;
        week.push({
          date: dateStr,
          count: isCurrentYear ? (dataMap[dateStr] || 0) : null,
          day: currentDate.getDay(),
          month: currentDate.getMonth(),
          dayNum: currentDate.getDate(),
          inRange: isCurrentYear,
        });

        // Track first week of each month
        if (isCurrentYear && currentDate.getDate() <= 7 && d === 0) {
          monthLabelPositions[weekIdx] = currentDate.getMonth();
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
      weekIdx++;
    }

    return { weeks, monthLabels: monthLabelPositions };
  }, [data, currentYear]);

  const cellSize = 12;
  const gap = 2;

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="min-w-max">
        {/* Month labels */}
        <div className="flex ml-8 mb-1">
          {weeks.map((_, wIdx) => (
            <div
              key={wIdx}
              className="text-xs text-gray-500 font-medium"
              style={{ width: cellSize + gap, flexShrink: 0 }}
            >
              {monthLabels[wIdx] !== undefined ? MONTHS[monthLabels[wIdx]] : ''}
            </div>
          ))}
        </div>

        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col mr-1" style={{ gap: gap }}>
            {DAYS.map((day, i) => (
              <div
                key={day}
                className="text-xs text-gray-600 font-medium flex items-center"
                style={{ height: cellSize, width: 28 }}
              >
                {i % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex" style={{ gap: gap }}>
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col" style={{ gap: gap }}>
                {week.map((cell, dIdx) => (
                  <div
                    key={dIdx}
                    className="relative"
                    onMouseEnter={(e) => {
                      if (cell.inRange) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          date: cell.date,
                          count: cell.count,
                          x: rect.left + window.scrollX,
                          y: rect.top + window.scrollY,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: wIdx * 0.003 + dIdx * 0.001, duration: 0.2 }}
                      className={`rounded-sm border cursor-pointer transition-all duration-150 hover:ring-1 hover:ring-white/30 ${
                        cell.inRange
                          ? getColor(cell.count)
                          : 'bg-transparent border-transparent'
                      }`}
                      style={{ width: cellSize, height: cellSize }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 ml-8">
          <span className="text-xs text-gray-500">Less</span>
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`rounded-sm border ${getColor(level === 0 ? 0 : level === 1 ? 1 : level === 2 ? 3 : level === 3 ? 5 : 8)}`}
              style={{ width: cellSize, height: cellSize }}
            />
          ))}
          <span className="text-xs text-gray-500">More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl pointer-events-none"
          style={{ left: tooltip.x - 50, top: tooltip.y - 56 }}
        >
          <div className="text-white font-semibold">
            {tooltip.count} {tooltip.count === 1 ? 'activity' : 'activities'}
          </div>
          <div className="text-gray-400">
            {new Date(tooltip.date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      )}
    </div>
  );
}
