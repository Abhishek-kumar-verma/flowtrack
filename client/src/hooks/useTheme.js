import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'flowtrack_theme'

/**
 * Custom hook for dark/light theme toggling.
 * Persists preference to localStorage and syncs the `dark` class
 * on document.documentElement (required by Tailwind's `darkMode: 'class'`).
 */
export function useTheme() {
  const getInitialTheme = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored

    // Fall back to OS preference (respect what the user's system is set to)
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const [theme, setThemeState] = useState(() => {
    try {
      return getInitialTheme()
    } catch {
      return 'dark'
    }
  })

  // Apply class to <html> whenever theme changes
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme)
    }
  }, [])

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setTheme,
  }
}
