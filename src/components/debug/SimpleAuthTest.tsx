import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const SimpleAuthTest: React.FC = () => {
  console.log('🔧 SimpleAuthTest: Component rendering...');
  
  try {
    const { user, isLoading, isAuthenticated } = useAuth();
    
    return (
      <div style={{ padding: '20px', border: '2px solid green', margin: '10px' }}>
        <h2>Auth Test - SUCCESS</h2>
        <p>User: {user ? JSON.stringify(user, null, 2) : 'null'}</p>
        <p>Loading: {isLoading.toString()}</p>
        <p>Authenticated: {isAuthenticated.toString()}</p>
      </div>
    );
  } catch (error) {
    console.error('🔧 SimpleAuthTest: Error:', error);
    return (
      <div style={{ padding: '20px', border: '2px solid red', margin: '10px' }}>
        <h2>Auth Test - ERROR</h2>
        <p>Error: {(error as Error).message}</p>
      </div>
    );
  }
};

export default SimpleAuthTest;