import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor – attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('flowtrack_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Token refresh state
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

// Response interceptor – auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Skip refresh on auth pages or if already retried
    const { pathname } = window.location
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      pathname === '/login' ||
      pathname === '/register'
    ) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = localStorage.getItem('flowtrack_refresh_token')

    if (!refreshToken) {
      isRefreshing = false
      localStorage.removeItem('flowtrack_token')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        { refreshToken }
      )

      const { token: newToken, refreshToken: newRefreshToken } = data

      localStorage.setItem('flowtrack_token', newToken)
      localStorage.setItem('flowtrack_refresh_token', newRefreshToken)

      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      originalRequest.headers.Authorization = `Bearer ${newToken}`

      processQueue(null, newToken)
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      localStorage.removeItem('flowtrack_token')
      localStorage.removeItem('flowtrack_refresh_token')
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
