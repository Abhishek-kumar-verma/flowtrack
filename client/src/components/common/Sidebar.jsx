import React, { useState, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  LayoutDashboard,
  CheckSquare,
  Dumbbell,
  BookOpen,
  BarChart2,
  Sparkles,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User,
  Flame,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../hooks/useTheme.js'

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',   end: true },
  { to: '/tasks',      icon: CheckSquare,     label: 'Tasks' },
  { to: '/gym',        icon: Dumbbell,        label: 'Gym' },
  { to: '/learning',   icon: BookOpen,        label: 'Learning' },
  { to: '/habits',     icon: Flame,           label: 'Habits' },
  { to: '/analytics',  icon: BarChart2,       label: 'Analytics' },
  { to: '/ai-summary', icon: Sparkles,        label: 'AI Summary' },
  { to: '/settings',   icon: Settings,        label: 'Settings' },
]

// ─── NavItem ────────────────────────────────────────────────────────────────
// Defined at module level (stable type) + memoized → never unmounts/remounts
const NavItem = React.memo(function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `nav-item group relative ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="active-pill"
              className="absolute inset-0 bg-primary-600/20 border border-primary-500/30 rounded-xl"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <item.icon
            className={`w-5 h-5 flex-shrink-0 relative z-10 transition-colors ${
              isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
            }`}
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className={`relative z-10 whitespace-nowrap overflow-hidden text-sm font-medium ${
                  isActive ? 'text-primary-300' : ''
                }`}
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Tooltip when collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-white dark:bg-dark-700 border border-slate-200 dark:border-dark-500 rounded-lg text-slate-900 dark:text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-card">
              {item.label}
            </div>
          )}
        </>
      )}
    </NavLink>
  )
})

// ─── SidebarContent ──────────────────────────────────────────────────────────
// BUG FIX: was previously defined INSIDE Sidebar() — creating a new component
// type on every render, which caused React to unmount+remount the entire tree
// and replay all Framer Motion animations (the "loading" flicker you saw).
//
// Now at module level → same type every render → no unmount, no flicker.
function SidebarContent({ collapsed, isMobile, setCollapsed, setMobileOpen, user, onLogout }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className={`flex flex-col h-full ${isMobile ? 'w-full' : ''}`}>

      {/* ── Logo ── */}
      <div className={`flex items-center px-3 py-5 ${collapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-primary flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-xl font-bold gradient-text whitespace-nowrap"
              >
                FlowTrack
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {!isMobile && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-700/60 transition-all flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}

        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-700/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Section label ── */}
      <AnimatePresence>
        {(!collapsed || isMobile) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2"
          >
            Navigation
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Nav items ── */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.to}
            item={item}
            collapsed={collapsed && !isMobile}
          />
        ))}
      </nav>

      {/* ── Divider ── */}
      <div className="mx-3 border-t border-slate-200 dark:border-dark-600/50 my-3" />

      {/* ── User profile + Theme toggle + Logout ── */}
      <div className="px-2 pb-4 space-y-1">
        <div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-700/50 transition-all cursor-default ${
            collapsed && !isMobile ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-slate-900 dark:text-white text-sm font-semibold truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-slate-500 text-xs truncate">
                  @{user?.username || 'unknown'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`nav-item nav-item-inactive w-full group ${
            collapsed && !isMobile ? 'justify-center' : ''
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-5 h-5 flex-shrink-0 text-slate-500 group-hover:text-amber-400 transition-colors" />
          ) : (
            <Moon className="w-5 h-5 flex-shrink-0 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          )}
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={onLogout}
          className={`nav-item nav-item-inactive w-full hover:text-rose-400 hover:bg-rose-500/10 group ${
            collapsed && !isMobile ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-slate-500 group-hover:text-rose-400 transition-colors" />
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
// Wrapped in React.memo — only re-renders when mobileOpen/setMobileOpen change
export default React.memo(function Sidebar({ mobileOpen, setMobileOpen }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // useCallback keeps handleLogout reference stable across renders
  const handleLogout = useCallback(() => {
    logout()
    navigate('/login')
  }, [logout, navigate])

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 70 : 256 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-screen bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border-r border-slate-200 dark:border-dark-600/50 sticky top-0 flex-shrink-0 overflow-hidden"
      >
        <SidebarContent
          collapsed={collapsed}
          isMobile={false}
          setCollapsed={setCollapsed}
          setMobileOpen={setMobileOpen}
          user={user}
          onLogout={handleLogout}
        />
      </motion.aside>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-dark-800 border-r border-slate-200 dark:border-dark-600/50 z-50 lg:hidden flex flex-col"
            >
              <SidebarContent
                collapsed={false}
                isMobile
                setCollapsed={setCollapsed}
                setMobileOpen={setMobileOpen}
                user={user}
                onLogout={handleLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
})

// ─── MobileMenuButton ────────────────────────────────────────────────────────
export const MobileMenuButton = React.memo(function MobileMenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-700/60 transition-all"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
})
