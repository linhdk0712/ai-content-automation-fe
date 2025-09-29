import { yupResolver } from '@hookform/resolvers/yup'
import {
  Box,
  Button,
  Link,
  TextField,
  Typography,
} from '@mui/material'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import * as yup from 'yup'
import { useNotification } from '../../contexts/NotificationContext'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

const schema = yup.object({
  usernameOrEmail: yup.string().required('Username or email is required'),
  password: yup.string().required('Password is required'),
})

type LoginFormData = yup.InferType<typeof schema>

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth()
  const { showError, showSuccess } = useNotification()
  const toast = useToast()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Already authenticated, redirecting to dashboard')
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data: LoginFormData) => {
    // Use promise toast for better UX
    toast.promise(
      login(data.usernameOrEmail, data.password),
      {
        pending: 'Đang đăng nhập...',
        success: 'Đăng nhập thành công! Chào mừng bạn trở lại.',
        error: (error: any) => {
          console.error('Login failed:', error)
          return error?.response?.data?.message || error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.'
        }
      }
    ).then(() => {
      // Navigation will be handled by useEffect when isAuthenticated changes
      console.log('Login successful, navigation will be handled by useEffect')
    }).catch((error) => {
      // Error is already handled by toast.promise
      console.error('Login error handled by toast:', error)
    })
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        p: 2,
      }}
    >
      <Box
        sx={{
          width: '25vw',
          minWidth: 400,
          maxWidth: 600,
          bgcolor: 'white',
          p: 3,
          borderRadius: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Typography 
          variant="h5" 
          align="center"
          sx={{ 
            mb: 3,
            fontWeight: 500,
            color: '#333'
          }}
        >
          Đăng nhập
        </Typography>
        
        <Box 
          component="form" 
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            fullWidth
            label="Tên đăng nhập hoặc Email"
            variant="outlined"
            size="medium"
            autoFocus
            error={!!errors.usernameOrEmail}
            helperText={errors.usernameOrEmail?.message}
            {...register('usernameOrEmail')}
          />
          
          <TextField
            fullWidth
            label="Mật khẩu"
            type="password"
            variant="outlined"
            size="medium"
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting}
            sx={{ 
              py: 1,
              mt: 1,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
          
          <Box textAlign="center" sx={{ mt: 1 }}>
            <Link 
              component={RouterLink} 
              to="/register" 
              variant="body2"
              sx={{ 
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Chưa có tài khoản? Đăng ký
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Login