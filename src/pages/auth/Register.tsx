import { yupResolver } from '@hookform/resolvers/yup'
import {
  Box,
  Button,
  Grid,
  Link,
  TextField,
  Typography,
} from '@mui/material'
import React from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import * as yup from 'yup'
import { useNotification } from '../../contexts/NotificationContext'
import { useAuth } from '../../hooks/useAuth'
import { RegisterRequest } from '../../types/auth'

const schema = yup.object({
  username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string(),
})

type RegisterFormData = yup.InferType<typeof schema>

const Register: React.FC = () => {
  const { register: registerUser } = useAuth()
  const { showError, showSuccess } = useNotification()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data
      await registerUser({
        username: registerData.username || '',
        email: registerData.email || '',
        password: registerData.password || '',
        firstName: registerData.firstName || '',
        lastName: registerData.lastName,
      })
      showSuccess('Registration successful! Please check your email for verification.')
      navigate('/dashboard')
    } catch (error: any) {
      showError(error.response?.data?.message || 'Registration failed')
    }
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
          Đăng ký tài khoản
        </Typography>
        
        <Box 
          component="form" 
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Họ"
                autoFocus
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                {...register('firstName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tên"
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                {...register('lastName')}
              />
            </Grid>
          </Grid>
          
          <TextField
            fullWidth
            label="Tên đăng nhập"
            error={!!errors.username}
            helperText={errors.username?.message}
            {...register('username')}
          />
          
          <TextField
            fullWidth
            label="Email"
            type="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email')}
          />
          
          <TextField
            fullWidth
            label="Mật khẩu"
            type="password"
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
          />
          
          <TextField
            fullWidth
            label="Xác nhận mật khẩu"
            type="password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            {...register('confirmPassword')}
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
            {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </Button>
          
          <Box textAlign="center" sx={{ mt: 1 }}>
            <Link 
              component={RouterLink} 
              to="/login" 
              variant="body2"
              sx={{ 
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Đã có tài khoản? Đăng nhập
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Register