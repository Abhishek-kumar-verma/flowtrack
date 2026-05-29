import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const score = payload[0]?.value;
  return (
    <div className="bg-gray-900 border border-indigo-500/30 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-lg">
        {score}
        <span className="text-indigo-400 text-sm ml-1">/ 100</span>
      </p>
      <div className="mt-1 h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

const CustomDot = (props) => {
  const { cx, cy, value } = props;
  if (value === undefined) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#6366f1"
      stroke="#818cf8"
      strokeWidth={2}
    />
  );
};

export default function ProductivityChart({ data = [], period = 'week' }) {
  const avgScore = data?.averageScore ?? 0;
  const formatted = data?.scores?.map(d => ({
    ...d,
    score: d.score ?? d.productivity_score ?? 0,
    label:
      period === 'year'
        ? new Date(d.date).toLocaleDateString('en-US', { month: 'short' })
        : period === 'month'
        ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-400 text-sm">Average Score</p>
          <p className="text-3xl font-bold text-white">
            {avgScore}
            <span className="text-indigo-400 text-lg ml-1">/100</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-gray-400 text-sm">Productivity Score</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-500">
          No data available for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={period === 'year' ? 0 : 'preserveStartEnd'}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <ReferenceLine y={avgScore} stroke="#818cf8" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#productivityGradient)"
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
