export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  PREMIUM_USER = 'PREMIUM_USER',
  ENTERPRISE_USER = 'ENTERPRISE_USER'
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName?: string;
  name?: string; // Full name for display
  profilePictureUrl?: string;
  avatar?: string; // Avatar URL alias
  phoneNumber?: string;
  timezone?: string;
  language?: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  roles?: UserRole[];
  oauthProvider?: string;
  createdAt?: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  timezone?: string;
  language?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  refreshUser: () => Promise<void>;

}