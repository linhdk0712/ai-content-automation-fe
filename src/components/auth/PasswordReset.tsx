import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  ArrowBack
} from '@mui/icons-material';
import { authService } from '../../services/auth.service';

const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
});

const resetPasswordSchema = yup.object({
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
             'Password must contain uppercase, lowercase, number, and special character'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

type ForgotPasswordData = yup.InferType<typeof forgotPasswordSchema>;
type ResetPasswordData = yup.InferType<typeof resetPasswordSchema>;

const PasswordReset: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [currentStep, setCurrentStep] = useState(token ? 1 : 0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  
  const navigate = useNavigate();

  const forgotPasswordForm = useForm<ForgotPasswordData>({
    resolver: yupResolver(forgotPasswordSchema),
    mode: 'onBlur'
  });

  const resetPasswordForm = useForm<ResetPasswordData>({
    resolver: yupResolver(resetPasswordSchema),
    mode: 'onBlur'
  });

  const watchedNewPassword = resetPasswordForm.watch('newPassword');

  const steps = ['Nhập email', 'Đặt lại mật khẩu', 'Hoàn thành'];

  const onForgotPasswordSubmit = async (data: ForgotPasswordData) => {
    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      
      await authService.forgotPassword(data.email);
      setEmail(data.email);
      setCurrentStep(1);
      setSuccess('Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPasswordSubmit = async (data: ResetPasswordData) => {
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      
      await authService.resetPassword(token, data.newPassword);
      setCurrentStep(2);
      setSuccess('Mật khẩu đã được đặt lại thành công!');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
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

  const passwordStrength = watchedNewPassword ? getPasswordStrength(watchedNewPassword) : 0;

  const renderForgotPasswordStep = () => (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Quên mật khẩu
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Nhập email của bạn để nhận link đặt lại mật khẩu
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

      <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}>
        <TextField
          {...forgotPasswordForm.register('email')}
          fullWidth
          label="Email"
          variant="outlined"
          margin="normal"
          error={!!forgotPasswordForm.formState.errors.email}
          helperText={forgotPasswordForm.formState.errors.email?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email color="action" />
              </InputAdornment>
            ),
          }}
          autoComplete="email"
          autoFocus
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={forgotPasswordForm.formState.isSubmitting || isLoading}
          sx={{ mt: 3, mb: 2, py: 1.5 }}
        >
          {(forgotPasswordForm.formState.isSubmitting || isLoading) ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Gửi link đặt lại'
          )}
        </Button>
      </form>

      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Link 
          to="/login" 
          style={{ 
            textDecoration: 'none', 
            color: '#1976d2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <ArrowBack fontSize="small" />
          Quay lại đăng nhập
        </Link>
      </Box>
    </Paper>
  );

  const renderResetPasswordStep = () => (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Đặt lại mật khẩu
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Nhập mật khẩu mới cho tài khoản của bạn
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)}>
        <TextField
          {...resetPasswordForm.register('newPassword')}
          fullWidth
          label="Mật khẩu mới"
          type={showPassword ? 'text' : 'password'}
          variant="outlined"
          margin="normal"
          error={!!resetPasswordForm.formState.errors.newPassword}
          helperText={resetPasswordForm.formState.errors.newPassword?.message}
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
          autoFocus
        />

        {watchedNewPassword && (
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
          {...resetPasswordForm.register('confirmPassword')}
          fullWidth
          label="Xác nhận mật khẩu mới"
          type={showConfirmPassword ? 'text' : 'password'}
          variant="outlined"
          margin="normal"
          error={!!resetPasswordForm.formState.errors.confirmPassword}
          helperText={resetPasswordForm.formState.errors.confirmPassword?.message}
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
          disabled={resetPasswordForm.formState.isSubmitting || isLoading}
          sx={{ mt: 3, mb: 2, py: 1.5 }}
        >
          {(resetPasswordForm.formState.isSubmitting || isLoading) ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Đặt lại mật khẩu'
          )}
        </Button>
      </form>
    </Paper>
  );

  const renderSuccessStep = () => (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h4" component="h1" gutterBottom color="success.main">
        Thành công!
      </Typography>
      
      <Alert severity="success" sx={{ mb: 3 }}>
        {success}
      </Alert>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Bạn sẽ được chuyển hướng đến trang đăng nhập trong giây lát...
      </Typography>

      <Button
        variant="contained"
        onClick={() => navigate('/login')}
        sx={{ mt: 2 }}
      >
        Đăng nhập ngay
      </Button>
    </Paper>
  );

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {currentStep === 0 && renderForgotPasswordStep()}
      {currentStep === 1 && !token && renderForgotPasswordStep()}
      {currentStep === 1 && token && renderResetPasswordStep()}
      {currentStep === 2 && renderSuccessStep()}
    </Box>
  );
};

export default PasswordReset;