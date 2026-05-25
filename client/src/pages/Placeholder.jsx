import React from 'react'
import { motion } from 'framer-motion'
import {
  CheckSquare,
  Dumbbell,
  BookOpen,
  BarChart2,
  Sparkles,
  Settings,
  Wrench,
} from 'lucide-react'
import Layout from '../components/common/Layout.jsx'

const ICON_MAP = {
  CheckSquare,
  Dumbbell,
  BookOpen,
  BarChart2,
  Sparkles,
  Settings,
}

export default function Placeholder({ title = 'Coming Soon', icon = 'Wrench', description = '' }) {
  const Icon = ICON_MAP[icon] || Wrench

  return (
    <Layout title={title}>
      <div className="min-h-full flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6 max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/20 flex items-center justify-center"
          >
            <Icon className="w-12 h-12 text-primary-400" />
          </motion.div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <p className="text-slate-400 leading-relaxed">
              {description || 'This section is under construction. Check back soon!'}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-800/60 border border-dark-600/50 rounded-full text-slate-400 text-sm">
            <Wrench className="w-4 h-4 text-primary-400 animate-spin" style={{ animationDuration: '3s' }} />
            Coming soon – backend integration pending
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}
