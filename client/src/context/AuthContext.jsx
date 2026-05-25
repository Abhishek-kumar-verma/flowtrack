import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api.js'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check token on mount and fetch current user
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
        localStorage.removeItem('flowtrack_token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (username) => {
    const { data } = await api.post('/auth/login', { username })
    const token = data.token
    localStorage.setItem('flowtrack_token', token)
    setUser(data.user || data)
    toast.success(`Welcome back, ${data.user?.name || username}!`)
    return data
  }, [])

  const register = useCallback(async ({ name, lifeGoal, dailyPriorities }) => {
    const { data } = await api.post('/auth/register', {
      name,
      lifeGoal,
      dailyPriorities,
    })
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('flowtrack_token')
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
