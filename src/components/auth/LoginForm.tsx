import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Google,
  Facebook
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const loginSchema = yup.object({
  usernameOrEmail: yup
    .string()
    .required('Username or email is required')
    .min(3, 'Must be at least 3 characters'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

interface LoginFormData {
  usernameOrEmail: string;
  password: string;
}

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, redirectTo = '/dashboard' }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: 'onBlur'
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setIsLoading(true);
      
      await login(data.usernameOrEmail, data.password);
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectTo);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      await loginWithGoogle();
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectTo);
      }
    } catch (err: any) {
      setError(err.message || 'Google login failed. Please try again.');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setError(null);
      await loginWithFacebook();
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectTo);
      }
    } catch (err: any) {
      setError(err.message || 'Facebook login failed. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Đăng nhập
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Chào mừng trở lại! Vui lòng đăng nhập vào tài khoản của bạn.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          {...register('usernameOrEmail')}
          fullWidth
          label="Username hoặc Email"
          variant="outlined"
          margin="normal"
          error={!!errors.usernameOrEmail}
          helperText={errors.usernameOrEmail?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email color="action" />
              </InputAdornment>
            ),
          }}
          autoComplete="username"
          autoFocus
        />

        <TextField
          {...register('password')}
          fullWidth
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          variant="outlined"
          margin="normal"
          error={!!errors.password}
          helperText={errors.password?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={togglePasswordVisibility}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          autoComplete="current-password"
        />

        <Box sx={{ textAlign: 'right', mb: 2 }}>
          <Link 
            to="/forgot-password" 
            style={{ 
              textDecoration: 'none', 
              color: '#1976d2',
              fontSize: '0.875rem'
            }}
          >
            Quên mật khẩu?
          </Link>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isSubmitting || isLoading}
          sx={{ mb: 2, py: 1.5 }}
        >
          {(isSubmitting || isLoading) ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Đăng nhập'
          )}
        </Button>
      </form>

      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Hoặc
        </Typography>
      </Divider>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Google />}
          onClick={handleGoogleLogin}
          sx={{ py: 1.5 }}
        >
          Google
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Facebook />}
          onClick={handleFacebookLogin}
          sx={{ py: 1.5 }}
        >
          Facebook
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Chưa có tài khoản?{' '}
          <Link 
            to="/register" 
            style={{ 
              textDecoration: 'none', 
              color: '#1976d2',
              fontWeight: 500
            }}
          >
            Đăng ký ngay
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};

export default LoginForm;