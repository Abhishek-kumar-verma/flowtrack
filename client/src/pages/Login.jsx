import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  Brain,
  BarChart2,
  Target,
  ArrowRight,
  User,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'

const FEATURES = [
  { icon: Target, label: 'Smart Task Management', desc: 'Prioritize what matters most' },
  { icon: Brain, label: 'AI-Powered Insights', desc: 'Daily summaries & recommendations' },
  { icon: BarChart2, label: 'Progress Analytics', desc: 'Visual charts & streak tracking' },
  { icon: Zap, label: 'Habit Streaks', desc: 'Build consistent daily routines' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim()) {
      toast.error('Please enter your username.')
      return
    }
    setIsLoading(true)
    try {
      await login(username.trim())
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed. Check your username.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex overflow-hidden relative">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-accent-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      {/* Left hero section */}
      <motion.div
        variants={slideInLeft}
        initial="hidden"
        animate="visible"
        className="hidden lg:flex flex-1 flex-col justify-between p-12 xl:p-16 relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-primary">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">FlowTrack</span>
        </div>

        {/* Hero content */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Productivity
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight text-white">
              Your AI-powered{' '}
              <span className="gradient-text">productivity</span>{' '}
              companion
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              Track tasks, gym sessions, and learning progress. Get AI-generated insights that help you grow every single day.
            </p>
          </motion.div>

          <motion.div variants={containerVariants} className="grid grid-cols-1 gap-3 max-w-md">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <motion.div
                key={label}
                variants={itemVariants}
                className="flex items-center gap-4 p-4 rounded-xl bg-dark-800/50 border border-dark-600/40 backdrop-blur-sm"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-500/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4.5 h-4.5 text-primary-400 w-5 h-5" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{label}</p>
                  <p className="text-slate-500 text-xs">{desc}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-primary-400 ml-auto flex-shrink-0" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom tagline */}
        <p className="text-slate-600 text-sm">
          Join thousands of high performers tracking their daily growth.
        </p>
      </motion.div>

      {/* Divider */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-dark-600/60 to-transparent" />

      {/* Right form section */}
      <motion.div
        variants={slideInRight}
        initial="hidden"
        animate="visible"
        className="flex-1 lg:max-w-md xl:max-w-lg flex flex-col justify-center px-8 py-12 sm:px-12 relative z-10"
      >
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">FlowTrack</span>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={itemVariants} className="space-y-2">
            <h2 className="text-3xl font-bold text-white">Welcome back</h2>
            <p className="text-slate-400">
              Enter your username to continue your journey.
            </p>
          </motion.div>

          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your.username"
                  className="input-field pl-11"
                  autoFocus
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.form>

          <motion.div variants={itemVariants} className="text-center">
            <p className="text-slate-500 text-sm">
              New to FlowTrack?{' '}
              <Link
                to="/register"
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                Create your account
              </Link>
            </p>
          </motion.div>

          {/* Decorative separator */}
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-600/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-dark-900 text-slate-600 text-xs">
                Secure & private
              </span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center justify-center gap-6 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              End-to-end encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              No ads, ever
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Your data, yours
            </span>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
