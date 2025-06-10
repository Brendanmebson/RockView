// frontend/src/components/auth/Register.tsx
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
// frontend/src/components/auth/Register.tsx (continued)
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
  Add,
  Phone,
} from '@mui/icons-material';
import { Building, Home, Users } from 'lucide-react';
import { PageContainer, AnimatedCard } from '../common/AnimatedComponents';
import GridItem from '../common/GridItem';
import { useThemeContext } from '../../context/ThemeContext';

const getLogo = (isDark: boolean) => {
  try {
    if (isDark) {
      return require('../../assets/dark-mode.png');
    } else {
      return require('../../assets/light-mode.png');
    }
  } catch (error) {
    return null;
  }
};

const Register: React.FC = () => {
  const { darkMode } = useThemeContext();
  const lightLogo = getLogo(false);
  const darkLogo = getLogo(true);

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: '',
    cithCentreId: '',
    areaSupervisorId: '',
    districtId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingDistricts, setFetchingDistricts] = useState(false);
  const [fetchingAreas, setFetchingAreas] = useState(false);
  const [fetchingCentres, setFetchingCentres] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [areaSupervisors, setAreaSupervisors] = useState<AreaSupervisor[]>([]);
  const [cithCentres, setCithCentres] = useState<CithCentre[]>([]);
  const [filteredAreaSupervisors, setFilteredAreaSupervisors] = useState<AreaSupervisor[]>([]);
  const [filteredCithCentres, setFilteredCithCentres] = useState<CithCentre[]>([]);
  const [showNewCentreDialog, setShowNewCentreDialog] = useState(false);
  const [newCentreData, setNewCentreData] = useState({
    name: '',
    location: '',
    leaderName: '',
    contactEmail: '',
    contactPhone: '',
    areaSupervisorId: '',
  });
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const steps = ['Personal Info', 'Role Selection', 'Assignment'];

  useEffect(() => {
    fetchDistricts();
  }, []);

  // Filter area supervisors when district is selected
  useEffect(() => {
    if (formData.districtId && areaSupervisors.length > 0) {
      console.log("Filtering area supervisors for district:", formData.districtId);
      console.log("Available area supervisors:", areaSupervisors);
      
      const districtId = formData.districtId.toString();
      
      const filtered = areaSupervisors.filter((sup) => {
        if (!sup.districtId) return false;
        
        // Handle both string and object references
        const supervisorDistrictId = typeof sup.districtId === 'string' 
          ? sup.districtId 
          : sup.districtId._id;
          
        return supervisorDistrictId === districtId;
      });
      
      console.log("Filtered area supervisors:", filtered);
      setFilteredAreaSupervisors(filtered);
      
      // Clear area supervisor selection if selected area not in filtered list
      if (formData.areaSupervisorId && !filtered.some(area => area._id === formData.areaSupervisorId)) {
        setFormData(prev => ({ ...prev, areaSupervisorId: '' }));
      }
    } else {
      setFilteredAreaSupervisors([]);
    }
  }, [formData.districtId, areaSupervisors]);

  // Filter CITH centres when area supervisor is selected
  useEffect(() => {
    if (formData.areaSupervisorId && cithCentres.length > 0) {
      const filtered = cithCentres.filter((centre) => {
        if (!centre.areaSupervisorId) return false;
        
        // Handle both string and object references
        const centreAreaId = typeof centre.areaSupervisorId === 'string' 
          ? centre.areaSupervisorId 
          : centre.areaSupervisorId._id;
          
        return centreAreaId === formData.areaSupervisorId;
      });
      
      setFilteredCithCentres(filtered);
      
      // Clear centre selection if selected centre not in filtered list
      if (formData.cithCentreId && !filtered.some(centre => centre._id === formData.cithCentreId)) {
        setFormData(prev => ({ ...prev, cithCentreId: '' }));
      }
    } else {
      setFilteredCithCentres([]);
    }
  }, [formData.areaSupervisorId, cithCentres]);

  // Fetch data based on role selection
  useEffect(() => {
    if (formData.role) {
      fetchDropdownData();
    }
  }, [formData.role]);

  const fetchDistricts = async () => {
    setFetchingDistricts(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/public/districts`);
      console.log("Fetched districts:", response.data);
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setDistricts(response.data);
      } else {
        console.log("No districts returned from API");
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      setError('Failed to load districts. Please try again.');
    } finally {
      setFetchingDistricts(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [districtsResponse, areasResponse, centresResponse] = await Promise.all([
        axios.get(`${API_URL}/public/districts`),
        axios.get(`${API_URL}/public/area-supervisors`),
        axios.get(`${API_URL}/public/cith-centres`)
      ]);
      
      setDistricts(districtsResponse.data);
      setAreaSupervisors(areasResponse.data);
      setCithCentres(centresResponse.data);
      
      console.log("Fetched districts:", districtsResponse.data);
      console.log("Fetched area supervisors:", areasResponse.data);
      console.log("Fetched CITH centres:", centresResponse.data);
      
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      setError('Failed to load selection options. Please try again.');
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
    
    // If selecting an area supervisor, set it for new centre data too
    if (name === 'areaSupervisorId') {
      setNewCentreData({
        ...newCentreData,
        areaSupervisorId: e.target.value,
      });
    }
  };

  const handleNewCentreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCentreData({
      ...newCentreData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateCentre = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/cith-centres`, newCentreData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const newCentre = response.data;
      
      // Add to centres list and select it
      setCithCentres([...cithCentres, newCentre]);
      setFilteredCithCentres([...filteredCithCentres, newCentre]);
      setFormData({
        ...formData,
        cithCentreId: newCentre._id,
      });
      
      setShowNewCentreDialog(false);
      
      // Reset new centre form
      setNewCentreData({
        name: '',
        location: '',
        leaderName: '',
        contactEmail: '',
        contactPhone: '',
        areaSupervisorId: formData.areaSupervisorId,
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create new centre');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Validate current step
    if (activeStep === 0) {
      if (!formData.name || !formData.email || !formData.password || !formData.phone) {
        setError('Please fill in all required fields');
        return;
      }
      
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      
      // Basic phone validation
      if (formData.phone.length < 10) {
        setError('Please enter a valid phone number');
        return;
      }
    } else if (activeStep === 1) {
      if (!formData.role) {
        setError('Please select your role');
        return;
      }
    }
    
    setError('');
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate final step based on role
    if (formData.role === 'district_pastor' && !formData.districtId) {
      setError('Please select your district');
      setLoading(false);
      return;
    } else if (formData.role === 'area_supervisor' && !formData.areaSupervisorId) {
      setError('Please select your area');
      setLoading(false);
      return;
    } else if (formData.role === 'cith_centre' && !formData.cithCentreId) {
      setError('Please select your CITH centre');
      setLoading(false);
      return;
    }

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
        return <Business fontSize="small" />;
      case 'cith_centre':
        return <Home size={20} />;
      default:
        return <Badge />;
    }
  };

  const getSafeDistrictName = (district: District) => {
    return district.name || 'Unknown District';
  };

  const getSafeAreaName = (area: AreaSupervisor) => {
    return area.name || 'Unknown Area';
  };

  const getSafeCentreName = (centre: CithCentre) => {
    return centre.name || 'Unknown Centre';
  };

  const LogoComponent = ({ size }: { size: number }) => {
    const logoSrc = darkMode ? darkLogo : lightLogo;
    
    if (logoSrc) {
      return (
        <img 
          src={logoSrc} 
          alt="House on the Rock" 
          style={{
            width: size,
            height: size,
            objectFit: 'contain'
          }}
        />
      );
    }
    
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: darkMode 
            ? 'linear-gradient(45deg, #66BB6A, #4CAF50)'
            : 'linear-gradient(45deg, #2E7D32, #4CAF50)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: size * 0.4,
        }}
      >
        H
      </Box>
    );
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
                name="phone"
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                    </InputAdornment>
                  ),
                }}
                helperText="Enter your phone number with country code (e.g., +234...)"
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
                helperText="Password must be at least 6 characters long"
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
                <MenuItem value="zonal_supervisor">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Users size={16} />
                    Zonal Supervisor
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
            {/* District selection for District Pastor */}
            {formData.role === 'district_pastor' && (
              <FormControl fullWidth required>
                <InputLabel>Select Your District</InputLabel>
                <Select
                  name="districtId"
                  value={formData.districtId}
                  onChange={handleSelectChange('districtId')}
                  startAdornment={
                    <InputAdornment position="start">
                      <Building size={16} />
                    </InputAdornment>
                  }
                  disabled={fetchingDistricts}
                >
                  {fetchingDistricts ? (
                    <MenuItem value="">
                      <CircularProgress size={20} sx={{ mr: 1 }} /> Loading Districts...
                    </MenuItem>
                  ) : districts.length === 0 ? (
                    <MenuItem value="">No districts available</MenuItem>
                  ) : (
                    districts.map((district) => (
                      <MenuItem key={district._id} value={district._id}>
                        <Box>
                          <Typography variant="body1">{getSafeDistrictName(district)}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            District {district.districtNumber} - {district.displayText || district.pastorName}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
                {districts.length === 0 && !fetchingDistricts && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    No districts available. Please contact administrator.
                  </Typography>
                )}
              </FormControl>
            )}
            
            {/* Area Supervisor selection - filtered by district for area supervisor role */}
            {formData.role === 'area_supervisor' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth required>
                  <InputLabel>Select District</InputLabel>
                  <Select
                    name="districtId"
                    value={formData.districtId}
                    onChange={handleSelectChange('districtId')}
                    startAdornment={
                      <InputAdornment position="start">
                        <Building size={16} />
                      </InputAdornment>
                    }
                    disabled={fetchingDistricts}
                  >
                    {fetchingDistricts ? (
                      <MenuItem value="">
                        <CircularProgress size={20} sx={{ mr: 1 }} /> Loading Districts...
                     </MenuItem>
                   ) : districts.length === 0 ? (
                     <MenuItem value="">No districts available</MenuItem>
                   ) : (
                     districts.map((district) => (
                       <MenuItem key={district._id} value={district._id}>
                         <Box>
                           <Typography variant="body1">{getSafeDistrictName(district)}</Typography>
                           <Typography variant="caption" color="textSecondary">
                             District {district.districtNumber} - {district.displayText || district.pastorName}
                           </Typography>
                         </Box>
                       </MenuItem>
                     ))
                   )}
                 </Select>
               </FormControl>
               
               {formData.districtId && (
                 <FormControl fullWidth required>
                   <InputLabel>Select Your Area</InputLabel>
                   <Select
                     name="areaSupervisorId"
                     value={formData.areaSupervisorId}
                     onChange={handleSelectChange('areaSupervisorId')}
                     startAdornment={
                       <InputAdornment position="start">
                         <Business fontSize="small" />
                       </InputAdornment>
                     }
                     disabled={fetchingAreas}
                   >
                     {fetchingAreas ? (
                       <MenuItem value="">
                         <CircularProgress size={20} sx={{ mr: 1 }} /> Loading Areas...
                       </MenuItem>
                     ) : filteredAreaSupervisors.length === 0 ? (
                       <MenuItem value="">No areas available in this district</MenuItem>
                     ) : (
                       filteredAreaSupervisors.map((supervisor) => (
                         <MenuItem key={supervisor._id} value={supervisor._id}>
                           <Box>
                             <Typography variant="body1">{getSafeAreaName(supervisor)}</Typography>
                             <Typography variant="caption" color="textSecondary">
                               {supervisor.displayText || supervisor.supervisorName}
                             </Typography>
                           </Box>
                         </MenuItem>
                       ))
                     )}
                   </Select>
                 </FormControl>
               )}
               
               {filteredAreaSupervisors.length === 0 && formData.districtId && !fetchingAreas && (
                 <Alert severity="info">
                   No area supervisors found for this district. Please contact your administrator.
                 </Alert>
               )}
             </Box>
           )}

           {/* CITH Centre selection with nested filtering */}
           {formData.role === 'cith_centre' && (
             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
               {/* District selection first */}
               <FormControl fullWidth required>
                 <InputLabel>Select District</InputLabel>
                 <Select
                   name="districtId"
                   value={formData.districtId}
                   onChange={handleSelectChange('districtId')}
                   startAdornment={
                     <InputAdornment position="start">
                       <Building size={16} />
                     </InputAdornment>
                   }
                   disabled={fetchingDistricts}
                 >
                   {fetchingDistricts ? (
                     <MenuItem value="">
                       <CircularProgress size={20} sx={{ mr: 1 }} /> Loading Districts...
                     </MenuItem>
                   ) : districts.length === 0 ? (
                     <MenuItem value="">No districts available</MenuItem>
                   ) : (
                     districts.map((district) => (
                       <MenuItem key={district._id} value={district._id}>
                         <Box>
                           <Typography variant="body1">{getSafeDistrictName(district)}</Typography>
                           <Typography variant="caption" color="textSecondary">
                             District {district.districtNumber} - {district.displayText || district.pastorName}
                           </Typography>
                         </Box>
                       </MenuItem>
                     ))
                   )}
                 </Select>
               </FormControl>
               
               {/* Area supervisor selection based on district */}
               {formData.districtId && (
                 <FormControl fullWidth required>
                   <InputLabel>Select Area</InputLabel>
                   <Select
                     name="areaSupervisorId"
                     value={formData.areaSupervisorId}
                     onChange={handleSelectChange('areaSupervisorId')}
                     startAdornment={
                       <InputAdornment position="start">
                         <Business fontSize="small" />
                       </InputAdornment>
                     }
                     disabled={fetchingAreas}
                   >
                     {fetchingAreas ? (
                       <MenuItem value="">
                         <CircularProgress size={20} sx={{ mr: 1 }} /> Loading Areas...
                       </MenuItem>
                     ) : filteredAreaSupervisors.length === 0 ? (
                       <MenuItem value="">No areas available in this district</MenuItem>
                     ) : (
                       filteredAreaSupervisors.map((supervisor) => (
                         <MenuItem key={supervisor._id} value={supervisor._id}>
                           <Box>
                             <Typography variant="body1">{getSafeAreaName(supervisor)}</Typography>
                             <Typography variant="caption" color="textSecondary">
                               {supervisor.displayText || supervisor.supervisorName}
                             </Typography>
                           </Box>
                         </MenuItem>
                       ))
                     )}
                   </Select>
                 </FormControl>
               )}
               
               {/* Centre selection based on area supervisor */}
               {formData.areaSupervisorId && (
                 <FormControl fullWidth required>
                   <InputLabel>Select Your CITH Centre</InputLabel>
                   <Select
                     name="cithCentreId"
                     value={formData.cithCentreId}
                     onChange={handleSelectChange('cithCentreId')}
                     startAdornment={
                       <InputAdornment position="start">
                         <LocationOn />
                       </InputAdornment>
                     }
                     disabled={fetchingCentres}
                   >
                     {fetchingCentres ? (
                       <MenuItem value="">
                         <CircularProgress size={20} sx={{ mr: 1 }} /> Loading Centres...
                       </MenuItem>
                     ) : filteredCithCentres.length === 0 ? (
                       <MenuItem value="">No centres available in this area</MenuItem>
                     ) : (
                       filteredCithCentres.map((centre) => (
                         <MenuItem key={centre._id} value={centre._id}>
                           <Box>
                             <Typography variant="body1">{getSafeCentreName(centre)}</Typography>
                             <Typography variant="caption" color="textSecondary">
                               {centre.location} - {centre.displayText || centre.leaderName}
                             </Typography>
                           </Box>
                         </MenuItem>
                       ))
                     )}
                   </Select>
                 </FormControl>
               )}
               
               {/* Option to create new centre */}
               {formData.areaSupervisorId && (
                 <Box sx={{ mt: 1 }}>
                   <Button
                     startIcon={<Add />}
                     onClick={() => setShowNewCentreDialog(true)}
                     variant="outlined"
                     color="primary"
                     fullWidth
                   >
                     Register a New CITH Centre
                   </Button>
                 </Box>
               )}
               
               {/* Messages when no options are available */}
               {formData.districtId && filteredAreaSupervisors.length === 0 && !fetchingAreas && (
                 <Alert severity="info">
                   No area supervisors found for this district. Please contact your administrator.
                 </Alert>
               )}
               
               {formData.areaSupervisorId && filteredCithCentres.length === 0 && !fetchingCentres && (
                 <Alert severity="info">
                   No CITH centres found for this area. You can register a new one with the button above.
                 </Alert>
               )}
             </Box>
           )}
           
           {/* Admin role doesn't need additional selection */}
           {formData.role === 'admin' && (
             <Box sx={{ textAlign: 'center', py: 4 }}>
               <LogoComponent size={48} />
               <Typography variant="h6" sx={{ mt: 2 }}>
                 Administration Access
               </Typography>
               <Typography variant="body2" color="textSecondary">
                 You will have full access to all church management features
               </Typography>
             </Box>
           )}
           
           {/* New Centre Creation Dialog */}
           <Dialog open={showNewCentreDialog} onClose={() => setShowNewCentreDialog(false)} maxWidth="sm" fullWidth>
             <DialogTitle>Register New CITH Centre</DialogTitle>
             <DialogContent>
               <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                 <TextField
                   label="Centre Name"
                   name="name"
                   value={newCentreData.name}
                   onChange={handleNewCentreChange}
                   fullWidth
                   required
                 />
                 <TextField
                   label="Location"
                   name="location"
                   value={newCentreData.location}
                   onChange={handleNewCentreChange}
                   fullWidth
                   required
                 />
                 <TextField
                   label="Leader Name"
                   name="leaderName"
                   value={newCentreData.leaderName}
                   onChange={handleNewCentreChange}
                   fullWidth
                   required
                 />
                 <TextField
                   label="Contact Email"
                   name="contactEmail"
                   type="email"
                   value={newCentreData.contactEmail}
                   onChange={handleNewCentreChange}
                   fullWidth
                 />
                 <TextField
                   label="Contact Phone"
                   name="contactPhone"
                   value={newCentreData.contactPhone}
                   onChange={handleNewCentreChange}
                   fullWidth
                 />
               </Box>
             </DialogContent>
             <DialogActions>
               <Button onClick={() => setShowNewCentreDialog(false)}>
                 Cancel
               </Button>
               <Button 
                 onClick={handleCreateCentre} 
                 variant="contained" 
                 disabled={loading || !newCentreData.name || !newCentreData.location || !newCentreData.leaderName}
                startIcon={loading ? <CircularProgress size={20} /> : <Add />}
               >
                 Create Centre
               </Button>
             </DialogActions>
           </Dialog>
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
         background: darkMode 
           ? 'linear-gradient(135deg, #121212 0%, #1B5E20 100%)'
           : 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)',
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
                     background: darkMode 
                       ? 'linear-gradient(45deg, #1B5E20, #0F3C11)'
                       : 'linear-gradient(45deg, #2E7D32, #1B5E20)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     mx: 'auto',
                     mb: 2,
                     boxShadow: '0 4px 20px rgba(46, 125, 50, 0.3)',
                     overflow: 'hidden',
                   }}
                 >
                   <LogoComponent size={60} />
                 </Box>
               </motion.div>

               <Typography component="h1" variant="h4" color="primary" sx={{ mb: 1 }}>
                 Join House on the Rock
               </Typography>
               <Typography variant="h6" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>
                 Become part of our Church's management family
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
                         startIcon={loading ? <CircularProgress size={20} /> : null}
                         sx={{
                           background: darkMode 
                             ? 'linear-gradient(45deg, #1B5E20, #0F3C11)'
                             : 'linear-gradient(45deg, #2E7D32, #1B5E20)',
                           '&:hover': {
                             background: darkMode 
                               ? 'linear-gradient(45deg, #0F3C11, #1B5E20)'
                               : 'linear-gradient(45deg, #1B5E20, #2E7D32)',
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