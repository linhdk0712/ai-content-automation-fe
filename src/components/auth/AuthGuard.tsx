import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requireEmailVerification?: boolean;
  fallbackPath?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRoles = [],
  requireEmailVerification = true,
  fallbackPath = '/login'
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Đang xác thực...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check email verification requirement
  if (requireEmailVerification && !user.emailVerified) {
    return (
      <Navigate 
        to="/verify-email" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => 
      user.roles?.includes(role)
    );

    if (!hasRequiredRole) {
      return (
        <Navigate 
          to="/unauthorized" 
          state={{ from: location.pathname }} 
          replace 
        />
      );
    }
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

export default AuthGuard;