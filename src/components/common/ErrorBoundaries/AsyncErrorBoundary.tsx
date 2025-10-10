import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material'
import { Refresh, Warning } from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  retryable?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  isRetrying: boolean
  retryCount: number
}

/**
 * Specialized error boundary for async operations
 * Shows loading states during retry and handles async errors gracefully
 */
export class AsyncErrorBoundary extends Component<Props, State> {
  private readonly maxRetries = 2
  private retryTimeout: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AsyncErrorBoundary caught error:', error)
    this.props.onError?.(error, errorInfo)

    // Auto-retry for network errors
    if (this.isNetworkError(error) && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry()
    }
  }

  override componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }

  private readonly isNetworkError = (error: Error): boolean => {
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('timeout') ||
           error.name === 'NetworkError'
  }

  private readonly scheduleRetry = () => {
    this.setState({ isRetrying: true })
    
    this.retryTimeout = setTimeout(() => {
      this.handleRetry()
    }, 1000 * (this.state.retryCount + 1)) // Exponential backoff
  }

  private readonly handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        isRetrying: false,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  private readonly handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      isRetrying: false,
      retryCount: 0
    })
  }

  override render() {
    if (this.state.isRetrying) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '200px',
          p: 3 
        }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Retrying... ({this.state.retryCount + 1}/{this.maxRetries})
          </Typography>
        </Box>
      )
    }

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Alert 
          severity="error" 
          action={
            this.props.retryable !== false && (
              <Button
                color="inherit"
                size="small"
                startIcon={<Refresh />}
                onClick={this.handleManualRetry}
              >
                Retry
              </Button>
            )
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Warning sx={{ mr: 1 }} />
            <Typography variant="body2">
              {this.isNetworkError(this.state.error!) 
                ? 'Connection error. Please check your internet connection.'
                : 'Something went wrong loading this content.'
              }
            </Typography>
          </Box>
        </Alert>
      )
    }

    return this.props.children
  }
}

export default AsyncErrorBoundary