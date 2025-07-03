// frontend/src/components/auth/Login.tsx
import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Email, Lock, Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { PageContainer, FloatingElement } from '../common/AnimatedComponents';
import { useThemeContext } from '../../context/ThemeContext';

// Import the logos
import lightLogo from '../../assets/light-logo.png';
import darkLogo from '../../assets/dark-logo.png';

const Login: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const { darkMode } = useThemeContext();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setError('');
    setLoading(true);

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      await login(email.trim(), password);
      // Navigation will be handled by AuthContext after successful login
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
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
        }}
      >
        {/* Decorative floating elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            opacity: 0.1,
          }}
        >
          <FloatingElement>
            <img 
              src={darkMode ? darkLogo : lightLogo} 
              alt="House on the Rock" 
              style={{ width: 100, height: 100 }}
            />
          </FloatingElement>
        </Box>
        
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            opacity: 0.1,
          }}
        >
          <FloatingElement>
            <img 
              src={darkMode ? darkLogo : lightLogo} 
              alt="House on the Rock" 
              style={{ width: 80, height: 80 }}
            />
          </FloatingElement>
        </Box>

        <Container component="main" maxWidth="xs">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              elevation={12}
              sx={{
                padding: { xs: 3, sm: 4 },
                borderRadius: 4,
                background: darkMode 
                  ? 'rgba(30, 30, 30, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
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
                      mb: 2,
                      boxShadow: '0 4px 20px rgba(46, 125, 50, 0.3)',
                      overflow: 'hidden',
                    }}
                  >
                    <img 
                      src={darkMode ? darkLogo : lightLogo} 
                      alt="House on the Rock" 
                      style={{
                        width: isMobile ? 50 : 60,
                        height: isMobile ? 50 : 60,
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                </motion.div>

                <Typography 
                  component="h1" 
                  variant="h3" 
                  color="primary" 
                  sx={{ 
                    mb: 1,
                    fontSize: { xs: '1.75rem', sm: '3rem' },
                    fontWeight: 'bold'
                  }}
                >
                  RockView
                </Typography>
                <Typography 
                  variant="h6" 
                  color="textSecondary" 
                  sx={{ 
                    mb: 3, 
                    textAlign: 'center',
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  Welcome back to House on the Rock CITH attendance system
                </Typography>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ width: '100%' }}
                  >
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 2, 
                        borderRadius: 2 
                      }}
                      onClose={() => setError('')}
                    >
                      {error}
                    </Alert>
                  </motion.div>
                )}

                <Box 
                  component="form" 
                  onSubmit={handleSubmit} 
                  sx={{ width: '100%' }} 
                  noValidate
                >
                  <motion.div
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
                      variant="outlined"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(0, 0, 0, 0.23)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          backgroundColor: 'background.paper',
                          px: 0.5,
                          '&.Mui-focused': {
                            color: 'primary.main',
                          },
                        },
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
                      variant="outlined"
                      InputLabelProps={{
                        shrink: true,
                      }}
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
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(0, 0, 0, 0.23)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          backgroundColor: 'background.paper',
                          px: 0.5,
                          '&.Mui-focused': {
                            color: 'primary.main',
                          },
                        },
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
                        disabled={loading || !email.trim() || !password.trim()}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                        sx={{
                          mt: 2,
                          mb: 2,
                          py: 1.5,
                          fontSize: { xs: '1rem', sm: '1.1rem' },
                          fontWeight: 'bold',
                          background: darkMode 
                            ? 'linear-gradient(45deg, #1B5E20, #0F3C11)'
                            : 'linear-gradient(45deg, #2E7D32, #1B5E20)',
                          '&:hover': {
                            background: darkMode 
                              ? 'linear-gradient(45deg, #0F3C11, #1B5E20)'
                              : 'linear-gradient(45deg, #1B5E20, #2E7D32)',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)',
                          },
                          '&:disabled': {
                            background: 'rgba(0, 0, 0, 0.12)',
                            transform: 'none',
                            boxShadow: 'none',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        {loading ? 'Signing In...' : 'Sign In'}
                      </Button>
                    </motion.div>

                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Don't have an account?
                      </Typography>
                      <Link
                        component={RouterLink}
                        to="/register"
                        variant="body2"
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          fontWeight: 'medium',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        Join our church community
                      </Link>
                    </Box>
                  </motion.div>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Container>
      </Box>
    </PageContainer>
  );
};

export default Login;