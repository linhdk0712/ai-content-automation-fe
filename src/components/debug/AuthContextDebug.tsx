import React from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const AuthContextDebug: React.FC = () => {
  const context = React.useContext(AuthContext);
  
  console.log('AuthContext Debug:', {
    contextExists: !!context,
    contextValue: context
  });

  return (
    <div style={{ padding: '20px', border: '1px solid red', margin: '10px' }}>
      <h3>Auth Context Debug</h3>
      <p>Context exists: {context ? 'YES' : 'NO'}</p>
      {context && (
        <div>
          <p>User: {context.user ? JSON.stringify(context.user) : 'null'}</p>
          <p>Is Loading: {context.isLoading ? 'true' : 'false'}</p>
          <p>Is Authenticated: {context.isAuthenticated ? 'true' : 'false'}</p>
        </div>
      )}
    </div>
  );
};

export default AuthContextDebug;