import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { authService, RegisterRequest, UserProfile } from '../services/auth.service';

export interface User extends UserProfile {}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🔧 AuthProvider: Initializing...');
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log('🔧 AuthProvider: useEffect triggered, checking auth status...');
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      console.log('Checking auth status...')
      
      const isAuth = authService.isAuthenticated()
      console.log('Auth service says authenticated:', isAuth)
      
      if (isAuth) {
        console.log('Getting current user...')
        const userProfile = await authService.getCurrentUser();
        console.log('User profile received:', userProfile)
        setUser(userProfile);
        setIsAuthenticated(true);
      } else {
        console.log('Not authenticated, clearing state')
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      authService.clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      console.log('Starting login process...')
      const response = await authService.login(usernameOrEmail, password);
      console.log('Login response:', response)
      
      const userData = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        profilePictureUrl: response.user.profilePictureUrl,
        emailVerified: response.user.emailVerified,
        isActive: true,
        roles: [],
      } as User;
      
      console.log('Setting user data:', userData)
      setUser(userData);
      setIsAuthenticated(true);
      console.log('Login completed successfully')
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      await authService.register(data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userProfile = await authService.getCurrentUser();
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const googleLoginUrl = authService.getGoogleLoginUrl();
      window.location.href = googleLoginUrl;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Google login failed');
    }
  };

  const loginWithFacebook = async () => {
    try {
      const facebookLoginUrl = authService.getFacebookLoginUrl();
      window.location.href = facebookLoginUrl;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Facebook login failed');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    refreshUser,
    loginWithGoogle,
    loginWithFacebook,
  };

  console.log('🔧 AuthProvider: Providing context value:', { 
    hasUser: !!user, 
    isLoading, 
    isAuthenticated 
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};