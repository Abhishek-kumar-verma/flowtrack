import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import LoadingSkeleton from './components/common/LoadingSkeleton.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'

// ── Public pages (small — import eagerly) ─────────────────────────────────
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

// ── Protected pages (lazy loaded — reduces initial JS bundle by ~30-40%) ──
const Dashboard  = lazy(() => import('./pages/Dashboard.jsx'))
const Tasks      = lazy(() => import('./pages/Tasks.jsx'))
const Gym        = lazy(() => import('./pages/Gym.jsx'))
const Learning   = lazy(() => import('./pages/Learning.jsx'))
const Habits     = lazy(() => import('./pages/Habits.jsx'))
const Analytics  = lazy(() => import('./pages/Analytics.jsx'))
const AISummary  = lazy(() => import('./pages/AISummary.jsx'))
const Settings   = lazy(() => import('./pages/Settings.jsx'))

// Placeholder pages (to be implemented)
const Placeholder = lazy(() => import('./pages/Placeholder.jsx'))

// ── Loading fallback ───────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <LoadingSkeleton count={5} />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    // ErrorBoundary at the root catches any uncaught render errors
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Register />} />

        {/* Protected routes — all lazy-loaded inside Suspense */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageSkeleton />}>
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageSkeleton />}>
                <Tasks />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gym"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageSkeleton />}>
                <Gym />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageSkeleton />}>
                <Learning />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/habits"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageSkeleton />}>
                <Habits />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageSkeleton />}>
                <ErrorBoundary>
                  <Analytics />
                </ErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-summary"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageSkeleton />}>
                <ErrorBoundary>
                  <AISummary />
                </ErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageSkeleton />}>
                <Settings />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
