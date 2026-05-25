import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Palette,
  Bell,
  Shield,
  LogOut,
  Save,
  Copy,
  Check,
  Plus,
  X,
  Sun,
  Moon,
  Loader2,
  AlertTriangle,
  Settings as SettingsIcon,
  Target,
  Flame,
  Clock,
  CheckCircle2,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import api from '../utils/api';
import Layout from '../components/common/Layout';
import { useTheme } from '../hooks/useTheme';

const ACCENT_COLORS = [
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500', ring: 'ring-indigo-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500', ring: 'ring-purple-500' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-500', ring: 'ring-blue-500' },
  { name: 'Emerald', value: 'emerald', class: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { name: 'Rose', value: 'rose', class: 'bg-rose-500', ring: 'ring-rose-500' },
  { name: 'Amber', value: 'amber', class: 'bg-amber-500', ring: 'ring-amber-500' },
];

function Toggle({ checked, onChange, size = 'default' }) {
  const large = size === 'large';
  return (
    <motion.button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative rounded-full transition-colors duration-300 focus:outline-none ${
        large ? 'w-16 h-8' : 'w-12 h-6'
      } ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-dark-600'}`}
    >
      <motion.div
        layout
        className={`absolute top-1 rounded-full bg-white shadow-md ${
          large ? 'w-6 h-6' : 'w-4 h-4'
        }`}
        animate={{ left: checked ? (large ? '36px' : '26px') : '4px' }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      />
    </motion.button>
  );
}

function SectionCard({ title, icon: Icon, color = 'indigo', children }) {
  const colorMap = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-600/80 rounded-2xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-slate-200 dark:border-dark-600/50 flex items-center gap-3">
        <div className={`p-1.5 rounded-lg border ${colorMap[color]}`}>
          <Icon size={16} />
        </div>
        <h2 className="text-slate-900 dark:text-white font-semibold">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

export default function Settings() {
  const [profile, setProfile] = useState({ display_name: '', life_goal: '', username: '', created_at: '', priorities: [] });
  const [stats, setStats] = useState({ total_tasks: 0, current_streak: 0, total_sessions: 0 });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [newPriority, setNewPriority] = useState('');
  // ── Theme ── connected to useTheme so the toggle actually works
  const { isDark, toggleTheme } = useTheme();
  const [accentColor, setAccentColor] = useState('indigo');
  const [notifications, setNotifications] = useState({
    daily_reminder: true,
    eod_analysis: false,
    weekly_report: true,
    reminder_time: '08:00',
  });
  const [copied, setCopied] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await api.get('/users/profile');
      const data = res.data?.user || res.data;
      setProfile({
        display_name: data.display_name || data.name || '',
        life_goal: data.life_goal || '',
        username: data.username || data.email || '',
        created_at: data.created_at || data.createdAt || '',
        priorities: Array.isArray(data.priorities) ? data.priorities : [],
      });
      setStats({
        total_tasks: data.total_tasks || res.data?.stats?.total_tasks || 0,
        current_streak: data.current_streak || res.data?.stats?.current_streak || 0,
        total_sessions: data.total_sessions || res.data?.stats?.total_sessions || 0,
      });
    } catch (e) {
      setError('Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    try {
      await api.put('/users/profile', {
        display_name: profile.display_name,
        life_goal: profile.life_goal,
        priorities: profile.priorities,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const addPriority = () => {
    const val = newPriority.trim();
    if (val && !profile.priorities.includes(val) && profile.priorities.length < 10) {
      setProfile(p => ({ ...p, priorities: [...p.priorities, val] }));
      setNewPriority('');
    }
  };

  const removePriority = (tag) => {
    setProfile(p => ({ ...p, priorities: p.priorities.filter(t => t !== tag) }));
  };

  const copyUsername = () => {
    navigator.clipboard.writeText(profile.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearTodayData = async () => {
    setClearingData(true);
    try {
      await api.delete('/users/today-data');
      setShowClearConfirm(false);
    } catch (e) {
      console.error('Failed to clear data');
    } finally {
      setClearingData(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('flowtrack_token');
    window.location.href = '/login';
  };

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <Layout title="Settings">
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-dark-700 border border-slate-200 dark:border-dark-600">
              <SettingsIcon size={22} className="text-slate-600 dark:text-gray-300" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
          </div>
          <p className="text-slate-500 ml-12">Manage your account and preferences</p>
        </motion.div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Settings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <SectionCard title="Profile Settings" icon={User} color="indigo">
              {loadingProfile ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-dark-700 rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <form onSubmit={saveProfile} className="space-y-5">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5 block">Display Name</label>
                    <input
                      type="text"
                      value={profile.display_name}
                      onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
                      placeholder="Your name"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5 block">Life Goal</label>
                    <textarea
                      value={profile.life_goal}
                      onChange={e => setProfile(p => ({ ...p, life_goal: e.target.value }))}
                      placeholder="What is your ultimate life goal? This helps AI give better personalized insights..."
                      rows={3}
                      className="input-field resize-none"
                    />
                  </div>

                  {/* Daily Priorities */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5 block">Daily Priorities (tags)</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <AnimatePresence>
                        {profile.priorities.map(tag => (
                          <motion.span
                            key={tag}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 dark:text-indigo-300 text-xs px-3 py-1.5 rounded-full"
                          >
                            {tag}
                            <button type="button" onClick={() => removePriority(tag)} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-white transition-colors">
                              <X size={12} />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPriority}
                        onChange={e => setNewPriority(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPriority())}
                        placeholder="Add priority tag..."
                        maxLength={30}
                        className="input-field flex-1"
                      />
                      <button
                        type="button"
                        onClick={addPriority}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-dark-700 border border-slate-200 dark:border-dark-600 hover:border-indigo-500 text-slate-500 dark:text-gray-400 hover:text-indigo-400 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-lg disabled:opacity-60 transition-all"
                  >
                    {savingProfile ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : profileSaved ? (
                      <Check size={16} className="text-emerald-400" />
                    ) : (
                      <Save size={16} />
                    )}
                    {profileSaved ? 'Saved!' : 'Save Changes'}
                  </motion.button>
                </form>
              )}
            </SectionCard>
          </motion.div>

          {/* Theme Settings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <SectionCard title="Theme & Appearance" icon={Palette} color="purple">
              {/* Dark/Light toggle */}
              <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-200 dark:border-dark-600/50">
                <div className="flex items-center gap-3">
                  {isDark ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-amber-400" />}
                  <div>
                    <p className="text-slate-900 dark:text-white font-medium text-sm">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                    <p className="text-slate-500 text-xs">{isDark ? 'Easy on the eyes' : 'Bright and clean'}</p>
                  </div>
                </div>
                <Toggle checked={isDark} onChange={toggleTheme} size="large" />
              </div>

              {/* Accent color picker */}
              <div>
                <p className="text-slate-500 dark:text-gray-400 text-sm font-medium mb-3">Accent Color</p>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map(color => (
                    <motion.button
                      key={color.value}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAccentColor(color.value)}
                      className={`relative w-10 h-10 rounded-xl ${color.class} transition-all ${
                        accentColor === color.value ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-dark-800 ${color.ring}` : ''
                      }`}
                      title={color.name}
                    >
                      {accentColor === color.value && (
                        <Check size={14} className="text-white absolute inset-0 m-auto" />
                      )}
                    </motion.button>
                  ))}
                </div>
                <p className="text-slate-400 dark:text-gray-600 text-xs mt-2">Selected: {ACCENT_COLORS.find(c => c.value === accentColor)?.name}</p>
              </div>
            </SectionCard>
          </motion.div>

          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <SectionCard title="Notifications" icon={Bell} color="blue">
              <div className="space-y-4">
                {[
                  { key: 'daily_reminder', label: 'Daily Reminder', desc: 'Get notified to complete your daily tasks' },
                  { key: 'eod_analysis', label: 'End of Day Analysis', desc: 'Reminder to review your day before sleep' },
                  { key: 'weekly_report', label: 'Weekly Report', desc: 'Summary of your weekly performance' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-slate-900 dark:text-white text-sm font-medium">{label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                    </div>
                    <Toggle
                      checked={notifications[key]}
                      onChange={val => setNotifications(n => ({ ...n, [key]: val }))}
                    />
                  </div>
                ))}

                {notifications.daily_reminder && (
                  <div className="pt-2 border-t border-slate-200 dark:border-dark-600/50">
                    <label className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5 block">Reminder Time</label>
                    <input
                      type="time"
                      value={notifications.reminder_time}
                      onChange={e => setNotifications(n => ({ ...n, reminder_time: e.target.value }))}
                      className="input-field w-auto"
                    />
                  </div>
                )}

                <p className="text-slate-400 dark:text-gray-700 text-xs pt-1">Notification preferences are saved locally. Push notifications require browser permission.</p>
              </div>
            </SectionCard>
          </motion.div>

          {/* Account Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <SectionCard title="Account Information" icon={Shield} color="emerald">
              {loadingProfile ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-8 bg-slate-100 dark:bg-dark-700 rounded-lg animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Username */}
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Username / Email</p>
                    <div className="flex items-center gap-3">
                      <span className="flex-1 text-slate-900 dark:text-white font-mono text-sm bg-slate-100 dark:bg-dark-700 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2.5 truncate">
                        {profile.username || '—'}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={copyUsername}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-dark-700 border border-slate-200 dark:border-dark-600 hover:border-emerald-500 text-slate-500 dark:text-gray-400 hover:text-emerald-400 transition-colors"
                      >
                        {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-500 text-xs mb-1">Member Since</p>
                    <p className="text-slate-900 dark:text-white text-sm bg-slate-100 dark:bg-dark-700 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2.5">
                      {memberSince}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {[
                      { icon: CheckCircle2, label: 'Total Tasks', value: stats.total_tasks, color: 'text-emerald-400' },
                      { icon: Flame, label: 'Day Streak', value: stats.current_streak, color: 'text-orange-400' },
                      { icon: Clock, label: 'Sessions', value: stats.total_sessions, color: 'text-purple-400' },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className="bg-slate-100 dark:bg-dark-700 border border-slate-200 dark:border-dark-600 rounded-xl p-3 text-center">
                        <Icon size={16} className={`${color} mx-auto mb-1`} />
                        <p className="text-slate-900 dark:text-white font-bold text-lg">{value}</p>
                        <p className="text-slate-500 text-xs">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* Danger Zone */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <SectionCard title="Danger Zone" icon={AlertTriangle} color="red">
              <div className="space-y-4">
                {/* Clear today's data */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-slate-900 dark:text-white text-sm font-medium">Clear Today's Data</p>
                    <p className="text-slate-500 text-xs mt-0.5">Removes all tasks, logs, and sessions for today</p>
                  </div>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="px-4 py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Clear
                  </button>
                </div>

                <div className="border-t border-slate-200 dark:border-dark-600/50 pt-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-slate-900 dark:text-white text-sm font-medium">Sign Out</p>
                      <p className="text-slate-500 text-xs mt-0.5">Log out of your account on this device</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-dark-700 border border-slate-200 dark:border-dark-600 hover:border-red-500/40 hover:bg-red-500/10 text-slate-500 dark:text-gray-400 hover:text-red-400 transition-all text-sm font-medium flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </SectionCard>
          </motion.div>
        </div>
      </div>

      {/* Clear Data Confirm */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-600 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <h3 className="text-slate-900 dark:text-white font-semibold text-lg">Clear Today's Data?</h3>
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-5">
                This will permanently delete all tasks, habit logs, pomodoro sessions, and activities recorded today. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-600 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={clearTodayData}
                  disabled={clearingData}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {clearingData ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Clear Data
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </Layout>
  );
}
