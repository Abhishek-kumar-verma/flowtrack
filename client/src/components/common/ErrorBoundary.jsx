import { Component } from 'react'

/**
 * ErrorBoundary – catches render-time errors in child component trees and
 * shows a fallback UI instead of crashing the entire app.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <Analytics />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary fallback={<p>Custom error message</p>}>
 *     <AISummary />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h3 className="text-slate-900 dark:text-white font-semibold mb-1">Something went wrong</h3>
          <p className="text-slate-500 text-sm mb-4">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
