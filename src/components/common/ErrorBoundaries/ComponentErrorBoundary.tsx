import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Typography, Button, Chip } from '@mui/material'
import { Warning, Refresh } from '@mui/icons-material'

interface Props {
  children: ReactNode
  componentName?: string
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  minimal?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Specialized error boundary for individual components
 * Provides minimal UI disruption when components fail
 */
export class ComponentErrorBoundary extends Component<Props, State> {
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

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ComponentErrorBoundary (${this.props.componentName || 'Unknown'}) caught error:`, error)
    this.props.onError?.(error, errorInfo)
  }

  private readonly handleRetry = () => {
    this.setState({
      hasError: false,
      error: null
    })
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Minimal error display
      if (this.props.minimal) {
        return (
          <Chip
            icon={<Warning />}
            label={`${this.props.componentName || 'Component'} error`}
            color="error"
            variant="outlined"
            size="small"
            clickable
            onClick={this.handleRetry}
            sx={{ cursor: 'pointer' }}
          />
        )
      }

      // Standard error display
      return (
        <Box sx={{ 
          p: 2,
          border: '1px dashed',
          borderColor: 'error.main',
          borderRadius: 1,
          backgroundColor: 'error.light',
          color: 'error.contrastText',
          textAlign: 'center'
        }}>
          <Warning sx={{ mb: 1, fontSize: '1.2rem' }} />
          <Typography variant="body2" gutterBottom>
            {this.props.componentName || 'Component'} failed to load
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Refresh />}
            onClick={this.handleRetry}
            sx={{ 
              mt: 1,
              color: 'error.contrastText',
              borderColor: 'error.contrastText',
              '&:hover': {
                borderColor: 'error.contrastText',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Retry
          </Button>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ComponentErrorBoundary