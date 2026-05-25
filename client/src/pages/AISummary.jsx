import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Send,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Heart,
  Zap,
  Dumbbell,
  BookOpen,
  Loader2,
  Bot,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import api from '../utils/api';
import Layout from '../components/common/Layout';
import ScoreRing from '../components/ai/ScoreRing';
import ChatBubble from '../components/ai/ChatBubble';

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function displayDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function ListCard({ title, items = [], icon: Icon, color, emptyMsg }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon size={16} />
        </div>
        <h3 className="text-slate-900 dark:text-white font-semibold">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-slate-400 dark:text-gray-600 text-sm">{emptyMsg || 'None noted'}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-start gap-2 text-sm text-slate-600 dark:text-gray-300"
            >
              <Icon size={14} className={`mt-0.5 shrink-0 ${
                color.includes('emerald') ? 'text-emerald-400' :
                color.includes('orange') ? 'text-orange-400' :
                color.includes('blue') ? 'text-blue-400' : 'text-indigo-400'
              }`} />
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 flex items-center justify-center shrink-0">
        <Bot size={14} className="text-indigo-400" />
      </div>
      <div className="bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-slate-400 dark:bg-gray-500"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AISummary() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const fetchReport = async (date) => {
    setLoadingReport(true);
    setReport(null);
    try {
      const res = await api.get(`/ai/daily-summary?date=${date}`);
      setReport(res.data);
    } catch (e) {
      if (e.response?.status !== 404) {
        console.error('Failed to fetch report');
      }
    } finally {
      setLoadingReport(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/ai/daily-summary', { date: selectedDate });
      setReport(res.data);
    } catch (e) {
      console.error('Failed to generate report', e);
    } finally {
      setGenerating(false);
    }
  };

  const adjustDate = (days) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    const today = new Date();
    if (d > today) return;
    setSelectedDate(formatDate(d));
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || chatLoading) return;
    setInputText('');

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: text,
        date: selectedDate,
        history: messages.slice(-6),
      });
      const aiMsg = {
        role: 'assistant',
        content: res.data?.reply || res.data?.message || res.data?.content || 'I could not generate a response.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setChatLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isToday = selectedDate === formatDate(new Date());

  const scores = report ? [
    { label: 'Productivity', score: report.productivity_score ?? report.scores?.productivity ?? 0, color: '#6366f1' },
    { label: 'Discipline', score: report.discipline_score ?? report.scores?.discipline ?? 0, color: '#8b5cf6' },
    { label: 'Time Mgmt', score: report.time_management_score ?? report.scores?.time_management ?? 0, color: '#10b981' },
    { label: 'Focus Level', score: report.focus_score ?? report.scores?.focus ?? 0, color: '#f59e0b' },
  ] : [];

  return (
    <Layout title="AI Summary">
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Sparkles size={22} className="text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Daily Analysis</h1>
          </div>
          <p className="text-slate-500 ml-12">Intelligent insights powered by AI</p>
        </motion.div>

        {/* Date selector + Generate */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustDate(-1)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-indigo-400" />
              <input
                type="date"
                value={selectedDate}
                max={formatDate(new Date())}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-semibold text-sm focus:outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={() => adjustDate(1)}
              disabled={isToday}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="text-slate-500 text-sm hidden sm:block">{displayDate(selectedDate)}</div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateReport}
            disabled={generating || loadingReport}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-purple-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating... (5-10s)
              </>
            ) : (
              <>
                <Brain size={16} />
                {report ? 'Regenerate Report' : 'Generate Report'}
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Loading state */}
        {loadingReport && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 size={36} className="text-indigo-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-500 dark:text-gray-400">Loading report...</p>
            </div>
          </div>
        )}

        {/* No report state */}
        {!loadingReport && !report && !generating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-10 text-center mb-8"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center mx-auto mb-5">
              <Brain size={36} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Analysis Yet</h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Generate your AI-powered daily analysis to get personalized insights.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto mb-8">
              {[
                { icon: CheckCircle, label: 'Task Completion', color: 'text-emerald-400' },
                { icon: Dumbbell, label: 'Fitness Activity', color: 'text-orange-400' },
                { icon: BookOpen, label: 'Learning Progress', color: 'text-blue-400' },
                { icon: Zap, label: 'Focus Sessions', color: 'text-yellow-400' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="bg-slate-100 dark:bg-gray-800 rounded-xl p-3 text-center">
                  <Icon size={20} className={`${color} mx-auto mb-1`} />
                  <p className="text-slate-500 dark:text-gray-400 text-xs">{label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={generateReport}
              disabled={generating}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-purple-500/20 transition-all"
            >
              <Brain size={16} className="inline mr-2" />
              Generate AI Analysis
            </button>
          </motion.div>
        )}

        {/* Generating state */}
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-900 border border-purple-500/20 rounded-2xl p-10 text-center mb-8"
          >
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 opacity-20 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 flex items-center justify-center">
                <Brain size={36} className="text-purple-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Analyzing Your Day</h2>
            <p className="text-slate-500 text-sm">AI is reviewing your tasks, habits, fitness, and learning... (5-10s)</p>
            <div className="flex justify-center gap-1 mt-4">
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-purple-500"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Report display */}
        {report && !generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Score rings */}
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                Performance Scores
              </h2>
              <div className="flex flex-wrap justify-center sm:justify-around gap-8">
                {scores.map(({ label, score, color }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <ScoreRing score={score} label={label} color={color} size={120} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Summary narrative */}
            {(report.summary || report.narrative) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-indigo-50 dark:from-indigo-900/30 to-purple-50 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={18} className="text-indigo-400" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI Summary</h2>
                </div>
                <p className="text-slate-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-line">
                  {report.summary || report.narrative}
                </p>
              </motion.div>
            )}

            {/* Positive habits + Weak areas + Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ListCard
                title="Positive Habits"
                items={report.positive_habits || report.strengths || []}
                icon={CheckCircle}
                color="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                emptyMsg="Keep tracking to reveal patterns"
              />
              <ListCard
                title="Weak Areas"
                items={report.weak_areas || report.weaknesses || report.areas_for_improvement || []}
                icon={AlertTriangle}
                color="bg-orange-500/10 border border-orange-500/20 text-orange-400"
                emptyMsg="No weak areas identified"
              />
              <ListCard
                title="Suggestions"
                items={report.suggestions || report.recommendations || []}
                icon={Lightbulb}
                color="bg-blue-500/10 border border-blue-500/20 text-blue-400"
                emptyMsg="No suggestions at this time"
              />
            </div>

            {/* Motivation + Anti-procrastination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(report.motivation || report.motivational_message) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-purple-50 dark:from-purple-600/20 to-pink-50 dark:to-pink-600/20 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Heart size={16} className="text-pink-400" />
                    <h3 className="text-slate-900 dark:text-white font-semibold">Motivation</h3>
                  </div>
                  <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed italic">
                    "{report.motivation || report.motivational_message}"
                  </p>
                </motion.div>
              )}

              {(report.anti_procrastination_tip || report.procrastination_tip) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-yellow-50 dark:from-yellow-600/10 to-orange-50 dark:to-orange-600/10 border border-yellow-200 dark:border-yellow-500/20 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={16} className="text-yellow-500 dark:text-yellow-400" />
                    <h3 className="text-slate-900 dark:text-white font-semibold">Anti-Procrastination Tip</h3>
                  </div>
                  <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">
                    {report.anti_procrastination_tip || report.procrastination_tip}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Fitness & Learning side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {report.fitness_analysis && (
                <div className="bg-white dark:bg-gray-900 border border-orange-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Dumbbell size={16} className="text-orange-400" />
                    <h3 className="text-slate-900 dark:text-white font-semibold">Fitness Analysis</h3>
                  </div>
                  <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">{report.fitness_analysis}</p>
                </div>
              )}
              {report.learning_analysis && (
                <div className="bg-white dark:bg-gray-900 border border-blue-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={16} className="text-blue-400" />
                    <h3 className="text-slate-900 dark:text-white font-semibold">Learning Analysis</h3>
                  </div>
                  <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">{report.learning_analysis}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* AI Chat Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-50 dark:from-indigo-900/40 to-purple-50 dark:to-purple-900/40 border-b border-slate-200 dark:border-gray-800 px-6 py-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Bot size={18} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-slate-900 dark:text-white font-semibold">Chat with AI about your day</h2>
              <p className="text-slate-500 text-xs">Ask questions or get personalized advice</p>
            </div>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-5 space-y-4 scroll-smooth">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Bot size={32} className="text-slate-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-slate-400 dark:text-gray-600 text-sm">Start a conversation about your day</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {[
                      'How productive was I today?',
                      'What should I focus on tomorrow?',
                      'Give me a summary of my habits',
                    ].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => setInputText(suggestion)}
                        className="text-xs bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <ChatBubble
                key={i}
                message={msg.content}
                isUser={msg.role === 'user'}
                timestamp={msg.timestamp}
              />
            ))}
            {chatLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="border-t border-slate-200 dark:border-gray-800 p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1 bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 focus-within:border-indigo-500 transition-colors">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your day, habits, productivity..."
                  className="w-full bg-transparent text-slate-900 dark:text-white text-sm resize-none focus:outline-none placeholder-slate-400 dark:placeholder-gray-600 min-h-[20px] max-h-24"
                  rows={1}
                  style={{ height: 'auto' }}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                  }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!inputText.trim() || chatLoading}
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
              >
                <Send size={18} />
              </motion.button>
            </div>
            <p className="text-slate-400 dark:text-gray-700 text-xs mt-1.5 ml-1">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </motion.div>
      </div>
    </div>
    </Layout>
  );
}
