// frontend/src/theme/churchTheme.ts
import { createTheme, ThemeOptions } from '@mui/material/styles';

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#2E7D32' : '#1B5E20', // House on the Rock green
      light: mode === 'light' ? '#4CAF50' : '#2E7D32',
      dark: mode === 'light' ? '#1B5E20' : '#0F3C11',
    },
    secondary: {
      main: mode === 'light' ? '#66BB6A' : '#388E3C',
      light: mode === 'light' ? '#81C784' : '#4CAF50',
      dark: mode === 'light' ? '#388E3C' : '#2E7D32',
    },
    success: {
      main: mode === 'light' ? '#4CAF50' : '#66BB6A',
      light: mode === 'light' ? '#81C784' : '#A5D6A7',
      dark: mode === 'light' ? '#388E3C' : '#2E7D32',
    },
    warning: {
      main: mode === 'light' ? '#FF9800' : '#FFB74D',
      light: mode === 'light' ? '#FFB74D' : '#FFCC80',
      dark: mode === 'light' ? '#F57C00' : '#E65100',
    },
    error: {
      main: mode === 'light' ? '#F44336' : '#EF5350',
      light: mode === 'light' ? '#EF5350' : '#E57373',
      dark: mode === 'light' ? '#D32F2F' : '#C62828',
    },
    info: {
      main: mode === 'light' ? '#2196F3' : '#42A5F5',
      light: mode === 'light' ? '#64B5F6' : '#90CAF9',
      dark: mode === 'light' ? '#1976D2' : '#1565C0',
    },
    background: {
      default: mode === 'light' ? '#FAFAFA' : '#121212',
      paper: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
    },
    text: {
      primary: mode === 'light' ? '#212121' : '#FFFFFF',
      secondary: mode === 'light' ? '#757575' : '#B0B0B0',
    },
    divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      color: mode === 'light' ? '#212121' : '#FFFFFF',
    },
    h2: {
      fontWeight: 600,
      color: mode === 'light' ? '#212121' : '#FFFFFF',
    },
    h3: {
      fontWeight: 600,
      color: mode === 'light' ? '#212121' : '#FFFFFF',
    },
    h4: {
      fontWeight: 600,
      color: mode === 'light' ? '#212121' : '#FFFFFF',
    },
    h5: {
      fontWeight: 500,
      color: mode === 'light' ? '#212121' : '#FFFFFF',
    },
    h6: {
      fontWeight: 500,
      color: mode === 'light' ? '#212121' : '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mode === 'light' ? '#FAFAFA' : '#121212',
          transition: 'background-color 0.3s ease, color 0.3s ease',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
          boxShadow: mode === 'light' 
            ? '0 4px 20px 0 rgba(0,0,0,0.08)' 
            : '0 4px 20px 0 rgba(0,0,0,0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'light' 
              ? '0 8px 30px 0 rgba(0,0,0,0.12)' 
              : '0 8px 30px 0 rgba(0,0,0,0.5)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
          borderRight: mode === 'light' 
            ? '1px solid rgba(0,0,0,0.12)' 
            : '1px solid rgba(255,255,255,0.12)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' 
            ? 'rgba(255,255,255,0.95)' 
            : 'rgba(30,30,30,0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: mode === 'light' 
            ? '1px solid rgba(0,0,0,0.12)' 
            : '1px solid rgba(255,255,255,0.12)',
          color: mode === 'light' ? '#212121' : '#FFFFFF',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#F5F5F5' : '#2E2E2E',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: mode === 'light' 
            ? '1px solid rgba(0,0,0,0.12)' 
            : '1px solid rgba(255,255,255,0.12)',
        },
      },
    },
  },
});

export const createChurchTheme = (mode: 'light' | 'dark') => createTheme(getDesignTokens(mode));