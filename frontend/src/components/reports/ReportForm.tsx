import React, { useState } from 'react';
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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { WeeklyReportData } from '../../types';

const ReportForm: React.FC = () => {
  const [week, setWeek] = useState<Dayjs | null>(dayjs());
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field: keyof WeeklyReportData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
    setReportData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get start of week (Sunday)
      const weekStart = week?.startOf('week').toDate();
      
      await api.post('/reports', {
        week: weekStart,
        data: reportData,
      });
      
      navigate('/reports');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Submit Weekly Report
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Week of"
                    value={week}
                    onChange={setWeek}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Mode of Meeting</InputLabel>
                    <Select
                      value={reportData.modeOfMeeting}
                      onChange={(e) => setReportData(prev => ({
                        ...prev,
                        modeOfMeeting: e.target.value as any,
                      }))}
                    >
                      <MenuItem value="physical">Physical</MenuItem>
                      <MenuItem value="virtual">Virtual</MenuItem>
                      <MenuItem value="hybrid">Hybrid</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Male"
                    type="number"
                    value={reportData.male}
                    onChange={handleChange('male')}
                    fullWidth
                    inputProps={{ min: 0 }}
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
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Offerings ($)"
                    type="number"
                    value={reportData.offerings}
                    onChange={handleChange('offerings')}
                    fullWidth
                    inputProps={{ min: 0, step: 0.01 }}
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
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Number of First Timers"
                    type="number"
                    value={reportData.numberOfFirstTimers}
                    onChange={handleChange('numberOfFirstTimers')}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    label="First Timers Followed Up"
                    type="number"
                    value={reportData.firstTimersFollowedUp}
                    onChange={handleChange('firstTimersFollowedUp')}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    label="First Timers Converted to CITH"
                    type="number"
                    value={reportData.firstTimersConvertedToCITH}
                    onChange={handleChange('firstTimersConvertedToCITH')}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Remarks"
                    multiline
                    rows={4}
                    value={reportData.remarks}
                    onChange={handleChange('remarks')}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit Report'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/reports')}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportForm;