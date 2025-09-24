import React, { Component, ErrorInfo, ReactNode } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Collapse} from '@mui/material'
import {
  ErrorOutline,
  Refresh,
  ExpandMore,
  ExpandLess,
  BugReport
} from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
  retryCount: number
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to monitoring service
    this.logErrorToService(error, errorInfo)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send to error monitoring service (Sentry, LogRocket, etc.)
    if (import.meta.env.PROD) {
      console.error('Error caught by boundary:', error, errorInfo)
      
      // Example: Send to analytics
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: false
        })
      }
    } else {
      console.group('🚨 Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false,
        retryCount: prevState.retryCount + 1
      }))
    } else {
      // Reload the page as last resort
      window.location.reload()
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }))
  }

  private renderErrorDetails = () => {
    const { error, errorInfo } = this.state

    if (!error || !errorInfo) return null

    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" component="pre" sx={{ 
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '0.8rem'
          }}>
            {error.message}
          </Typography>
        </Alert>

        <Alert severity="info">
          <Typography variant="body2" component="pre" sx={{ 
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {error.stack}
          </Typography>
        </Alert>

        {import.meta.env.DEV && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            <Typography variant="body2" component="pre" sx={{ 
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              {errorInfo.componentStack}
            </Typography>
          </Alert>
        )}
      </Box>
    )
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 3,
            textAlign: 'center'
          }}
          role="alert"
          aria-live="assertive"
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ErrorOutline 
                  color="error" 
                  sx={{ fontSize: 40, mr: 2 }}
                  aria-hidden="true"
                />
                <Typography variant="h5" component="h1">
                  Something went wrong
                </Typography>
              </Box>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                We're sorry, but something unexpected happened. 
                {this.state.retryCount < this.maxRetries 
                  ? ' You can try again or reload the page.'
                  : ' Please reload the page to continue.'
                }
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
                {this.state.retryCount < this.maxRetries ? (
                  <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={this.handleRetry}
                    aria-label="Try again"
                  >
                    Try Again ({this.maxRetries - this.state.retryCount} left)
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={this.handleReload}
                    aria-label="Reload page"
                  >
                    Reload Page
                  </Button>
                )}

                <Button
                  variant="outlined"
                  startIcon={this.state.showDetails ? <ExpandLess /> : <ExpandMore />}
                  onClick={this.toggleDetails}
                  aria-label={this.state.showDetails ? 'Hide error details' : 'Show error details'}
                  aria-expanded={this.state.showDetails}
                >
                  {this.state.showDetails ? 'Hide' : 'Show'} Details
                </Button>
              </Box>

              <Collapse in={this.state.showDetails}>
                {this.renderErrorDetails()}
              </Collapse>

              {import.meta.env.DEV && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <BugReport sx={{ verticalAlign: 'middle', mr: 1 }} />
                    This error occurred in development mode. 
                    Check the console for more details.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Hook version for functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}