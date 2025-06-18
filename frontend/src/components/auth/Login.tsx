// frontend/src/components/auth/Login.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { PageContainer, FloatingElement } from '../common/AnimatedComponents';
import { useThemeContext } from '../../context/ThemeContext';

// Import the logos
import lightLogo from '../../assets/light-logo.png';
import darkLogo from '../../assets/dark-logo.png';

const Login: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const { darkMode } = useThemeContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <PageContainer>
      <Box
        sx={{
          minHeight: '100vh',
          background: darkMode 
            ? 'linear-gradient(135deg, #121212 0%, #1B5E20 100%)'
            : 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: { xs: 1, sm: 2 },
        }}
      >
        {/* Decorative floating elements - Hide on mobile for cleaner look */}
        {!isMobile && (
          <>
            <Box
              sx={{
                position: 'absolute',
                top: { sm: '10%', md: '15%' },
                left: { sm: '5%', md: '10%' },
                opacity: 0.1,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              <FloatingElement>
                <img 
                  src={darkMode ? darkLogo : lightLogo} 
                  alt="House on the Rock" 
                  style={{ 
                    width: isTablet ? 60 : 100, 
                    height: isTablet ? 60 : 100 
                  }}
                />
              </FloatingElement>
            </Box>
            
            <Box
              sx={{
                position: 'absolute',
                bottom: { sm: '10%', md: '15%' },
                right: { sm: '5%', md: '10%' },
                opacity: 0.1,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              <FloatingElement>
                <img 
                  src={darkMode ? darkLogo : lightLogo} 
                  alt="House on the Rock" 
                  style={{ 
                    width: isTablet ? 50 : 80, 
                    height: isTablet ? 50 : 80 
                  }}
                />
              </FloatingElement>
            </Box>
          </>
        )}

        <Container 
          component="main" 
          maxWidth="sm"
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: '500px', md: '450px' },
            px: { xs: 0, sm: 2 },
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              elevation={isMobile ? 0 : 12}
              sx={{
                padding: { xs: 3, sm: 4 },
                borderRadius: { xs: 0, sm: 4 },
                background: darkMode 
                  ? 'rgba(30, 30, 30, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                minHeight: { xs: '100vh', sm: 'auto' },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: { xs: 'center', sm: 'flex-start' },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 260 }}
                >
                  <Box
                    sx={{
                      width: { xs: 60, sm: 80 },
                      height: { xs: 60, sm: 80 },
                      borderRadius: '50%',
                      background: darkMode 
                        ? 'linear-gradient(45deg, #1B5E20, #0F3C11)'
                        : 'linear-gradient(45deg, #2E7D32, #1B5E20)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: { xs: 2, sm: 3 },
                      boxShadow: '0 4px 20px rgba(46, 125, 50, 0.3)',
                      overflow: 'hidden',
                    }}
                  >
                    <img 
                      src={darkMode ? darkLogo : lightLogo} 
                      alt="House on the Rock" 
                      style={{
                        width: isMobile ? 45 : 60,
                        height: isMobile ? 45 : 60,
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                </motion.div>

                <Typography 
                  component="h1" 
                  variant={isMobile ? "h4" : "h3"} 
                  color="primary" 
                  sx={{ 
                    mb: 1,
                    textAlign: 'center',
                    fontSize: { xs: '1.75rem', sm: '2.125rem', md: '3rem' }
                  }}
                >
                  RockView
                </Typography>
                
                <Typography 
                  variant={isMobile ? "body1" : "h6"} 
                  color="textSecondary" 
                  sx={{ 
                    mb: { xs: 3, sm: 4 },
                    textAlign: 'center',
                    px: { xs: 1, sm: 0 },
                    lineHeight: 1.4,
                  }}
                >
                  Welcome back to House on the Rock CITH attendance system
                </Typography>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ width: '100%', marginBottom: 16 }}
                  >
                    <Alert 
                      severity="error" 
                      sx={{ 
                        borderRadius: 2,
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      {error}
                    </Alert>
                  </motion.div>
                )}

                <motion.form
                  onSubmit={handleSubmit}
                  style={{ width: '100%' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      mb: 2,
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '1rem', sm: '1.125rem' },
                      }
                    }}
                  />
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={togglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      mb: 3,
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '1rem', sm: '1.125rem' },
                      }
                    }}
                  />
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{
                        mt: 2,
                        mb: 2,
                        py: { xs: 1.5, sm: 2 },
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        background: darkMode 
                          ? 'linear-gradient(45deg, #1B5E20, #0F3C11)'
                          : 'linear-gradient(45deg, #2E7D32, #1B5E20)',
                        '&:hover': {
                          background: darkMode 
                            ? 'linear-gradient(45deg, #0F3C11, #1B5E20)'
                            : 'linear-gradient(45deg, #1B5E20, #2E7D32)',
                        },
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            ⏳
                          </motion.div>
                          Signing in...
                        </Box>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </motion.div>
                  
                  <Box textAlign="center">
                    <Link
                      component={RouterLink}
                      to="/register"
                      variant={isMobile ? "body2" : "body1"}
                      sx={{
                        color: 'secondary.main',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                        display: 'block',
                        lineHeight: 1.4,
                        px: { xs: 1, sm: 0 },
                      }}
                    >
                      Don't have an account? Join our church community
                    </Link>
                  </Box>
                </motion.form>
              </Box>
            </Paper>
          </motion.div>
        </Container>
      </Box>
    </PageContainer>
  );
};

export default Login;