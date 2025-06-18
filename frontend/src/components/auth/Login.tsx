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
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { PageContainer, FloatingElement } from '../common/AnimatedComponents';
// frontend/src/components/auth/Login.tsx (continued)
import { useThemeContext } from '../../context/ThemeContext';

// Import the logos
import lightLogo from '../../assets/light-logo.png';
import darkLogo from '../../assets/dark-logo.png';

const Login: React.FC = () => {
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
                padding: 4,
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
                      width: 80,
                      height: 80,
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
                        width: 60,
                        height: 60,
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                </motion.div>

                <Typography component="h1" variant="h3" color="primary" sx={{ mb: 1 }}>
                  RockView
                </Typography>
                <Typography variant="h6" color="textSecondary" sx={{ mb: 3 }}>
                  Welcome back to House on the Rock CITH attendance system
                </Typography>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ width: '100%' }}
                  >
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
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
                    sx={{ mb: 2 }}
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
                    sx={{ mb: 3 }}
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
                        py: 1.5,
                        fontSize: '1.1rem',
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
                      variant="body2"
                      sx={{
                        color: 'secondary.main',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
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