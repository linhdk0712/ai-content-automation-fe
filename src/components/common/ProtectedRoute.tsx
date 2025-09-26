import React, { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: string[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  console.log('ProtectedRoute check:', { 
    isAuthenticated, 
    isLoading, 
    hasUser: !!user,
    location: location.pathname 
  })

  if (isLoading) {
    console.log('ProtectedRoute: Still loading...')
    return <LoadingSpinner message="Authenticating..." />
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login')
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  console.log('ProtectedRoute: Authenticated, rendering children')

  // Check role-based access if required roles are specified
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.some(role => 
      user.roles?.includes(role as any)
    )
    
    if (!hasRequiredRole) {
      console.log('ProtectedRoute: Missing required role, redirecting to dashboard')
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute