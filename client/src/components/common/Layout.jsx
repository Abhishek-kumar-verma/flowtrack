import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Sidebar, { MobileMenuButton } from './Sidebar.jsx'

export default function Layout({ children, title }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-dark-900 overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar – mobile only */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-dark-600/50 flex-shrink-0">
          <MobileMenuButton onClick={() => setMobileOpen(true)} />
          {title && (
            <h1 className="text-slate-900 dark:text-white font-semibold text-base">{title}</h1>
          )}
        </header>

        {/* Scrollable content */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
