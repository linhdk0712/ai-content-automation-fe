import React from 'react'
import {
  Box,
  Skeleton,
  CircularProgress,
  LinearProgress,
  Typography,
  Card,
  CardContent,
  Grid,
  Fade,
  Grow,
  useTheme,
  keyframes
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Animated loading components
const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
`

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`

const AnimatedSkeleton = styled(Skeleton)(({ theme }) => ({
  animation: `${shimmer} 1.2s ease-in-out infinite`,
  background: `linear-gradient(
    90deg,
    ${theme.palette.grey[300]} 25%,
    ${theme.palette.grey[200]} 37%,
    ${theme.palette.grey[300]} 63%
  )`,
  backgroundSize: '400% 100%'
}))

const PulsingBox = styled(Box)({
  animation: `${pulse} 1.5s ease-in-out infinite`
})

// Loading spinner with custom styling
interface LoadingSpinnerProps {
  size?: number
  message?: string
  variant?: 'circular' | 'linear'
  color?: 'primary' | 'secondary' | 'inherit'
  fullScreen?: boolean
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  message,
  variant = 'circular',
  color = 'primary',
  fullScreen = false
}) => {
  const theme = useTheme()

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3
      }}
    >
      {variant === 'circular' ? (
        <CircularProgress size={size} color={color} />
      ) : (
        <Box sx={{ width: '100%', maxWidth: 300 }}>
          <LinearProgress color={color} />
        </Box>
      )}
      
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          {message}
        </Typography>
      )}
    </Box>
  )

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(2px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Card elevation={3}>
          <CardContent>
            {content}
          </CardContent>
        </Card>
      </Box>
    )
  }

  return content
}

// Skeleton loading for content lists
interface ContentListSkeletonProps {
  items?: number
  showAvatar?: boolean
  showActions?: boolean
}

export const ContentListSkeleton: React.FC<ContentListSkeletonProps> = ({
  items = 5,
  showAvatar = true,
  showActions = true
}) => {
  return (
    <Box>
      {Array.from({ length: items }).map((_, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              {showAvatar && (
                <AnimatedSkeleton variant="circular" width={40} height={40} />
              )}
              
              <Box sx={{ flex: 1 }}>
                <AnimatedSkeleton variant="text" width="60%" height={24} />
                <AnimatedSkeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
                <AnimatedSkeleton variant="text" width="80%" height={20} />
                
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <AnimatedSkeleton variant="rectangular" width={60} height={20} />
                  <AnimatedSkeleton variant="rectangular" width={80} height={20} />
                </Box>
              </Box>
              
              {showActions && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <AnimatedSkeleton variant="circular" width={32} height={32} />
                  <AnimatedSkeleton variant="circular" width={32} height={32} />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}

// Skeleton for dashboard cards
interface DashboardSkeletonProps {
  cards?: number
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({
  cards = 4
}) => {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: cards }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AnimatedSkeleton variant="circular" width={24} height={24} />
                <AnimatedSkeleton variant="text" width={100} height={20} sx={{ ml: 1 }} />
              </Box>
              <AnimatedSkeleton variant="text" width="40%" height={32} />
              <AnimatedSkeleton variant="text" width="60%" height={16} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

// Form skeleton
interface FormSkeletonProps {
  fields?: number
  showSubmit?: boolean
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  fields = 4,
  showSubmit = true
}) => {
  return (
    <Box sx={{ maxWidth: 600 }}>
      {Array.from({ length: fields }).map((_, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          <AnimatedSkeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
          <AnimatedSkeleton variant="rectangular" width="100%" height={56} />
        </Box>
      ))}
      
      {showSubmit && (
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <AnimatedSkeleton variant="rectangular" width={120} height={36} />
          <AnimatedSkeleton variant="rectangular" width={80} height={36} />
        </Box>
      )}
    </Box>
  )
}

// Table skeleton
interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <Box>
      {/* Table header */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, p: 2, borderBottom: 1, borderColor: 'divider' }}>
        {Array.from({ length: columns }).map((_, index) => (
          <AnimatedSkeleton key={index} variant="text" width={120} height={20} />
        ))}
      </Box>
      
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: 'flex', gap: 2, p: 2, borderBottom: 1, borderColor: 'divider' }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <AnimatedSkeleton key={colIndex} variant="text" width={120} height={20} />
          ))}
        </Box>
      ))}
    </Box>
  )
}

// Progressive loading component
interface ProgressiveLoadingProps {
  children: React.ReactNode
  isLoading: boolean
  skeleton?: React.ReactNode
  delay?: number
  fadeIn?: boolean
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  children,
  isLoading,
  skeleton,
  delay = 0,
  fadeIn = true
}) => {
  const [showContent, setShowContent] = React.useState(!isLoading)
  const [showSkeleton, setShowSkeleton] = React.useState(isLoading)

  React.useEffect(() => {
    if (isLoading) {
      setShowContent(false)
      const timer = setTimeout(() => {
        setShowSkeleton(true)
      }, delay)
      return () => clearTimeout(timer)
    } else {
      setShowSkeleton(false)
      setShowContent(true)
    }
  }, [isLoading, delay])

  if (showSkeleton) {
    return skeleton ? <>{skeleton}</> : <LoadingSpinner />
  }

  if (fadeIn) {
    return (
      <Fade in={showContent} timeout={300}>
        <div>{children}</div>
      </Fade>
    )
  }

  return showContent ? <>{children}</> : null
}

// Lazy loading wrapper with intersection observer
interface LazyLoadProps {
  children: React.ReactNode
  placeholder?: React.ReactNode
  rootMargin?: string
  threshold?: number
  onLoad?: () => void
}

export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  placeholder,
  rootMargin = '50px',
  threshold = 0.1,
  onLoad
}) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoaded) {
          setIsVisible(true)
          setIsLoaded(true)
          onLoad?.()
          observer.disconnect()
        }
      },
      { rootMargin, threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [rootMargin, threshold, isLoaded, onLoad])

  return (
    <div ref={ref}>
      {isVisible ? (
        <Grow in={isVisible} timeout={300}>
          <div>{children}</div>
        </Grow>
      ) : (
        placeholder || <AnimatedSkeleton variant="rectangular" width="100%" height={200} />
      )}
    </div>
  )
}

// Loading button component
interface LoadingButtonProps {
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
  variant?: 'text' | 'outlined' | 'contained'
  color?: 'primary' | 'secondary' | 'inherit'
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  children,
  onClick,
  disabled,
  ...buttonProps
}) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <button
        {...buttonProps}
        disabled={disabled || loading}
        onClick={onClick}
        style={{
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {children}
      </button>
      
      {loading && (
        <CircularProgress
          size={24}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-12px',
            marginLeft: '-12px'
          }}
        />
      )}
    </Box>
  )
}

export default LoadingSpinner