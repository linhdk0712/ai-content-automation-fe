import React from 'react'
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Fade} from '@mui/material'
import {
  Accessibility,
  ZoomIn,
  ZoomOut,
  Contrast,
  TextFields,
  KeyboardArrowUp,
  Visibility,
  VisibilityOff
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'

// Accessibility context
interface AccessibilityContextType {
  fontSize: number
  highContrast: boolean
  reducedMotion: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  increaseFontSize: () => void
  decreaseFontSize: () => void
  toggleHighContrast: () => void
  toggleReducedMotion: () => void
  toggleScreenReader: () => void
  resetSettings: () => void
}

const AccessibilityContext = React.createContext<AccessibilityContextType | undefined>(undefined)

// Accessibility provider
interface AccessibilityProviderProps {
  children: React.ReactNode
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [fontSize, setFontSize] = React.useState(16)
  const [highContrast, setHighContrast] = React.useState(false)
  const [reducedMotion, setReducedMotion] = React.useState(false)
  const [screenReader, setScreenReader] = React.useState(false)
  const [keyboardNavigation, setKeyboardNavigation] = React.useState(false)

  // Load settings from localStorage
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setFontSize(settings.fontSize || 16)
      setHighContrast(settings.highContrast || false)
      setReducedMotion(settings.reducedMotion || false)
      setScreenReader(settings.screenReader || false)
    }

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setReducedMotion(true)
    }

    // Detect keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true)
      }
    }

    const handleMouseDown = () => {
      setKeyboardNavigation(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // Save settings to localStorage
  React.useEffect(() => {
    const settings = {
      fontSize,
      highContrast,
      reducedMotion,
      screenReader
    }
    localStorage.setItem('accessibility-settings', JSON.stringify(settings))
  }, [fontSize, highContrast, reducedMotion, screenReader])

  // Apply settings to document
  React.useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
    
    if (highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }

    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion')
    } else {
      document.documentElement.classList.remove('reduced-motion')
    }

    if (keyboardNavigation) {
      document.documentElement.classList.add('keyboard-navigation')
    } else {
      document.documentElement.classList.remove('keyboard-navigation')
    }
  }, [fontSize, highContrast, reducedMotion, keyboardNavigation])

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24))
  }

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12))
  }

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev)
  }

  const toggleReducedMotion = () => {
    setReducedMotion(prev => !prev)
  }

  const toggleScreenReader = () => {
    setScreenReader(prev => !prev)
  }

  const resetSettings = () => {
    setFontSize(16)
    setHighContrast(false)
    setReducedMotion(false)
    setScreenReader(false)
  }

  const value: AccessibilityContextType = {
    fontSize,
    highContrast,
    reducedMotion,
    screenReader,
    keyboardNavigation,
    increaseFontSize,
    decreaseFontSize,
    toggleHighContrast,
    toggleReducedMotion,
    toggleScreenReader,
    resetSettings
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

// Hook to use accessibility context
export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

// Accessibility toolbar
const AccessibilityToolbar = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: '50%',
  right: 0,
  transform: 'translateY(-50%)',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '8px 0 0 8px',
  padding: theme.spacing(1),
  zIndex: theme.zIndex.fab,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  boxShadow: theme.shadows[4],
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-50%) translateX(-4px)'
  }
}))

interface AccessibilityToolbarComponentProps {
  show?: boolean
}

export const AccessibilityToolbarComponent: React.FC<AccessibilityToolbarComponentProps> = ({
  show = true
}) => {
  const {
    fontSize,
    highContrast,
    reducedMotion,
    screenReader,
    increaseFontSize,
    decreaseFontSize,
    toggleHighContrast,
    toggleReducedMotion,
    toggleScreenReader,
    resetSettings
  } = useAccessibility()

  const [isOpen, setIsOpen] = React.useState(false)

  if (!show) return null

  return (
    <AccessibilityToolbar>
      <Tooltip title="Accessibility Options" placement="left">
        <IconButton
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle accessibility options"
          aria-expanded={isOpen}
          color={isOpen ? 'primary' : 'default'}
        >
          <Accessibility />
        </IconButton>
      </Tooltip>

      <Fade in={isOpen}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Tooltip title="Increase font size" placement="left">
            <IconButton
              onClick={increaseFontSize}
              disabled={fontSize >= 24}
              aria-label="Increase font size"
              size="small"
            >
              <ZoomIn />
            </IconButton>
          </Tooltip>

          <Tooltip title="Decrease font size" placement="left">
            <IconButton
              onClick={decreaseFontSize}
              disabled={fontSize <= 12}
              aria-label="Decrease font size"
              size="small"
            >
              <ZoomOut />
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle high contrast" placement="left">
            <IconButton
              onClick={toggleHighContrast}
              color={highContrast ? 'primary' : 'default'}
              aria-label="Toggle high contrast mode"
              aria-pressed={highContrast}
              size="small"
            >
              <Contrast />
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle reduced motion" placement="left">
            <IconButton
              onClick={toggleReducedMotion}
              color={reducedMotion ? 'primary' : 'default'}
              aria-label="Toggle reduced motion"
              aria-pressed={reducedMotion}
              size="small"
            >
              <TextFields />
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle screen reader mode" placement="left">
            <IconButton
              onClick={toggleScreenReader}
              color={screenReader ? 'primary' : 'default'}
              aria-label="Toggle screen reader mode"
              aria-pressed={screenReader}
              size="small"
            >
              {screenReader ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Reset accessibility settings" placement="left">
            <IconButton
              onClick={resetSettings}
              aria-label="Reset accessibility settings"
              size="small"
            >
              <KeyboardArrowUp />
            </IconButton>
          </Tooltip>
        </Box>
      </Fade>
    </AccessibilityToolbar>
  )
}

// Screen reader announcer
interface ScreenReaderAnnouncerProps {
  message: string
  priority?: 'polite' | 'assertive'
}

export const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({
  message,
  priority = 'polite'
}) => {
  return (
    <Box
      component="div"
      aria-live={priority}
      aria-atomic="true"
      sx={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      }}
    >
      {message}
    </Box>
  )
}

// Skip link component
interface SkipLinkProps {
  href: string
  children: React.ReactNode
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  return (
    <Box
      component="a"
      href={href}
      sx={{
        position: 'absolute',
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        '&:focus': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: 1,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          textDecoration: 'none',
          zIndex: 9999
        }
      }}
    >
      {children}
    </Box>
  )
}

// Focus trap component
interface FocusTrapProps {
  children: React.ReactNode
  active?: boolean
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ children, active = true }) => {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [active])

  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}

// Accessible button component
interface AccessibleButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  variant?: 'text' | 'outlined' | 'contained'
  color?: 'primary' | 'secondary' | 'inherit'
  size?: 'small' | 'medium' | 'large'
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  ...buttonProps
}) => {
  const { keyboardNavigation } = useAccessibility()

  return (
    <Button
      {...buttonProps}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      sx={{
        '&:focus-visible': {
          outline: keyboardNavigation ? '2px solid' : 'none',
          outlineColor: 'primary.main',
          outlineOffset: '2px'
        }
      }}
    >
      {children}
    </Button>
  )
}

// Live region for dynamic content updates
interface LiveRegionProps {
  children: React.ReactNode
  priority?: 'polite' | 'assertive'
  atomic?: boolean
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  priority = 'polite',
  atomic = true
}) => {
  return (
    <Box
      aria-live={priority}
      aria-atomic={atomic}
      role="status"
    >
      {children}
    </Box>
  )
}

// Keyboard navigation helper
export const useKeyboardNavigation = () => {
  const handleKeyDown = React.useCallback((
    e: React.KeyboardEvent,
    actions: Record<string, () => void>
  ) => {
    const action = actions[e.key]
    if (action) {
      e.preventDefault()
      action()
    }
  }, [])

  return { handleKeyDown }
}

// CSS for accessibility features
export const accessibilityStyles = `
  /* High contrast mode */
  .high-contrast {
    filter: contrast(150%);
  }

  .high-contrast * {
    border-color: currentColor !important;
  }

  /* Reduced motion */
  .reduced-motion *,
  .reduced-motion *::before,
  .reduced-motion *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Keyboard navigation focus styles */
  .keyboard-navigation *:focus-visible {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }

  /* Screen reader only content */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Focus trap styles */
  .focus-trap {
    position: relative;
  }

  .focus-trap::before,
  .focus-trap::after {
    content: '';
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }
`

// Inject accessibility styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = accessibilityStyles
  document.head.appendChild(styleElement)
}

export default AccessibilityProvider