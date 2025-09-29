import React, { useState } from 'react'
import { Box, Button, Grid, Paper, Typography, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { toast } from 'react-toastify'
import { useToast } from '../../hooks/useToast'
import { useCustomToast } from '../../hooks/useCustomToast'
import { migrationHelpers } from '../../utils/notification-migration'

const ToastDemo: React.FC = () => {
  const toast = useToast()
  const customToast = useCustomToast()
  const [message, setMessage] = useState('This is a test notification')
  const [title, setTitle] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info')
  const [loadingToastId, setLoadingToastId] = useState<any>(null)

  const handleBasicToast = () => {
    const options = title ? { title } : undefined
    
    switch (toastType) {
      case 'success':
        toast.success(message, options)
        break
      case 'error':
        toast.error(message, options)
        break
      case 'warning':
        toast.warning(message, options)
        break
      case 'info':
        toast.info(message, options)
        break
    }
  }

  const handleToastWithActions = () => {
    customToast.errorWithRetry(
      'This operation failed',
      () => {
        toast.info('Retrying operation...')
      },
      'Error'
    )
  }

  const handlePersistentToast = () => {
    customToast.persistentWarning(
      'This notification will stay until dismissed',
      'Persistent Notification'
    )
  }

  const handleLoadingToast = () => {
    const id = toast.loading('Processing your request...')
    setLoadingToastId(id)
    
    // Simulate async operation
    setTimeout(() => {
      toast.update(id, 'Operation completed successfully!', 'success')
      setLoadingToastId(null)
    }, 3000)
  }

  const handlePromiseToast = () => {
    const mockPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve('Success!') : reject(new Error('Failed!'))
      }, 2000)
    })

    toast.promise(mockPromise, {
      pending: 'Processing request...',
      success: 'Request completed successfully!',
      error: 'Request failed. Please try again.'
    })
  }

  const handleApiErrorSimulation = () => {
    // Simulate different API errors
    const errors = [
      { status: 401, message: 'Unauthorized access' },
      { status: 403, message: 'Permission denied' },
      { status: 404, message: 'Resource not found' },
      { status: 500, message: 'Internal server error' }
    ]
    
    const randomError = errors[Math.floor(Math.random() * errors.length)]
    toast.response(randomError.status, null, randomError.message)
  }

  const handleMigrationHelpers = () => {
    // Demonstrate migration helpers
    const helpers = [
      () => migrationHelpers.saveSuccess('Document'),
      () => migrationHelpers.deleteSuccess('Item'),
      () => migrationHelpers.networkError(),
      () => migrationHelpers.validationError('Please fill all required fields'),
      () => migrationHelpers.permissionDenied(),
      () => migrationHelpers.sessionExpired()
    ]
    
    const randomHelper = helpers[Math.floor(Math.random() * helpers.length)]
    randomHelper()
  }

  const handleConvenienceToasts = () => {
    const methods = [
      () => toast.saveSuccess('Document'),
      () => toast.deleteError('Failed to delete item'),
      () => toast.networkError(),
      () => toast.validationError('Invalid email format'),
      () => toast.authError(),
      () => toast.permissionError()
    ]
    
    const randomMethod = methods[Math.floor(Math.random() * methods.length)]
    randomMethod()
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        React-Toastify Demo
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        Test các loại thông báo và tính năng của React-Toastify được tích hợp trong ứng dụng.
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Toast Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Basic Toast Configuration
            </Typography>
            
            <TextField
              fullWidth
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Title (Optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Toast Type</InputLabel>
              <Select
                value={toastType}
                onChange={(e) => setToastType(e.target.value as any)}
              >
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="info">Info</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              onClick={handleBasicToast}
              fullWidth
            >
              Show Toast
            </Button>
          </Paper>
        </Grid>

        {/* Advanced Features */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Advanced Features
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleToastWithActions}
              >
                Toast with Actions
              </Button>
              
              <Button
                variant="outlined"
                onClick={handlePersistentToast}
              >
                Persistent Toast
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleLoadingToast}
                disabled={loadingToastId !== null}
              >
                Loading Toast
              </Button>
              
              <Button
                variant="outlined"
                onClick={handlePromiseToast}
              >
                Promise Toast
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* API Integration Examples */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              API Integration Examples
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleApiErrorSimulation}
              >
                Simulate API Error
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => toast.response(200, 'SUCCESS', 'Data saved successfully')}
              >
                Simulate API Success
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => toast.response(422, 'VALIDATION_ERROR', 'Invalid input data')}
              >
                Simulate Validation Error
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Migration & Convenience Methods */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Migration & Convenience Methods
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleMigrationHelpers}
              >
                Random Migration Helper
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleConvenienceToasts}
              >
                Random Convenience Toast
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => toast.dismiss()}
              >
                Dismiss All Toasts
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Common Scenarios */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Common Business Scenarios
            </Typography>
            
            <Grid container spacing={1}>
              <Grid item xs={6} sm={4} md={2}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => toast.saveSuccess('Content')}
                >
                  Save Success
                </Button>
              </Grid>
              
              <Grid item xs={6} sm={4} md={2}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => toast.saveError('Network timeout')}
                >
                  Save Error
                </Button>
              </Grid>
              
              <Grid item xs={6} sm={4} md={2}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => toast.deleteSuccess('Template')}
                >
                  Delete Success
                </Button>
              </Grid>
              
              <Grid item xs={6} sm={4} md={2}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => toast.loadError('Failed to fetch data')}
                >
                  Load Error
                </Button>
              </Grid>
              
              <Grid item xs={6} sm={4} md={2}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => toast.authError()}
                >
                  Auth Error
                </Button>
              </Grid>
              
              <Grid item xs={6} sm={4} md={2}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => toast.networkError()}
                >
                  Network Error
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ToastDemo