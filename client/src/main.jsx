import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          gutter={12}
          containerStyle={{ top: 20, right: 20 }}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#18181f',
              color: '#f1f5f9',
              border: '1px solid #2d2d3f',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#6366f1', secondary: '#18181f' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#18181f' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
