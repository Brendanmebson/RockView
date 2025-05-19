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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { District, AreaSupervisor, CithCentre } from '../../types';
import {
  Person,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Badge,
  Business,
  LocationOn,
} from '@mui/icons-material';
import { Church, Users, Building, Home } from 'lucide-react';
import { PageContainer, AnimatedCard } from '../common/AnimatedComponents';

const Register: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: '',
    cithCentreId: '',
    areaSupervisorId: '',
    districtId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [areaSupervisors, setAreaSupervisors] = useState<AreaSupervisor[]>([]);
  const [cithCentres, setCithCentres] = useState<CithCentre[]>([]);
  const { register } = useAuth();
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const steps = ['Personal Info', 'Role Selection', 'Assignment'];

  useEffect(() => {
    if (formData.role) {
      fetchDropdownData();
    }
  }, [formData.role]);

  const fetchDropdownData = async () => {
    try {
      if (formData.role === 'district_pastor' || formData.role === 'admin') {
        const response = await axios.get(`${API_URL}/public/districts`);
        setDistricts(response.data);
      }
      if (formData.role === 'area_supervisor') {
        const response = await axios.get(`${API_URL}/public/area-supervisors`);
        setAreaSupervisors(response.data);
      }
      if (formData.role === 'cith_centre') {
        const response = await axios.get(`${API_URL}/public/cith-centres`);
        setCithCentres(response.data);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string) => (e: any) => {
    setFormData({
      ...formData,
      [name]: e.target.value,
    });
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Users size={20} />;
      case 'district_pastor':
        return <Building size={20} />;
      case 'area_supervisor':
        return <Business size={20} />;
      case 'cith_centre':
        return <Home size={20} />;
      default:
        return <Badge />;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                required
                fullWidth
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                required
                fullWidth
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                required
                fullWidth
                name="email"
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
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
              />
            </Box>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <FormControl fullWidth required>
              <InputLabel>Role in Church</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleSelectChange('role')}
                startAdornment={
                  <InputAdornment position="start">
                    {getRoleIcon(formData.role)}
                  </InputAdornment>
                }
              >
                <MenuItem value="cith_centre">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Home size={16} />
                    CITH Centre Leader
                  </Box>
                </MenuItem>
                <MenuItem value="area_supervisor">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Business sx={{ fontSize: 16 }} />
                    Area Supervisor
                  </Box>
                </MenuItem>
                <MenuItem value="district_pastor">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Building size={16} />
                    District Pastor
                  </Box>
                </MenuItem>
                <MenuItem value="admin">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Users size={16} />
                    Administrator
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            {formData.role === 'cith_centre' && (
              <FormControl fullWidth required>
                <InputLabel>Select Your CITH Centre</InputLabel>
                <Select
                  name="cithCentreId"
                  value={formData.cithCentreId}
                  onChange={handleSelectChange('cithCentreId')}
                  startAdornment={
                    <InputAdornment position="start">
                      <LocationOn color="action" />
                    </InputAdornment>
                  }
                >
                  {cithCentres.map((centre) => (
                    <MenuItem key={centre._id} value={centre._id}>
                      <Box>
                        <Typography variant="body1">{centre.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {centre.location} - Led by {centre.leaderName}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {formData.role === 'area_supervisor' && (
              <FormControl fullWidth required>
                <InputLabel>Select Your Area</InputLabel>
                <Select
                  name="areaSupervisorId"
                  value={formData.areaSupervisorId}
                  onChange={handleSelectChange('areaSupervisorId')}
                  startAdornment={
                    <InputAdornment position="start">
                      <Business color="action" />
                    </InputAdornment>
                  }
                >
                  {areaSupervisors.map((supervisor) => (
                    <MenuItem key={supervisor._id} value={supervisor._id}>
                      <Box>
                        <Typography variant="body1">{supervisor.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Supervised by {supervisor.supervisorName}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {formData.role === 'district_pastor' && (
              <FormControl fullWidth required>
                <InputLabel>Select Your District</InputLabel>
                <Select
                  name="districtId"
                  value={formData.districtId}
                  onChange={handleSelectChange('districtId')}
                  startAdornment={
                    <InputAdornment position="start">
                      <Building color="action" />
                    </InputAdornment>
                  }
                >
                  {districts.map((district) => (
                    <MenuItem key={district._id} value={district._id}>
                      <Box>
                        <Typography variant="body1">{district.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          District {district.districtNumber} - {district.pastorName}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {formData.role === 'admin' && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Church size={48} color="#D69E2E" />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Administration Access
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  You will have full access to all church management features
                </Typography>
              </Box>
            )}
          </motion.div>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <PageContainer>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Container component="main" maxWidth="sm">
          <AnimatedCard delay={0.2}>
            <Paper
              elevation={12}
              sx={{
                padding: 4,
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
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
                {/* Header */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #D69E2E, #ED8936)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                     boxShadow: '0 4px 20px rgba(214, 158, 46, 0.3)',
                   }}
                 >
                   <Church size={40} color="white" />
                 </Box>
               </motion.div>

               <Typography component="h1" variant="h4" color="primary" sx={{ mb: 1 }}>
                 Join ClearView
               </Typography>
               <Typography variant="h6" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>
                 Become part of our church management family
               </Typography>

               {/* Stepper */}
               <Box sx={{ width: '100%', mb: 4 }}>
                 <Stepper activeStep={activeStep} alternativeLabel>
                   {steps.map((label) => (
                     <Step key={label}>
                       <StepLabel>{label}</StepLabel>
                     </Step>
                   ))}
                 </Stepper>
               </Box>

               {error && (
                 <motion.div
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   style={{ width: '100%', marginBottom: 16 }}
                 >
                   <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                 </motion.div>
               )}

               {/* Form */}
               <form style={{ width: '100%' }}>
                 {renderStepContent(activeStep)}
                 
                 <Box sx={{ display: 'flex', flexDirection: 'row', pt: 3 }}>
                   <Button
                     color="inherit"
                     disabled={activeStep === 0}
                     onClick={handleBack}
                     sx={{ mr: 1 }}
                   >
                     Back
                   </Button>
                   <Box sx={{ flex: '1 1 auto' }} />
                   {activeStep === steps.length - 1 ? (
                     <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                       <Button
                         variant="contained"
                         onClick={handleSubmit}
                         disabled={loading}
                         sx={{
                           background: 'linear-gradient(45deg, #D69E2E, #ED8936)',
                           '&:hover': {
                             background: 'linear-gradient(45deg, #B7791F, #C05621)',
                           },
                         }}
                       >
                         {loading ? 'Creating Account...' : 'Join Church'}
                       </Button>
                     </motion.div>
                   ) : (
                     <Button onClick={handleNext} variant="contained">
                       Next
                     </Button>
                   )}
                 </Box>
               </form>

               <Box textAlign="center" sx={{ mt: 3 }}>
                 <Link
                   component={RouterLink}
                   to="/login"
                   variant="body2"
                   sx={{
                     color: 'secondary.main',
                     textDecoration: 'none',
                     '&:hover': {
                       textDecoration: 'underline',
                     },
                   }}
                 >
                   Already part of our church? Sign In
                 </Link>
               </Box>
             </Box>
           </Paper>
         </AnimatedCard>
       </Container>
     </Box>
   </PageContainer>
 );
};

export default Register;