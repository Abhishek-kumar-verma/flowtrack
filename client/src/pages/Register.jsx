import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  User,
  Target,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'

const TOTAL_STEPS = 4

const stepVariants = {
  enter: (dir) => ({
    opacity: 0,
    x: dir > 0 ? 60 : -60,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
  exit: (dir) => ({
    opacity: 0,
    x: dir > 0 ? -60 : 60,
    transition: { duration: 0.25, ease: 'easeIn' },
  }),
}

function ProgressBar({ step }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <React.Fragment key={i}>
          <motion.div
            className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
              i < step
                ? 'bg-gradient-to-r from-primary-500 to-accent-500'
                : i === step - 1
                ? 'bg-primary-500/60'
                : 'bg-dark-600'
            }`}
            initial={false}
            animate={{ opacity: i < step ? 1 : 0.5 }}
          />
        </React.Fragment>
      ))}
    </div>
  )
}

export default function Register() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [name, setName] = useState('')
  const [lifeGoal, setLifeGoal] = useState('')
  const [priorities, setPriorities] = useState([''])
  const [newPriority, setNewPriority] = useState('')
  const [generatedUsername, setGeneratedUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const goNext = () => {
    setDirection(1)
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  const goBack = () => {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 1))
  }

  const addPriority = () => {
    const trimmed = newPriority.trim()
    if (!trimmed) return
    if (priorities.filter(Boolean).length >= 5) {
      toast.error('Maximum 5 priorities allowed.')
      return
    }
    setPriorities((prev) => [...prev.filter(Boolean), trimmed])
    setNewPriority('')
  }

  const removePriority = (idx) => {
    setPriorities((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addPriority()
    }
  }

  const handleRegister = async () => {
    setIsLoading(true)
    try {
      const data = await register({
        name: name.trim(),
        lifeGoal: lifeGoal.trim(),
        dailyPriorities: priorities.filter(Boolean),
      })
      setGeneratedUsername(data.username || data.user?.username || 'check your profile')
      goNext()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const copyUsername = () => {
    navigator.clipboard.writeText(generatedUsername).then(() => {
      setCopied(true)
      toast.success('Username copied!')
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const isStep1Valid = name.trim().length >= 2
  const isStep2Valid = lifeGoal.trim().length >= 10
  const isStep3Valid = priorities.filter(Boolean).length >= 1

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-600/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '3s' }} />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg glass-card p-8 sm:p-10 relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold gradient-text">FlowTrack</span>
        </div>

        <ProgressBar step={step} />

        {/* Step content */}
        <div className="overflow-hidden min-h-[280px] relative">
          <AnimatePresence custom={direction} mode="wait">
            {/* Step 1 – Name */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-300 text-xs font-medium">
                    Step 1 of 3
                  </div>
                  <h2 className="text-2xl font-bold text-white">What's your name?</h2>
                  <p className="text-slate-400 text-sm">We'll use this to personalize your experience.</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && isStep1Valid && goNext()}
                      placeholder="Alex Johnson"
                      className="input-field pl-11"
                      autoFocus
                    />
                  </div>
                  {name.trim().length > 0 && name.trim().length < 2 && (
                    <p className="text-rose-400 text-xs">Name must be at least 2 characters.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2 – Life goal */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-accent-500/10 border border-accent-500/20 rounded-full text-accent-300 text-xs font-medium">
                    Step 2 of 3
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    What's your life goal, {name.split(' ')[0]}?
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Be specific – this helps our AI give you better insights.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Life Goal</label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-4 flex items-start pointer-events-none">
                      <Target className="w-4 h-4 text-slate-500" />
                    </div>
                    <textarea
                      value={lifeGoal}
                      onChange={(e) => setLifeGoal(e.target.value)}
                      placeholder="e.g. Build a successful SaaS product, become financially independent, and stay healthy while inspiring others."
                      rows={4}
                      className="input-field pl-11 resize-none"
                      autoFocus
                    />
                  </div>
                  <p className="text-slate-600 text-xs text-right">{lifeGoal.trim().length} / min 10 chars</p>
                </div>
              </motion.div>
            )}

            {/* Step 3 – Daily priorities */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-300 text-xs font-medium">
                    Step 3 of 3
                  </div>
                  <h2 className="text-2xl font-bold text-white">Daily priorities</h2>
                  <p className="text-slate-400 text-sm">
                    What areas matter most to you every day? (Add up to 5)
                  </p>
                </div>

                {/* Priority list */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {priorities.filter(Boolean).map((p, idx) => (
                      <motion.div
                        key={p + idx}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 p-3 bg-dark-700/60 border border-dark-500/50 rounded-xl"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
                        <span className="text-white text-sm flex-1">{p}</span>
                        <button
                          onClick={() => removePriority(idx)}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {priorities.filter(Boolean).length < 5 && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g. Deep work, Exercise, Reading…"
                        className="input-field flex-1"
                        autoFocus={priorities.filter(Boolean).length === 0}
                      />
                      <button
                        onClick={addPriority}
                        disabled={!newPriority.trim()}
                        className="w-11 h-11 flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  )}
                  <p className="text-slate-600 text-xs">
                    {priorities.filter(Boolean).length}/5 priorities added
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 4 – Success */}
            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-primary"
                >
                  <Sparkles className="w-9 h-9 text-white" />
                </motion.div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">You're all set, {name.split(' ')[0]}!</h2>
                  <p className="text-slate-400 text-sm">
                    Your account has been created. Here's your unique username:
                  </p>
                </div>

                <div className="p-4 bg-dark-800/80 border border-primary-500/30 rounded-xl flex items-center justify-between gap-3">
                  <span className="text-primary-300 font-mono font-semibold text-lg flex-1 text-left">
                    {generatedUsername}
                  </span>
                  <button
                    onClick={copyUsername}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600/20 hover:bg-primary-600/30 border border-primary-500/30 rounded-lg text-primary-300 text-xs font-medium transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <p className="text-slate-500 text-xs">
                  Save this username — you'll need it to log in.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 gap-4">
          {step < 4 ? (
            <>
              <button
                onClick={goBack}
                disabled={step === 1}
                className="btn-ghost flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {step < 3 ? (
                <motion.button
                  onClick={goNext}
                  disabled={
                    (step === 1 && !isStep1Valid) ||
                    (step === 2 && !isStep2Valid)
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleRegister}
                  disabled={!isStep3Valid || isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      Create Account
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              )}
            </>
          ) : (
            <motion.button
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {step < 4 && (
          <p className="text-center text-slate-600 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  )
}
