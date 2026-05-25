import axios from 'axios'

const api = axios.create({
  // Uses VITE_API_BASE_URL env var in production, falls back to '/api' in dev
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor – attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('flowtrack_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor – handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('flowtrack_token')
      // Avoid redirect loops on login/register pages
      const { pathname } = window.location
      if (pathname !== '/login' && pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
