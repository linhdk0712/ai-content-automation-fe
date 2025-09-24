import { yupResolver } from '@hookform/resolvers/yup'
import {
  Box,
  Button,
  Container,
  Divider,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import React from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import * as yup from 'yup'
import { useNotification } from '../../contexts/NotificationContext'
import { useAuth } from '../../hooks/useAuth'
import { LoginRequest } from '../../types/auth'

const schema = yup.object({
  usernameOrEmail: yup.string().required('Username or email is required'),
  password: yup.string().required('Password is required'),
})

const Login: React.FC = () => {
  const { login } = useAuth()
  const { showError, showSuccess } = useNotification()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data: LoginRequest) => {
    try {
      await login(data.usernameOrEmail, data.password)
      showSuccess('Login successful!')
      navigate('/dashboard')
    } catch (error: any) {
      showError(error.response?.data?.message || 'Login failed')
    }
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Sign In
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="usernameOrEmail"
              label="Username or Email"
              autoComplete="username"
              autoFocus
              error={!!errors.usernameOrEmail}
              helperText={errors.usernameOrEmail?.message}
              {...register('usernameOrEmail')}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register('password')}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2">
                Don't have an account? Sign Up
              </Link>
            </Box>
            
            <Divider sx={{ my: 2 }}>OR</Divider>
            
            <Button
              fullWidth
              variant="outlined"
              sx={{ mb: 1 }}
              onClick={() => {/* TODO: Implement Google OAuth */}}
            >
              Continue with Google
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {/* TODO: Implement Facebook OAuth */}}
            >
              Continue with Facebook
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Login