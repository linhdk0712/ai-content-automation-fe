import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Avatar,
  IconButton,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Edit,
  PhotoCamera,
  Save,
  Cancel,
  Verified,
  Warning,
  Google,
  Facebook
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';

const profileSchema = yup.object({
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
  timezone: yup
    .string()
    .max(50, 'Timezone must not exceed 50 characters'),
  language: yup
    .string()
    .max(10, 'Language code must not exceed 10 characters'),
});

type ProfileFormData = yup.InferType<typeof profileSchema>;

const UserProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
      timezone: user?.timezone || '',
      language: user?.language || 'vi',
    }
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      
      await authService.updateProfile({
        firstName: data.firstName || '',
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        timezone: data.timezone,
        language: data.language
      });
      await refreshUser();
      
      setSuccess('Cập nhật thông tin thành công!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
      timezone: user?.timezone || '',
      language: user?.language || 'vi',
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 5MB');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Upload avatar (implement this endpoint)
      // await authService.uploadAvatar(formData);
      // await refreshUser();
      
      setSuccess('Cập nhật ảnh đại diện thành công!');
      setAvatarDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      setError(null);
      await authService.resendVerification(user?.email || '');
      setSuccess('Email xác thực đã được gửi lại!');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    }
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative', mr: 3 }}>
            <Avatar
              src={user.profilePictureUrl}
              sx={{ width: 80, height: 80 }}
            >
              {user.firstName?.charAt(0)?.toUpperCase()}
            </Avatar>
            <IconButton
              sx={{
                position: 'absolute',
                bottom: -5,
                right: -5,
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                width: 32,
                height: 32,
              }}
              onClick={() => setAvatarDialogOpen(true)}
            >
              <PhotoCamera fontSize="small" />
            </IconButton>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              @{user.username}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={user.emailVerified ? <Verified /> : <Warning />}
                label={user.emailVerified ? 'Email đã xác thực' : 'Email chưa xác thực'}
                color={user.emailVerified ? 'success' : 'warning'}
                size="small"
              />
              {user.oauthProvider && (
                <Chip
                  icon={user.oauthProvider === 'google' ? <Google /> : <Facebook />}
                  label={`Liên kết ${user.oauthProvider}`}
                  color="info"
                  size="small"
                />
              )}
            </Box>
          </Box>
          
          <Button
            variant={isEditing ? "outlined" : "contained"}
            startIcon={isEditing ? <Cancel /> : <Edit />}
            onClick={isEditing ? handleCancel : () => setIsEditing(true)}
          >
            {isEditing ? 'Hủy' : 'Chỉnh sửa'}
          </Button>
        </Box>

        {!user.emailVerified && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={resendVerificationEmail}>
                Gửi lại
              </Button>
            }
          >
            Email của bạn chưa được xác thực. Vui lòng kiểm tra hộp thư để xác thực tài khoản.
          </Alert>
        )}

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

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('firstName')}
                fullWidth
                label="Tên *"
                variant="outlined"
                disabled={!isEditing}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('lastName')}
                fullWidth
                label="Họ"
                variant="outlined"
                disabled={!isEditing}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                value={user.email}
                disabled
                helperText="Email không thể thay đổi"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={user.username}
                disabled
                helperText="Username không thể thay đổi"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                {...register('phoneNumber')}
                fullWidth
                label="Số điện thoại"
                variant="outlined"
                disabled={!isEditing}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                {...register('timezone')}
                fullWidth
                label="Múi giờ"
                variant="outlined"
                disabled={!isEditing}
                error={!!errors.timezone}
                helperText={errors.timezone?.message}
                placeholder="Asia/Ho_Chi_Minh"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                {...register('language')}
                fullWidth
                label="Ngôn ngữ"
                variant="outlined"
                disabled={!isEditing}
                error={!!errors.language}
                helperText={errors.language?.message}
                select
                SelectProps={{
                  native: true,
                }}
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </TextField>
            </Grid>
          </Grid>

          {isEditing && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={isSubmitting || isLoading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={isSubmitting || isLoading}
              >
                {(isSubmitting || isLoading) ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </Box>
          )}
        </form>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Thông tin tài khoản
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Ngày tạo tài khoản
              </Typography>
              <Typography variant="body1">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Lần đăng nhập cuối
              </Typography>
              <Typography variant="body1">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN') : 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Avatar Upload Dialog */}
      <Dialog open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)}>
        <DialogTitle>Cập nhật ảnh đại diện</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Chọn ảnh mới cho tài khoản của bạn. Kích thước tối đa: 5MB
          </Typography>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="avatar-upload"
            type="file"
            onChange={handleAvatarUpload}
          />
          <label htmlFor="avatar-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<PhotoCamera />}
              fullWidth
            >
              Chọn ảnh
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialogOpen(false)}>
            Hủy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile;