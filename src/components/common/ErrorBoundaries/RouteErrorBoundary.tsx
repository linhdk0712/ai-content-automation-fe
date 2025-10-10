import { Refresh } from '@mui/icons-material'
import { Alert, Box, Button, Typography } from '@mui/material'
import { Info } from 'lucide-react'
import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Specialized error boundary for route-level components
 * Provides navigation fallbacks and route-specific error handling
 */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RouteErrorBoundary caught error:', error)
    this.props.onError?.(error, errorInfo)

    // Track route errors for analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'route_error', {
        route: window.location.pathname,
        error_message: error.message
      })
    }
  }

  private readonly handleGoHome = () => {
    window.location.href = '/'
  }

  private readonly handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      this.handleGoHome()
    }
  }

  private readonly handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '60vh',
          p: 4,
          textAlign: 'center'
        }}>
          <Alert severity="error" sx={{ maxWidth: 600, width: '100%', mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Page Error
            </Typography>
            <Typography variant="body2">
              This page encountered an error and couldn't load properly.
              You can try reloading the page or navigate to a different section.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleReload}
            >
              Reload Page
            </Button>
            
            <Button
              variant="outlined"
              onClick={this.handleGoBack}
            >
              Go Back
            </Button>
            
            <Button
              variant="outlined"
              onClick={this.handleGoHome}
            >
              Go Home
            </Button>
          </Box>

          {import.meta.env.DEV && this.state.error && (
            <Alert severity="info" sx={{ mt: 3, maxWidth: 600, width: '100%' }}>
              <Typography variant="body2" sx={{ 
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                fontSize: '0.8rem'
              }}>
                <Info style={{ verticalAlign: 'middle', marginRight: 1 }} />
                Dev Error: {this.state.error.message}
              </Typography>
            </Alert>
          )}
        </Box>
      )
    }

    return this.props.children
  }
}

export default RouteErrorBoundary
