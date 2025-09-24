import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  ThemeProvider as MuiThemeProvider, 
  createTheme, 
  Theme,
  CssBaseline,
  useMediaQuery
} from '@mui/material';
import { deepmerge } from '@mui/utils';

// Theme mode type
type ThemeMode = 'light' | 'dark' | 'auto';

// Theme context
interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  actualMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Base theme configuration
const getBaseTheme = (mode: 'light' | 'dark'): Theme => {
  const isLight = mode === 'light';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isLight ? '#1976d2' : '#90caf9',
        light: isLight ? '#42a5f5' : '#e3f2fd',
        dark: isLight ? '#1565c0' : '#42a5f5',
        contrastText: isLight ? '#ffffff' : '#000000'
      },
      secondary: {
        main: isLight ? '#dc004e' : '#f48fb1',
        light: isLight ? '#ff5983' : '#fce4ec',
        dark: isLight ? '#9a0036' : '#f48fb1'
      },
      background: {
        default: isLight ? '#fafafa' : '#121212',
        paper: isLight ? '#ffffff' : '#1e1e1e'
      },
      text: {
        primary: isLight ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
        secondary: isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'
      },
      divider: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      action: {
        hover: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
        selected: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)'
      }
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"'
      ].join(','),
      h1: {
        fontWeight: 300,
        fontSize: '2.5rem',
        lineHeight: 1.2
      },
      h2: {
        fontWeight: 300,
        fontSize: '2rem',
        lineHeight: 1.3
      },
      h3: {
        fontWeight: 400,
        fontSize: '1.75rem',
        lineHeight: 1.4
      },
      h4: {
        fontWeight: 400,
        fontSize: '1.5rem',
        lineHeight: 1.4
      },
      h5: {
        fontWeight: 400,
        fontSize: '1.25rem',
        lineHeight: 1.5
      },
      h6: {
        fontWeight: 500,
        fontSize: '1rem',
        lineHeight: 1.6
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.43
      },
      button: {
        textTransform: 'none',
        fontWeight: 500
      }
    },
    shape: {
      borderRadius: 8
    },
    spacing: 8,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }
          },
          contained: {
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: isLight 
              ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
              : '0 1px 3px rgba(255,255,255,0.12), 0 1px 2px rgba(255,255,255,0.24)',
            borderRadius: 12,
            '&:hover': {
              boxShadow: isLight
                ? '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)'
                : '0 3px 6px rgba(255,255,255,0.16), 0 3px 6px rgba(255,255,255,0.23)'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none'
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16
          }
        }
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8
          }
        }
      }
    }
  });
};

// Custom theme extensions
const getCustomTheme = (baseTheme: Theme): Theme => {
  return deepmerge(baseTheme, {
    custom: {
      gradients: {
        primary: baseTheme.palette.mode === 'light'
          ? 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)'
          : 'linear-gradient(45deg, #90caf9 30%, #e3f2fd 90%)',
        secondary: baseTheme.palette.mode === 'light'
          ? 'linear-gradient(45deg, #dc004e 30%, #ff5983 90%)'
          : 'linear-gradient(45deg, #f48fb1 30%, #fce4ec 90%)'
      },
      shadows: {
        card: baseTheme.palette.mode === 'light'
          ? '0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)'
          : '0 4px 6px rgba(255, 255, 255, 0.07), 0 1px 3px rgba(255, 255, 255, 0.06)',
        elevated: baseTheme.palette.mode === 'light'
          ? '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)'
          : '0 10px 15px rgba(255, 255, 255, 0.1), 0 4px 6px rgba(255, 255, 255, 0.05)'
      },
      animations: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideUp: 'slideUp 0.3s ease-out',
        bounce: 'bounce 0.6s ease-in-out'
      }
    }
  });
};

// Theme storage utilities
const THEME_STORAGE_KEY = 'ai-content-theme-mode';

const getStoredThemeMode = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      return stored as ThemeMode;
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
  }
  return 'auto';
};

const setStoredThemeMode = (mode: ThemeMode): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (error) {
    console.warn('Failed to save theme to localStorage:', error);
  }
};

// Theme provider component
interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setModeState] = useState<ThemeMode>(getStoredThemeMode);

  // Calculate actual theme mode
  const actualMode: 'light' | 'dark' = useMemo(() => {
    if (mode === 'auto') {
      return prefersDarkMode ? 'dark' : 'light';
    }
    return mode;
  }, [mode, prefersDarkMode]);

  // Create theme with memoization for performance
  const theme = useMemo(() => {
    const baseTheme = getBaseTheme(actualMode);
    return getCustomTheme(baseTheme);
  }, [actualMode]);

  // Set mode with persistence
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    setStoredThemeMode(newMode);
  };

  // Toggle between light and dark
  const toggleMode = () => {
    const newMode = actualMode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  };

  // Update CSS custom properties for theme
  useEffect(() => {
    const root = document.documentElement;
    
    root.style.setProperty('--primary-color', theme.palette.primary.main);
    root.style.setProperty('--secondary-color', theme.palette.secondary.main);
    root.style.setProperty('--background-color', theme.palette.background.default);
    root.style.setProperty('--paper-color', theme.palette.background.paper);
    root.style.setProperty('--text-primary', theme.palette.text.primary);
    root.style.setProperty('--text-secondary', theme.palette.text.secondary);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.palette.primary.main);
    }
  }, [theme]);

  // Context value
  const contextValue: ThemeContextType = {
    mode,
    setMode,
    toggleMode,
    actualMode
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// CSS-in-JS animations
export const animations = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translate3d(0, 0, 0);
    }
    40%, 43% {
      transform: translate3d(0, -30px, 0);
    }
    70% {
      transform: translate3d(0, -15px, 0);
    }
    90% {
      transform: translate3d(0, -4px, 0);
    }
  }
`;

// Inject animations into document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = animations;
  document.head.appendChild(style);
}