import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ToastContainer } from 'react-toastify'

import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { theme } from './theme'

// Import styles - optimized for SPA
import './styles/improvements.css'
import './styles/layout-fixes.css'
import './styles/auth.css'
import './styles/dashboard.css'
import 'react-toastify/dist/ReactToastify.css'
import './styles/toast.css'

// Create QueryClient optimized for SPA
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) return false
        return failureCount < 3
      },
      // Enable background refetch for SPA
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      // Optimistic updates for better SPA UX
      onError: (error: any) => {
        console.error('Mutation error:', error)
      },
    },
  },
})

// Enhanced error handling for SPA
const handleGlobalError = (error: ErrorEvent) => {
  console.error('Global error:', error)
  // Send to error tracking service in production
}

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error('Unhandled promise rejection:', event.reason)
  // Send to error tracking service in production
}

// Add global error handlers for SPA
window.addEventListener('error', handleGlobalError)
window.addEventListener('unhandledrejection', handleUnhandledRejection)

// Render app with SPA-optimized providers
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <AuthProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="custom-toast"
        progressClassName="custom-toast-progress"
        // SPA-specific toast settings
        limit={5}
      />
    </QueryClientProvider>
  </React.StrictMode>,
)