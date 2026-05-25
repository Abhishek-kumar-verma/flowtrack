import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  ChevronDown,
  X,
  Check,
  ChevronUp,
} from 'lucide-react';
import api from '../../utils/api';

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const LONG_BREAK_DURATION = 15 * 60;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function playNotification() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 1);
  } catch (e) {
    // Audio not available
  }
}

export default function PomodoroTimer({ tasks = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mode, setMode] = useState('work'); // work | break | longbreak
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef(null);

  const totalTime = mode === 'work' ? WORK_DURATION : mode === 'break' ? BREAK_DURATION : LONG_BREAK_DURATION;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  const handleComplete = useCallback(async () => {
    setIsRunning(false);
    setCompleted(true);
    playNotification();

    if (mode === 'work' && sessionId) {
      try {
        await api.patch(`/pomodoro/${sessionId}/end`, {
          completed: true,
          task_id: selectedTaskId || undefined,
        });
      } catch (e) {
        // ignore
      }
      setSessionId(null);
      setSessionCount(c => c + 1);
    }

    setTimeout(() => setCompleted(false), 3000);
  }, [mode, sessionId, selectedTaskId]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, handleComplete]);

  const handleStart = async () => {
    if (!isRunning && mode === 'work' && !sessionId) {
      try {
        const res = await api.post('/pomodoro', {
          task_id: selectedTaskId || undefined,
          duration_minutes: 25,
        });
        setSessionId(res.data?.id || res.data?.session?.id || null);
      } catch (e) {
        // session tracking unavailable
      }
    }
    setIsRunning(r => !r);
  };

  const handleReset = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setTimeLeft(
      mode === 'work' ? WORK_DURATION : mode === 'break' ? BREAK_DURATION : LONG_BREAK_DURATION
    );
    setSessionId(null);
    setCompleted(false);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setTimeLeft(
      newMode === 'work' ? WORK_DURATION : newMode === 'break' ? BREAK_DURATION : LONG_BREAK_DURATION
    );
    setSessionId(null);
    setCompleted(false);
  };

  const modeColors = {
    work: { ring: '#6366f1', glow: 'shadow-indigo-500/30', bg: 'from-indigo-600 to-purple-600', text: 'text-indigo-400' },
    break: { ring: '#10b981', glow: 'shadow-emerald-500/30', bg: 'from-emerald-600 to-teal-600', text: 'text-emerald-400' },
    longbreak: { ring: '#f59e0b', glow: 'shadow-amber-500/30', bg: 'from-amber-600 to-orange-600', text: 'text-amber-400' },
  };
  const colors = modeColors[mode];

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br ${colors.bg} shadow-xl ${colors.glow} flex items-center justify-center text-white`}
        >
          {isRunning ? (
            <div className="text-center">
              <p className="text-xs font-bold leading-none">{formatTime(timeLeft).split(':')[0]}</p>
              <p className="text-xs text-white/70 leading-none">{formatTime(timeLeft).split(':')[1]}</p>
            </div>
          ) : (
            <Timer size={22} />
          )}
        </motion.button>
      )}

      {/* Timer panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${colors.bg} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                {mode === 'work' ? <Brain size={16} className="text-white" /> : <Coffee size={16} className="text-white" />}
                <span className="text-white font-semibold text-sm">
                  {mode === 'work' ? 'Focus Session' : mode === 'break' ? 'Short Break' : 'Long Break'}
                </span>
                {sessionCount > 0 && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                    {sessionCount} done
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setIsMinimized(m => !m)}
                  className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button
                  onClick={() => { setIsOpen(false); setIsMinimized(false); }}
                  className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Mode tabs */}
                  <div className="flex border-b border-gray-800">
                    {[
                      { id: 'work', label: 'Focus', icon: Brain },
                      { id: 'break', label: '5m Break', icon: Coffee },
                      { id: 'longbreak', label: '15m Break', icon: Coffee },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => switchMode(id)}
                        className={`flex-1 py-2 text-xs font-medium transition-colors ${
                          mode === id
                            ? `${colors.text} border-b-2 border-current`
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="p-5 flex flex-col items-center gap-4">
                    {/* SVG circular timer */}
                    <div className="relative">
                      <svg width={136} height={136}>
                        <circle
                          cx={68} cy={68} r={radius}
                          fill="none" stroke="#1f2937" strokeWidth={8}
                        />
                        <motion.circle
                          cx={68} cy={68} r={radius}
                          fill="none"
                          stroke={colors.ring}
                          strokeWidth={8}
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          transform="rotate(-90 68 68)"
                          style={{ filter: `drop-shadow(0 0 6px ${colors.ring}80)`, transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <AnimatePresence mode="wait">
                          {completed ? (
                            <motion.div
                              key="done"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="flex flex-col items-center"
                            >
                              <Check size={28} className="text-emerald-400" />
                              <span className="text-emerald-400 text-xs font-medium mt-1">Done!</span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="time"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col items-center"
                            >
                              <span className="text-3xl font-bold font-mono text-white tracking-wider">
                                {formatTime(timeLeft)}
                              </span>
                              <span className={`text-xs font-medium mt-1 ${colors.text}`}>
                                {Math.round(progress)}% complete
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleReset}
                        className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStart}
                        className={`px-6 py-2.5 rounded-xl bg-gradient-to-r ${colors.bg} text-white font-semibold text-sm shadow-lg flex items-center gap-2`}
                      >
                        {isRunning ? <Pause size={16} /> : <Play size={16} />}
                        {isRunning ? 'Pause' : 'Start'}
                      </motion.button>
                    </div>

                    {/* Task selector */}
                    {tasks.length > 0 && (
                      <div className="w-full">
                        <label className="text-xs text-gray-500 mb-1 block">Link to task</label>
                        <select
                          value={selectedTaskId}
                          onChange={e => setSelectedTaskId(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                          disabled={isRunning}
                        >
                          <option value="">No task selected</option>
                          {tasks.map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Info */}
                    <p className="text-xs text-gray-600 text-center">
                      {mode === 'work'
                        ? 'Stay focused. Avoid distractions.'
                        : 'Take a break. Stretch or breathe.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Minimized time bar */}
            {isMinimized && (
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-white font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
                <button onClick={handleStart} className={`${colors.text} hover:text-white transition-colors`}>
                  {isRunning ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
