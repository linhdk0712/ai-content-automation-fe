import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  console.log('🔧 useAuth: Called');
  const context = useContext(AuthContext);
  
  console.log('🔧 useAuth: Context received:', !!context);
  
  if (!context) {
    console.error('🔧 useAuth: No context found! AuthProvider may not be wrapping this component.');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  console.log('🔧 useAuth: Returning context');
  return context;
};