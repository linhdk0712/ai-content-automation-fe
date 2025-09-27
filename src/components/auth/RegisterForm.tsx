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
  CircularProgress,
  LinearProgress,
  Chip,
  Grid
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  Google,
  Facebook,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';

const registerSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
             'Password must contain uppercase, lowercase, number, and special character'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  firstName: yup
    .string()
    .required('First name is required')
    .max(100, 'First name must not exceed 100 characters'),
  lastName: yup
    .string()
    .max(100, 'Last name must not exceed 100 characters'),
  phoneNumber: yup
    .string()
    .matches(/^[+]?[0-9\s\-\(\)]+$/, 'Please enter a valid phone number')
    .max(20, 'Phone number must not exceed 20 characters'),
});

type RegisterFormData = yup.InferType<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithFacebook } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    trigger
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: 'onBlur'
  });

  const watchedUsername = watch('username');
  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  // Check username availability
  React.useEffect(() => {
    const checkUsername = async () => {
      if (watchedUsername && watchedUsername.length >= 3 && !errors.username) {
        setCheckingUsername(true);
        try {
          const response = await authService.checkUsernameAvailability(watchedUsername);
          setUsernameAvailable(response.available);
        } catch (err) {
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      } else {
        setUsernameAvailable(null);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedUsername, errors.username]);

  // Check email availability
  React.useEffect(() => {
    const checkEmail = async () => {
      if (watchedEmail && !errors.email) {
        setCheckingEmail(true);
        try {
          const response = await authService.checkEmailAvailability(watchedEmail);
          setEmailAvailable(response.available);
        } catch (err) {
          setEmailAvailable(null);
        } finally {
          setCheckingEmail(false);
        }
      } else {
        setEmailAvailable(null);
      }
    };

    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedEmail, errors.email]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      
      await authService.register({
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
      });
      
      setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
      
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      } else {
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
        navigate('/dashboard');
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
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Facebook login failed. Please try again.');
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 12.5;
    if (/[@$!%*?&]/.test(password)) strength += 12.5;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 50) return 'error';
    if (strength < 75) return 'warning';
    return 'success';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 50) return 'Yếu';
    if (strength < 75) return 'Trung bình';
    return 'Mạnh';
  };

  const passwordStrength = watchedPassword ? getPasswordStrength(watchedPassword) : 0;

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Đăng ký
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tạo tài khoản mới để bắt đầu sử dụng AI Content Automation
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

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

      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Hoặc đăng ký bằng email
        </Typography>
      </Divider>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              {...register('firstName')}
              fullWidth
              label="Tên *"
              variant="outlined"
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
              autoComplete="given-name"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              {...register('lastName')}
              fullWidth
              label="Họ"
              variant="outlined"
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
              autoComplete="family-name"
            />
          </Grid>
        </Grid>

        <TextField
          {...register('username')}
          fullWidth
          label="Username *"
          variant="outlined"
          margin="normal"
          error={!!errors.username || usernameAvailable === false}
          helperText={
            errors.username?.message || 
            (usernameAvailable === false ? 'Username đã được sử dụng' : '')
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {checkingUsername && <CircularProgress size={20} />}
                {!checkingUsername && usernameAvailable === true && <CheckCircle color="success" />}
                {!checkingUsername && usernameAvailable === false && <Cancel color="error" />}
              </InputAdornment>
            ),
          }}
          autoComplete="username"
        />

        <TextField
          {...register('email')}
          fullWidth
          label="Email *"
          variant="outlined"
          margin="normal"
          error={!!errors.email || emailAvailable === false}
          helperText={
            errors.email?.message || 
            (emailAvailable === false ? 'Email đã được sử dụng' : '')
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {checkingEmail && <CircularProgress size={20} />}
                {!checkingEmail && emailAvailable === true && <CheckCircle color="success" />}
                {!checkingEmail && emailAvailable === false && <Cancel color="error" />}
              </InputAdornment>
            ),
          }}
          autoComplete="email"
        />

        <TextField
          {...register('phoneNumber')}
          fullWidth
          label="Số điện thoại"
          variant="outlined"
          margin="normal"
          error={!!errors.phoneNumber}
          helperText={errors.phoneNumber?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Phone color="action" />
              </InputAdornment>
            ),
          }}
          autoComplete="tel"
        />

        <TextField
          {...register('password')}
          fullWidth
          label="Mật khẩu *"
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
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          autoComplete="new-password"
        />

        {watchedPassword && (
          <Box sx={{ mt: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Độ mạnh mật khẩu:
              </Typography>
              <Chip 
                label={getPasswordStrengthText(passwordStrength)}
                color={getPasswordStrengthColor(passwordStrength)}
                size="small"
              />
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={passwordStrength} 
              color={getPasswordStrengthColor(passwordStrength)}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        <TextField
          {...register('confirmPassword')}
          fullWidth
          label="Xác nhận mật khẩu *"
          type={showConfirmPassword ? 'text' : 'password'}
          variant="outlined"
          margin="normal"
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={
            isSubmitting || 
            isLoading || 
            usernameAvailable === false || 
            emailAvailable === false ||
            checkingUsername ||
            checkingEmail
          }
          sx={{ mt: 3, mb: 2, py: 1.5 }}
        >
          {(isSubmitting || isLoading) ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Đăng ký'
          )}
        </Button>
      </form>

      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Đã có tài khoản?{' '}
          <Link 
            to="/login" 
            style={{ 
              textDecoration: 'none', 
              color: '#1976d2',
              fontWeight: 500
            }}
          >
            Đăng nhập ngay
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};

export default RegisterForm;