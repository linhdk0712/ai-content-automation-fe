import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';

// Simple test component
const SimpleTest = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Auth Test</h1>
      <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>User: {user ? user.username : 'None'}</p>
    </div>
  );
};

// App content that uses auth
const AppContent = () => {
  return (
    <Routes>
      <Route path="/test" element={<SimpleTest />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/test" />} />
    </Routes>
  );
};

// Main app with AuthProvider
const SimpleApp = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default SimpleApp;