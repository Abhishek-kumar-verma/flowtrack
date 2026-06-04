import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api.js'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('flowtrack_token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const { data } = await api.get('/auth/me')
        setUser(data.user || data)
      } catch {
        // api.js interceptor will attempt refresh automatically;
        // if it succeeds the request resolves, if not it redirects to /login.
        // Either way we just clear state here and let redirect happen.
        localStorage.removeItem('flowtrack_token')
        localStorage.removeItem('flowtrack_refresh_token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password })
    localStorage.setItem('flowtrack_token', data.token)
    localStorage.setItem('flowtrack_refresh_token', data.refreshToken)
    setUser(data.user || data)
    toast.success(`Welcome back, ${data.user?.name || username}!`)
    return data
  }, [])

  const register = useCallback(async ({ name, lifeGoal, dailyPriorities, password }) => {
    const { data } = await api.post('/auth/register', {
      name,
      lifeGoal,
      dailyPriorities,
      password,
    })
    return data
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('flowtrack_refresh_token')
    try {
      await api.post('/auth/logout', { refreshToken })
    } catch {
      // ignore — still clear local state
    }
    localStorage.removeItem('flowtrack_token')
    localStorage.removeItem('flowtrack_refresh_token')
    setUser(null)
    toast.success('Logged out successfully.')
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
