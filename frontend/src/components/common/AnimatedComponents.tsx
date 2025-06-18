// frontend/src/components/common/AnimatedComponents.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Box, Card, CardProps, useMediaQuery, useTheme } from '@mui/material';

// Animated Card component
export const AnimatedCard: React.FC<CardProps & { delay?: number }> = ({ 
  children, 
  delay = 0,
  ...props 
}) => {
  const theme = useTheme();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  if (prefersReducedMotion) {
    return <Card {...props}>{children}</Card>;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card {...props}>{children}</Card>
    </motion.div>
  );
};

// Animated Box for staggered animations
export const AnimatedBox: React.FC<{ children: React.ReactNode; delay?: number }> = ({ 
  children, 
  delay = 0 
}) => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  if (prefersReducedMotion) {
    return <>{children}</>;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  );
};

// Animated Page Container
export const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  if (prefersReducedMotion) {
    return <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>{children}</div>;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}
    >
      {children}
    </motion.div>
  );
};

// Floating Animation for decorative elements
export const FloatingElement: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  if (prefersReducedMotion) {
    return <>{children}</>;
  }
  
  return (
    <motion.div
      animate={{ 
        y: [0, -10, 0],
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};