import React, { useState, useEffect } from 'react';
import GridItem from '../common/GridItem';
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
import { useNavigate, useParams } from 'react-router-dom';
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
  ArrowBackOutlined,
  Event,
  Description
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const ReportForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const [week, setWeek] = useState<Dayjs | null>(dayjs().startOf('week'));
  const [eventType, setEventType] = useState('regular_service');
  const [eventDescription, setEventDescription] = useState('');
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
    
    if (isEditing) {
      fetchReportForEdit();
    }
  }, [user, id, isEditing]);

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

  const fetchReportForEdit = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/reports/${id}/edit`);
      const report = response.data;
      
      setWeek(dayjs(report.week));
      setEventType(report.eventType || 'regular_service');
      setEventDescription(report.eventDescription || '');
      setReportData(report.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch report for editing');
    } finally {
      setLoading(false);
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

    // Remove strict validation for first timers follow-up as per requirement
    // Allow follow-up and conversion to be more than current week's first timers

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
      
      const payload = {
        week: weekStart,
        eventType,
        eventDescription: eventDescription.trim(),
        data: reportData,
      };

      if (isEditing) {
        await api.put(`/reports/${id}`, payload);
        setSuccess('Report updated successfully!');
      } else {
        await api.post('/reports', payload);
        setSuccess('Report submitted successfully!');
      }
      
      // Navigate back after success
      setTimeout(() => {
        navigate('/reports');
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${isEditing ? 'update' : 'submit'} report`;
      setError(errorMessage);
      console.error('Report operation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total attendance
  const totalAttendance = reportData.male + reportData.female + reportData.children;

  const eventTypes = [
    { value: 'regular_service', label: 'Regular Service' },
    { value: 'singles_day', label: 'Singles Day' },
    { value: 'youth_day', label: 'Youth Day' },
    { value: 'womens_day', label: "Women's Day" },
    { value: 'mens_day', label: "Men's Day" },
    { value: 'harvest', label: 'Harvest Service' },
    { value: 'thanksgiving', label: 'Thanksgiving Service' },
    { value: 'special_crusade', label: 'Special Crusade' },
    { value: 'baptism_service', label: 'Baptism Service' },
    { value: 'communion_service', label: 'Communion Service' },
    { value: 'prayer_meeting', label: 'Prayer Meeting' },
    { value: 'other', label: 'Other Event' },
  ];

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
              {isEditing ? 'Edit Weekly Report' : 'Submit Weekly Report'}
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
                  {/* Week Selection and Event Type */}
                  <GridItem xs={12} md={4}>
                    <DatePicker
                      label="Week of"
                      value={week}
                      onChange={setWeek}
                      disabled={isEditing} // Don't allow changing week when editing
                      slotProps={{ 
                        textField: { 
                          fullWidth: true,
                          helperText: 'Select the Sunday of the report week'
                        } 
                      }}
                    />
                  </GridItem>

                  <GridItem xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Event Type</InputLabel>
                      <Select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        startAdornment={
                          <InputAdornment position="start">
                            <Event />
                          </InputAdornment>
                        }
                      >
                        {eventTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>

                  <GridItem xs={12} md={4}>
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
                  </GridItem>

                  {/* Event Description */}
                  {(eventType === 'other' || eventType !== 'regular_service') && (
                    <GridItem xs={12}>
                      <TextField
                        label="Event Description"
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        fullWidth
                        placeholder="Describe the special event or occasion"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Description />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </GridItem>
                  )}
                  
                  <GridItem xs={12}>
                    <Divider>
                      <Typography variant="subtitle2" color="textSecondary">
                        Attendance Information
                      </Typography>
                    </Divider>
                  </GridItem>

                  {/* Attendance Section */}
                  <GridItem xs={12} md={4}>
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
                  </GridItem>

                  <GridItem xs={12} md={4}>
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
                  </GridItem>
                  
                  <GridItem xs={12} md={4}>
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
                  </GridItem>

                  {/* Total Attendance Display */}
                  <GridItem xs={12}>
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
                  </GridItem>

                  <GridItem xs={12}>
                    <Divider>
                      <Typography variant="subtitle2" color="textSecondary">
                        Offerings and Testimonies
                      </Typography>
                    </Divider>
                  </GridItem>
                  
                  {/* Offerings and Testimonies Section */}
                  <GridItem xs={12} md={6}>
                    <TextField
                      label="Offerings (₦)"
                      type="number"
                      value={reportData.offerings}
                      onChange={handleChange('offerings')}
                      fullWidth
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            ₦
                          </InputAdornment>
                        ),
                      }}
                    />
                  </GridItem>

                  <GridItem xs={12} md={6}>
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
                  </GridItem>

                  <GridItem xs={12}>
                    <Divider>
                      <Typography variant="subtitle2" color="textSecondary">
                        First Timers Information
                      </Typography>
                    </Divider>
                  </GridItem>

                  {/* First Timers Section */}
                  <GridItem xs={12} md={4}>
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
                  </GridItem>

                  <GridItem xs={12} md={4}>
                    <TextField
                      label="First Timers Followed Up"
                      type="number"
                      value={reportData.firstTimersFollowedUp}
                      onChange={handleChange('firstTimersFollowedUp')}
                      fullWidth
                      inputProps={{ min: 0 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Check />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Can include follow-ups from previous weeks"
                    />
                  </GridItem>

                  <GridItem xs={12} md={4}>
                    <TextField
                      label="First Timers Converted to CITH"
                      type="number"
                      value={reportData.firstTimersConvertedToCITH}
                      onChange={handleChange('firstTimersConvertedToCITH')}
                      fullWidth
                      inputProps={{ min: 0 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Church fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Can include conversions from previous weeks"
                    />
                  </GridItem>
                  
                  {/* Remarks Section */}
                  <GridItem xs={12}>
                    <TextField
                      label="Remarks"
                      multiline
                      rows={4}
                      value={reportData.remarks}
                      onChange={handleChange('remarks')}
                      fullWidth
                      placeholder="Enter any additional comments, prayer points, or notable events"
                    />
                  </GridItem>

                  {/* Submit Buttons */}
                  <GridItem xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        type="submit"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveOutlined />}
                        sx={{ px: 4 }}
                      >
                        {loading ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Report' : 'Submit Report')}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/reports')}
                        startIcon={<ArrowBackOutlined />}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </GridItem>
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