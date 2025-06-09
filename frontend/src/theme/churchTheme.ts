// frontend/src/theme/churchTheme.ts - Update with dark mode support
import { createTheme, ThemeOptions } from '@mui/material/styles';

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#4A5568' : '#68D391', // Light green in dark mode
      light: mode === 'light' ? '#718096' : '#9AE6B4',
      dark: mode === 'light' ? '#2D3748' : '#38A169',
    },
    secondary: {
      main: mode === 'light' ? '#D69E2E' : '#F6E05E',
      light: mode === 'light' ? '#F7DC6F' : '#F6E05E',
      dark: mode === 'light' ? '#B7791F' : '#D69E2E',
    },
    success: {
      main: mode === 'light' ? '#48BB78' : '#68D391',
      light: mode === 'light' ? '#68D391' : '#9AE6B4',
      dark: mode === 'light' ? '#38A169' : '#38A169',
    },
    warning: {
      main: mode === 'light' ? '#ED8936' : '#F6AD55',
      light: mode === 'light' ? '#FBB040' : '#FBD38D',
      dark: mode === 'light' ? '#C05621' : '#DD6B20',
    },
    error: {
      main: mode === 'light' ? '#E53E3E' : '#FC8181',
      light: mode === 'light' ? '#FC8181' : '#FEB2B2',
      dark: mode === 'light' ? '#C53030' : '#E53E3E',
    },
    background: {
      default: mode === 'light' ? '#F7FAFC' : '#1A202C',
      paper: mode === 'light' ? '#FFFFFF' : '#2D3748',
    },
    text: {
      primary: mode === 'light' ? '#2D3748' : '#F7FAFC',
      secondary: mode === 'light' ? '#4A5568' : '#E2E8F0',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      color: mode === 'light' ? '#2D3748' : '#F7FAFC',
    },
    h2: {
      fontWeight: 600,
      color: mode === 'light' ? '#2D3748' : '#F7FAFC',
    },
    h3: {
      fontWeight: 600,
      color: mode === 'light' ? '#2D3748' : '#F7FAFC',
    },
    h4: {
      fontWeight: 600,
      color: mode === 'light' ? '#2D3748' : '#F7FAFC',
    },
    h5: {
      fontWeight: 500,
      color: mode === 'light' ? '#2D3748' : '#F7FAFC',
    },
    h6: {
      fontWeight: 500,
      color: mode === 'light' ? '#2D3748' : '#F7FAFC',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
          boxShadow: mode === 'light' 
            ? '0 4px 14px 0 rgba(0,0,0,0.1)' 
            : '0 4px 14px 0 rgba(0,0,0,0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'light' 
              ? '0 6px 20px 0 rgba(0,0,0,0.15)' 
              : '0 6px 20px 0 rgba(0,0,0,0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: mode === 'light' 
            ? '0 4px 20px 0 rgba(0,0,0,0.08)' 
            : '0 4px 20px 0 rgba(0,0,0,0.25)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: mode === 'light' 
              ? '0 8px 30px 0 rgba(0,0,0,0.12)' 
              : '0 8px 30px 0 rgba(0,0,0,0.35)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'light' ? '#FFFFFF' : '#2D3748',
          borderRight: mode === 'light' 
            ? '1px solid rgba(0,0,0,0.1)' 
            : '1px solid rgba(255,255,255,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' 
            ? 'rgba(255,255,255,0.95)' 
            : 'rgba(45,55,72,0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: mode === 'light' 
            ? '1px solid rgba(0,0,0,0.1)' 
            : '1px solid rgba(255,255,255,0.1)',
          boxShadow: mode === 'light' 
            ? '0 2px 20px rgba(0,0,0,0.05)' 
            : '0 2px 20px rgba(0,0,0,0.3)',
        },
      },
    },
  },
});

export const createChurchTheme = (mode: 'light' | 'dark') => createTheme(getDesignTokens(mode));