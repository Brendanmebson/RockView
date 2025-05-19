import { createTheme } from '@mui/material/styles';

export const churchTheme = createTheme({
  palette: {
    primary: {
      main: '#4A5568', // Slate gray
      light: '#718096',
      dark: '#2D3748',
    },
    secondary: {
      main: '#D69E2E', // Gold
      light: '#F7DC6F',
      dark: '#B7791F',
    },
    success: {
      main: '#48BB78', // Green
      light: '#68D391',
      dark: '#38A169',
    },
    warning: {
      main: '#ED8936', // Orange
      light: '#FBB040',
      dark: '#C05621',
    },
    error: {
      main: '#E53E3E', // Red
      light: '#FC8181',
      dark: '#C53030',
    },
    background: {
      default: '#F7FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D3748',
      secondary: '#4A5568',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      color: '#2D3748',
    },
    h2: {
      fontWeight: 600,
      color: '#2D3748',
    },
    h3: {
      fontWeight: 600,
      color: '#2D3748',
    },
    h4: {
      fontWeight: 600,
      color: '#2D3748',
    },
    h5: {
      fontWeight: 500,
      color: '#2D3748',
    },
    h6: {
      fontWeight: 500,
      color: '#2D3748',
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
          boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px 0 rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 30px 0 rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});