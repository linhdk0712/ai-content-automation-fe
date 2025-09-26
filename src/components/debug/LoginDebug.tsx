import React, { useState } from 'react'
import { authService } from '../../services/auth.service'
import { useNotifications } from '../../hooks/useNotifications'

const LoginDebug: React.FC = () => {
  const [credentials, setCredentials] = useState({
    usernameOrEmail: 'test@example.com',
    password: 'password123'
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  
  const { showSuccess, showError } = useNotifications()

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)
      
      console.log('Starting login with:', credentials)
      
      const authResponse = await authService.login(
        credentials.usernameOrEmail, 
        credentials.password
      )
      
      console.log('Login successful:', authResponse)
      setResult(authResponse)
      showSuccess('Login successful!')
      
    } catch (err) {
      console.error('Login failed:', err)
      setError(err)
      showError(`Login failed: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTestApiCall = async () => {
    try {
      setLoading(true)
      
      // Test a simple API call to see ResponseBase format
      const response = await fetch('/api/v1/auth/check-email?email=test@example.com', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      console.log('Test API Response:', data)
      setResult(data)
      
    } catch (err) {
      console.error('Test API failed:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Login Debug Tool</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Username/Email:
          </label>
          <input
            type="text"
            value={credentials.usernameOrEmail}
            onChange={(e) => setCredentials(prev => ({
              ...prev,
              usernameOrEmail: e.target.value
            }))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password:
          </label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials(prev => ({
              ...prev,
              password: e.target.value
            }))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Test Login'}
          </button>
          
          <button
            onClick={handleTestApiCall}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Test API Call
          </button>
        </div>
        
        {result && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-green-600">Success Result:</h3>
            <pre className="mt-2 p-4 bg-green-50 border border-green-200 rounded overflow-x-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        {error && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-red-600">Error:</h3>
            <pre className="mt-2 p-4 bg-red-50 border border-red-200 rounded overflow-x-auto text-sm">
              {JSON.stringify({
                message: error.message,
                code: error.code,
                status: error.status,
                stack: error.stack
              }, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="text-lg font-semibold mb-2">Debug Info:</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Current tokens:</strong> {authService.getAccessToken() ? 'Present' : 'None'}</li>
            <li><strong>Is authenticated:</strong> {authService.isAuthenticated() ? 'Yes' : 'No'}</li>
            <li><strong>API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL || '/api/v1'}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default LoginDebug