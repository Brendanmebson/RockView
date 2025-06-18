// frontend/src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createChurchTheme } from '../theme/churchTheme';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

interface CustomThemeProviderProps {
  children: ReactNode;
}

export const CustomThemeProvider: React.FC<CustomThemeProviderProps> = ({ children }) => {
  // Always default to light mode, ignore system preference
  const getInitialTheme = (): boolean => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      return JSON.parse(savedTheme);
    }
    // Default to light mode instead of system preference
    return false;
  };

 const [darkMode, setDarkMode] = useState<boolean>(getInitialTheme);

  // Remove system theme change listener since we want user control only
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    
    // Set data attribute for CSS
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    
    // Apply theme to body for smooth transitions
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    document.body.style.backgroundColor = darkMode ? '#121212' : '#FAFAFA';
    document.body.style.color = darkMode ? '#FFFFFF' : '#212121';
    
    // Apply to meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', darkMode ? '#121212' : '#2E7D32');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const theme = createChurchTheme(darkMode ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};