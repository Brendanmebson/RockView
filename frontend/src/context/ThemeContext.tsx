// frontend/src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { churchTheme } from '../theme/churchTheme';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const storedPreference = localStorage.getItem('darkMode');
    if (storedPreference) {
      return JSON.parse(storedPreference);
    }
    // Check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const storedPreference = localStorage.getItem('darkMode');
      if (!storedPreference) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const theme = React.useMemo(() => {
    const baseTheme = churchTheme;
    
    return createTheme({
      ...baseTheme,
      palette: {
        ...baseTheme.palette,
        mode: darkMode ? 'dark' : 'light',
        background: {
          default: darkMode ? '#0a0a0a' : '#F7FAFC',
          paper: darkMode ? '#1a1a1a' : '#FFFFFF',
        },
        text: {
          primary: darkMode ? '#ffffff' : '#2D3748',
          secondary: darkMode ? '#a0a0a0' : '#4A5568',
        },
        primary: {
          main: darkMode ? '#6B73FF' : '#4A5568',
          light: darkMode ? '#9C88FF' : '#718096',
          dark: darkMode ? '#3730A3' : '#2D3748',
        },
        secondary: {
          main: darkMode ? '#F59E0B' : '#D69E2E',
          light: darkMode ? '#FBBF24' : '#F7DC6F',
          dark: darkMode ? '#D97706' : '#B7791F',
        },
        success: {
          main: darkMode ? '#10B981' : '#48BB78',
          light: darkMode ? '#34D399' : '#68D391',
          dark: darkMode ? '#059669' : '#38A169',
        },
        warning: {
          main: darkMode ? '#F59E0B' : '#ED8936',
          light: darkMode ? '#FBBF24' : '#FBB040',
          dark: darkMode ? '#D97706' : '#C05621',
        },
        error: {
          main: darkMode ? '#EF4444' : '#E53E3E',
          light: darkMode ? '#F87171' : '#FC8181',
          dark: darkMode ? '#DC2626' : '#C53030',
        },
        divider: darkMode ? '#2d2d2d' : '#E2E8F0',
      },
      components: {
        ...baseTheme.components,
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundColor: darkMode ? '#1a1a1a' : '#FFFFFF',
              borderRadius: 20,
              boxShadow: darkMode 
                ? '0 4px 20px 0 rgba(0,0,0,0.3)' 
                : '0 4px 20px 0 rgba(0,0,0,0.08)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: darkMode ? '1px solid #2d2d2d' : 'none',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: darkMode 
                  ? '0 8px 30px 0 rgba(0,0,0,0.4)' 
                  : '0 8px 30px 0 rgba(0,0,0,0.12)',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundColor: darkMode ? '#1a1a1a' : '#FFFFFF',
              borderRadius: 16,
              border: darkMode ? '1px solid #2d2d2d' : 'none',
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: darkMode ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255,255,255,0.95)',
              color: darkMode ? '#ffffff' : '#2D3748',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: darkMode ? '#0a0a0a' : '#fff',
              borderRight: darkMode ? '1px solid #2d2d2d' : '1px solid rgba(0,0,0,0.1)',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              ...baseTheme.components?.MuiButton?.styleOverrides?.root,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: darkMode 
                  ? '0 6px 20px 0 rgba(107, 115, 255, 0.3)' 
                  : '0 6px 20px 0 rgba(0,0,0,0.15)',
              },
            },
          },
        },
        MuiTableContainer: {
          styleOverrides: {
            root: {
              backgroundColor: darkMode ? '#1a1a1a' : '#FFFFFF',
            },
          },
        },
        MuiTableHead: {
          styleOverrides: {
            root: {
              backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa',
            },
          },
        },
      },
    });
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};