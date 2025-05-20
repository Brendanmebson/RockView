import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { WeeklyReportData, CithCentre } from '../../types';
import { 
  PeopleAlt, 
  Woman, 
  ChildCare, 
  AttachMoney, 
  Comment, 
  PersonAdd, 
  Check, 
  Church,
  VideocamOutlined,
  GroupsOutlined,
  SaveOutlined,
  ArrowBackOutlined
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const ReportForm: React.FC = () => {
  const [week, setWeek] = useState<Dayjs | null>(dayjs().startOf('week'));
  const [reportData, setReportData] = useState<WeeklyReportData>({
    male: 0,
    female: 0,
    children: 0,
    offerings: 0,
    numberOfTestimonies: 0,
    numberOfFirstTimers: 0,
    firstTimersFollowedUp: 0,
    firstTimersConvertedToCITH: 0,
    modeOfMeeting: 'physical',
    remarks: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCentre, setLoadingCentre] = useState(false);
  const [centreInfo, setCentreInfo] = useState<CithCentre | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.cithCentreId) {
      fetchCentreInfo();
    }
  }, [user]);

  const fetchCentreInfo = async () => {
    if (!user?.cithCentreId) return;
    
    setLoadingCentre(true);
    try {
      const response = await api.get(`/cith-centres/${user.cithCentreId}`);
      setCentreInfo(response.data);
    } catch (error) {
      console.error('Error fetching centre info:', error);
    } finally {
      setLoadingCentre(false);
    }
  };

  const handleChange = (field: keyof WeeklyReportData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
    setReportData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange = (e: any) => {
    setReportData(prev => ({
      ...prev,
      modeOfMeeting: e.target.value,
    }));
  };

  const validateData = () => {
    // Validate all numbers are non-negative
    if (
      reportData.male < 0 ||
      reportData.female < 0 ||
      reportData.children < 0 ||
      reportData.offerings < 0 ||
      reportData.numberOfTestimonies < 0 ||
      reportData.numberOfFirstTimers < 0 ||
      reportData.firstTimersFollowedUp < 0 ||
      reportData.firstTimersConvertedToCITH < 0
    ) {
      setError('All numeric values must be non-negative');
      return false;
    }

    // Validate first timers followed up cannot be more than total first timers
    if (reportData.firstTimersFollowedUp > reportData.numberOfFirstTimers) {
      setError('First timers followed up cannot exceed total first timers');
      return false;
    }

    // Validate first timers converted cannot be more than followed up
    if (reportData.firstTimersConvertedToCITH > reportData.firstTimersFollowedUp) {
      setError('First timers converted cannot exceed first timers followed up');
      return false;
    }

    // Validate week cannot be in the future
    if (week && week.isAfter(dayjs())) {
      setError('Report week cannot be in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateData()) {
      return;
    }

    setLoading(true);

    try {
      // Get start of week (Sunday)
      const weekStart = week?.startOf('week').toDate();
      
      await api.post('/reports', {
        week: weekStart,
        data: reportData,
      });
      
      setSuccess('Report submitted successfully!');
      
      // Reset form for new entry or navigate
      setTimeout(() => {
        navigate('/reports');
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit report';
      setError(errorMessage);
      console.error('Report submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total attendance
  const totalAttendance = reportData.male + reportData.female + reportData.children;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Submit Weekly Report
            </Typography>
            {centreInfo && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 1, 
                  bgcolor: 'primary.light', 
                  color: 'white',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Church fontSize="small" />
                <Typography variant="body2">
                  {centreInfo.name} - {centreInfo.location}
                </Typography>
              </Paper>
            )}
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Week Selection and Meeting Mode */}
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Week of"
                      value={week}
                      onChange={setWeek}
                      slotProps={{ 
                        textField: { 
                          fullWidth: true,
                          helperText: 'Select the Sunday of the report week'
                        } 
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Mode of Meeting</InputLabel>
                      <Select
                        value={reportData.modeOfMeeting}
                        onChange={handleSelectChange}
                        startAdornment={
                          <InputAdornment position="start">
                            {reportData.modeOfMeeting === 'physical' ? (
                              <GroupsOutlined />
                            ) : reportData.modeOfMeeting === 'virtual' ? (
                              <VideocamOutlined />
                            ) : (
                              <GroupsOutlined />
                            )}
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="physical">Physical</MenuItem>
                        <MenuItem value="virtual">Virtual</MenuItem>
                        <MenuItem value="hybrid">Hybrid</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider>
                      <Typography variant="subtitle2" color="textSecondary">
                        Attendance Information
                      </Typography>
                    </Divider>
                  </Grid>
                  
                  {/* Attendance Section */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Male"
                      type="number"
                      value={reportData.male}
                      onChange={handleChange('male')}
                      fullWidth
                      inputProps={{ min: 0 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PeopleAlt />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Female"
                      type="number"
                      value={reportData.female}
                      onChange={handleChange('female')}
                      fullWidth
                      inputProps={{ min: 0 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Woman />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Children"
                      type="number"
                      value={reportData.children}
                      onChange={handleChange('children')}
                      fullWidth
                      inputProps={{ min: 0 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ChildCare />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  {/* Total Attendance Display */}
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'primary.light', 
                        color: 'white',
                        borderRadius: 2,
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="subtitle1">
                        Total Attendance: {totalAttendance}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider>
                      <Typography variant="subtitle2" color="textSecondary">
                        Offerings and Testimonies
                      </Typography>
                    </Divider>
                  </Grid>
                  
                  {/* Offerings and Testimonies Section */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Offerings ($)"
                      type="number"
                      value={reportData.offerings}
                      onChange={handleChange('offerings')}
                      fullWidth
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoney />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Number of Testimonies"
                      type="number"
                      value={reportData.numberOfTestimonies}
                      onChange={handleChange('numberOfTestimonies')}
                      fullWidth
                      inputProps={{ min: 0 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Comment />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider>
                      <Typography variant="subtitle2" color="textSecondary">
                        First Timers Information
                      </Typography>
                    </Divider>
                  </Grid>
                  
                  {/* First Timers Section */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Number of First Timers"
                      type="number"
                      value={reportData.numberOfFirstTimers}
                      onChange={handleChange('numberOfFirstTimers')}
                      fullWidth
                      inputProps={{ min: 0 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonAdd />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="First Timers Followed Up"
                      type="number"
                      value={reportData.firstTimersFollowedUp}
                      onChange={handleChange('firstTimersFollowedUp')}
                      fullWidth
                      inputProps={{ min: 0, max: reportData.numberOfFirstTimers }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Check />
                          </InputAdornment>
                        ),
                      }}
                      error={reportData.firstTimersFollowedUp > reportData.numberOfFirstTimers}
                      helperText={reportData.firstTimersFollowedUp > reportData.numberOfFirstTimers ? 
                        'Cannot exceed first timers' : ''}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="First Timers Converted to CITH"
                      type="number"
                      value={reportData.firstTimersConvertedToCITH}
                      onChange={handleChange('firstTimersConvertedToCITH')}
                      fullWidth
                      inputProps={{ min: 0, max: reportData.firstTimersFollowedUp }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Church fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      error={reportData.firstTimersConvertedToCITH > reportData.firstTimersFollowedUp}
                      helperText={reportData.firstTimersConvertedToCITH > reportData.firstTimersFollowedUp ? 
                        'Cannot exceed followed up' : ''}
                    />
                  </Grid>
                  
                  {/* Remarks Section */}
                  <Grid item xs={12}>
                    <TextField
                      label="Remarks"
                      multiline
                      rows={4}
                      value={reportData.remarks}
                      onChange={handleChange('remarks')}
                      fullWidth
                      placeholder="Enter any additional comments, prayer points, or notable events"
                    />
                  </Grid>
                  
                  {/* Submit Buttons */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        type="submit"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveOutlined />}
                        sx={{ px: 4 }}
                      >
                        {loading ? 'Submitting...' : 'Submit Report'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/reports')}
                        startIcon={<ArrowBackOutlined />}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportForm;