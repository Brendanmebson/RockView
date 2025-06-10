// frontend/src/components/settings/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Grid,
  CircularProgress,
  Paper,
  Chip,
} from '@mui/material';
import {
  Person,
  Lock,
  Delete,
  Save,
  Logout,
  Business,
  Home,
  Business as Building,
  Group as Users,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useThemeContext } from '../../context/ThemeContext';
import GridItem from '../common/GridItem';

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

const SettingsPage: React.FC = () => {
  const { user, logout, refreshUserContext } = useAuth();
  const { darkMode, toggleDarkMode } = useThemeContext();
  const navigate = useNavigate();

  const lightLogo = getLogo(false);
  const darkLogo = getLogo(true);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [positionChangeData, setPositionChangeData] = useState({
    newRole: '',
    targetId: '',
    districtId: '',
    zonalId: '',
    areaId: '',
    centreId: '',
  });

  const [districts, setDistricts] = useState<any[]>([]);
  const [zonalSupervisors, setZonalSupervisors] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Only fetch hierarchy data if user is not admin
    if (user?.role !== 'admin') {
      fetchHierarchyData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const fetchHierarchyData = async () => {
    try {
      const [districtsRes, zonalRes, areasRes, centresRes] = await Promise.all([
        api.get('/public/districts'),
        api.get('/public/zonal-supervisors'),
        api.get('/public/area-supervisors'),
        api.get('/public/cith-centres')
      ]);
      
      setDistricts(districtsRes.data);
      setZonalSupervisors(zonalRes.data);
      setAreas(areasRes.data);
      setCentres(centresRes.data);
    } catch (error) {
      console.error('Error fetching hierarchy data:', error);
      setError('Failed to load organization data');
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileUpdate = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await api.put('/auth/profile', profileData);
      await refreshUserContext();
      setSuccess('Profile updated successfully!');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setError('');
    setSuccess('');
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handlePositionChangeRequest = async () => {
    setError('');
    setSuccess('');
    
    if (!positionChangeData.newRole) {
      setError('Please select a new role');
      return;
    }
    
    let targetId = '';
    if (positionChangeData.newRole === 'district_pastor') {
      targetId = positionChangeData.districtId;
    } else if (positionChangeData.newRole === 'zonal_supervisor') {
      targetId = positionChangeData.zonalId;
    } else if (positionChangeData.newRole === 'area_supervisor') {
      targetId = positionChangeData.areaId;
    } else if (positionChangeData.newRole === 'cith_centre') {
      targetId = positionChangeData.centreId;
    }
    
    if (!targetId) {
      setError('Please select all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      await api.post('/auth/position-change-request', {
        newRole: positionChangeData.newRole,
        targetId,
      });
      setSuccess('Position change request submitted! An admin will review your request.');
      
      setPositionChangeData({
        newRole: '',
        targetId: '',
        districtId: '',
        zonalId: '',
        areaId: '',
        centreId: '',
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to submit position change request');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    
    try {
      await api.delete('/auth/delete-account');
      logout();
      navigate('/login');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete account');
      setDeleteDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const LogoComponent = ({ size }: { size: number }) => {
    const logoSrc = darkMode ? darkLogo : lightLogo;
    
    if (logoSrc) {
      return (
        <img 
          src={logoSrc} 
          alt="Theme" 
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Account Settings</Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Theme Setting */}
        <GridItem xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: darkMode 
                        ? 'linear-gradient(45deg, #1B5E20, #0F3C11)'
                        : 'linear-gradient(45deg, #2E7D32, #1B5E20)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <LogoComponent size={30} />
                  </Box>
                  <Box>
                    <Typography variant="h6">Theme Preferences</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Choose your preferred theme mode
                    </Typography>
                  </Box>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={toggleDarkMode}
                      color="primary"
                      size="large"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">
                        {darkMode ? "Dark Mode" : "Light Mode"}
                      </Typography>
                      <Chip 
                        label={darkMode ? "🌙" : "☀️"} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  }
                />
              </Box>
            </CardContent>
          </Card>
        </GridItem>

        {/* Profile Information */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                Profile Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                />
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleProfileUpdate}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </GridItem>

        {/* Password Change */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Lock sx={{ mr: 1, verticalAlign: 'middle' }} />
                Change Password
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                />
                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  helperText="Password must be at least 6 characters long"
                />
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                  helperText={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== '' ? "Passwords don't match" : ''}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handlePasswordUpdate}
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </GridItem>

        {/* Position Change Request - Only show for non-admin users */}
        {user?.role !== 'admin' && (
          <GridItem xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Request Position Change
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Request a change to your role in the church. An administrator will review your request.
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>New Role</InputLabel>
                    <Select
                      value={positionChangeData.newRole}
                      onChange={(e) => setPositionChangeData({
                        ...positionChangeData,
                        newRole: e.target.value as string,
                        districtId: '',
                        zonalId: '',
                        areaId: '',
                        centreId: '',
                      })}
                      label="New Role"
                    >
                      <MenuItem value="">Select a role</MenuItem>
                      <MenuItem value="cith_centre">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Home fontSize="small" />
                          CITH Centre Leader
                        </Box>
                      </MenuItem>
                      <MenuItem value="area_supervisor">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business fontSize="small" />
                          Area Supervisor
                        </Box>
                      </MenuItem>
                      <MenuItem value="zonal_supervisor">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Users fontSize="small" />
                          Zonal Supervisor
                        </Box>
                      </MenuItem>
                      <MenuItem value="district_pastor">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Building fontSize="small" />
                          District Pastor
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {positionChangeData.newRole === 'district_pastor' && (
                    <FormControl fullWidth>
                      <InputLabel>Select District</InputLabel>
                      <Select
                        value={positionChangeData.districtId}
                        onChange={(e) => setPositionChangeData({
                          ...positionChangeData,
                          districtId: e.target.value as string,
                        })}
                        label="Select District"
                      >
                        <MenuItem value="">Select a district</MenuItem>
                        {districts.map((district) => (
                          <MenuItem key={district._id} value={district._id}>
                            {district.name} - District {district.districtNumber}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {positionChangeData.newRole === 'zonal_supervisor' && (
                    <>
                      <FormControl fullWidth>
                        <InputLabel>Select District</InputLabel>
                        <Select
                          value={positionChangeData.districtId}
                          onChange={(e) => setPositionChangeData({
                            ...positionChangeData,
                            districtId: e.target.value as string,
                            zonalId: '',
                          })}
                          label="Select District"
                        >
                          <MenuItem value="">Select a district</MenuItem>
                          {districts.map((district) => (
                            <MenuItem key={district._id} value={district._id}>
                              {district.name} - District {district.districtNumber}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {positionChangeData.districtId && (
                        <FormControl fullWidth>
                          <InputLabel>Select Zone</InputLabel>
                          <Select
                            value={positionChangeData.zonalId}
                            onChange={(e) => setPositionChangeData({
                              ...positionChangeData,
                              zonalId: e.target.value as string,
                            })}
                            label="Select Zone"
                          >
                            <MenuItem value="">Select a zone</MenuItem>
                            {zonalSupervisors
                              .filter(zonal => zonal.districtId && zonal.districtId._id === positionChangeData.districtId)
                              .map((zonal) => (
                                <MenuItem key={zonal._id} value={zonal._id}>
                                  {zonal.name} - {zonal.supervisorName}
                                </MenuItem>
                              ))
                            }
                          </Select>
                        </FormControl>
                      )}
                    </>
                  )}

                  {positionChangeData.newRole === 'area_supervisor' && (
                    <>
                      <FormControl fullWidth>
                        <InputLabel>Select District</InputLabel>
                        <Select
                          value={positionChangeData.districtId}
                          onChange={(e) => setPositionChangeData({
                            ...positionChangeData,
                            districtId: e.target.value as string,
                            zonalId: '',
                            areaId: '',
                          })}
                          label="Select District"
                        >
                          <MenuItem value="">Select a district</MenuItem>
                          {districts.map((district) => (
                            <MenuItem key={district._id} value={district._id}>
                              {district.name} - District {district.districtNumber}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {positionChangeData.districtId && (
                        <FormControl fullWidth>
                          <InputLabel>Select Zone</InputLabel>
                          <Select
                            value={positionChangeData.zonalId}
                            onChange={(e) => setPositionChangeData({
                              ...positionChangeData,
                              zonalId: e.target.value as string,
                              areaId: '',
                            })}
                            label="Select Zone"
                          >
                            <MenuItem value="">Select a zone</MenuItem>
                            {zonalSupervisors
                              .filter(zonal => zonal.districtId && zonal.districtId._id === positionChangeData.districtId)
                              .map((zonal) => (
                                <MenuItem key={zonal._id} value={zonal._id}>
                                  {zonal.name} - {zonal.supervisorName}
                                </MenuItem>
                              ))
                            }
                          </Select>
                        </FormControl>
                      )}

                      {positionChangeData.zonalId && (
                        <FormControl fullWidth>
                          <InputLabel>Select Area</InputLabel>
                          <Select
                            value={positionChangeData.areaId}
                            onChange={(e) => setPositionChangeData({
                              ...positionChangeData,
                              areaId: e.target.value as string,
                            })}
                            label="Select Area"
                          >
                            <MenuItem value="">Select an area</MenuItem>
                            {areas
                              .filter(area => area.zonalSupervisorId && area.zonalSupervisorId._id === positionChangeData.zonalId)
                              .map((area) => (
                                <MenuItem key={area._id} value={area._id}>
                                  {area.name} - {area.supervisorName}
                                </MenuItem>
                              ))
                            }
                          </Select>
                        </FormControl>
                      )}
                    </>
                  )}

                  {positionChangeData.newRole === 'cith_centre' && (
                    <>
                      <FormControl fullWidth>
                        <InputLabel>Select District</InputLabel>
                        <Select
                          value={positionChangeData.districtId}
                          onChange={(e) => setPositionChangeData({
                            ...positionChangeData,
                            districtId: e.target.value as string,
                            zonalId: '',
                            areaId: '',
                            centreId: '',
                          })}
                          label="Select District"
                        >
                          <MenuItem value="">Select a district</MenuItem>
                          {districts.map((district) => (
                            <MenuItem key={district._id} value={district._id}>
                              {district.name} - District {district.districtNumber}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {positionChangeData.districtId && (
                        <FormControl fullWidth>
                          <InputLabel>Select Zone</InputLabel>
                          <Select
                            value={positionChangeData.zonalId}
                            onChange={(e) => setPositionChangeData({
                              ...positionChangeData,
                              zonalId: e.target.value as string,
                              areaId: '',
                              centreId: '',
                            })}
                            label="Select Zone"
                          >
                            <MenuItem value="">Select a zone</MenuItem>
                            {zonalSupervisors
                              .filter(zonal => zonal.districtId && zonal.districtId._id === positionChangeData.districtId)
                              .map((zonal) => (
                                <MenuItem key={zonal._id} value={zonal._id}>
                                  {zonal.name} - {zonal.supervisorName}
                                </MenuItem>
                              ))
                            }
                          </Select>
                        </FormControl>
                      )}

                      {positionChangeData.zonalId && (
                        <FormControl fullWidth>
                          <InputLabel>Select Area</InputLabel>
                          <Select
                            value={positionChangeData.areaId}
                            onChange={(e) => setPositionChangeData({
                              ...positionChangeData,
                              areaId: e.target.value as string,
                              centreId: '',
                            })}
                            label="Select Area"
                          >
                            <MenuItem value="">Select an area</MenuItem>
                            {areas
                              .filter(area => area.zonalSupervisorId && area.zonalSupervisorId._id === positionChangeData.zonalId)
                              .map((area) => (
                                <MenuItem key={area._id} value={area._id}>
                                  {area.name} - {area.supervisorName}
                                </MenuItem>
                              ))
                            }
                          </Select>
                        </FormControl>
                      )}

                      {positionChangeData.areaId && (
                        <FormControl fullWidth>
                          <InputLabel>Select CITH Centre</InputLabel>
                          <Select
                            value={positionChangeData.centreId}
                            onChange={(e) => setPositionChangeData({
                              ...positionChangeData,
                              centreId: e.target.value as string,
                            })}
                            label="Select CITH Centre"
                          >
                            <MenuItem value="">Select a CITH centre</MenuItem>
                            {centres
                              .filter(centre => centre.areaSupervisorId && centre.areaSupervisorId._id === positionChangeData.areaId)
                              .map((centre) => (
                                <MenuItem key={centre._id} value={centre._id}>
                                  {centre.name} - {centre.location}
                                </MenuItem>
                              ))
                            }
                          </Select>
                        </FormControl>
                      )}
                    </>
                  )}

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePositionChangeRequest}
                    disabled={loading || !positionChangeData.newRole}
                  >
                    {loading ? "Submitting..." : "Submit Request"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </GridItem>
        )}

        {/* Danger Zone */}
        <GridItem xs={12}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              background: 'rgba(244, 67, 54, 0.05)', 
              border: '1px solid rgba(244, 67, 54, 0.2)',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" color="error" gutterBottom>
              Danger Zone
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Account
              </Button>
              
              <Button
                variant="outlined"
                color="warning"
                startIcon={<Logout />}
                onClick={() => setLogoutDialogOpen(true)}
              >
                Logout
              </Button>
            </Box>
          </Paper>
        </GridItem>
      </Grid>

      {/* Delete Account Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Your Account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. All your data will be permanently deleted.
            Are you sure you want to delete your account?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAccount} 
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Delete Account"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logout Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
      >
        <DialogTitle>Log Out?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to log out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogout} color="primary">
            Log Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;