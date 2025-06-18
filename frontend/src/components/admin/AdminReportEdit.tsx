// frontend/src/components/admin/AdminReportEdit.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import api from '../../services/api';
import GridItem from '../common/GridItem';

const AdminReportEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [report, setReport] = useState<any>(null);
  const [formData, setFormData] = useState({
    data: {
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
    },
    eventType: 'regular_service',
    eventDescription: '',
    targetApprovalLevel: 'pending',
    resetApprovals: false,
  });

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const response = await api.get(`/reports/${id}`);
      const reportData = response.data;
      setReport(reportData);
      setFormData({
        data: reportData.data,
        eventType: reportData.eventType || 'regular_service',
        eventDescription: reportData.eventDescription || '',
        targetApprovalLevel: reportData.status,
        resetApprovals: false,
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const handleDataChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) || 0 : e.target.value;
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.put(`/reports/${id}/admin-comprehensive-edit`, formData);
      setSuccess('Report updated successfully!');
      setTimeout(() => {
        navigate('/reports');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!report) {
    return (
      <Box>
        <Alert severity="error">Report not found</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/reports')}
          sx={{ mt: 2 }}
        >
          Back to Reports
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/reports')}
          variant="outlined"
        >
          Back
        </Button>
        <Typography variant="h4">Admin Edit Report</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Report Info */}
              <GridItem xs={12}>
                <Typography variant="h6" gutterBottom>
                  Report Information
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Centre: {report.cithCentreId?.name || 'Unknown'}
                  <br />
                  Week: {new Date(report.week).toLocaleDateString()}
                  <br />
                  Originally submitted by: {report.submittedBy?.name || 'Unknown'}
                </Typography>
              </GridItem>

              <GridItem xs={12}>
                <Divider />
              </GridItem>

              {/* Event Details */}
              <GridItem xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Event Type</InputLabel>
                  <Select
                    value={formData.eventType}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value }))}
                  >
                    <MenuItem value="regular_service">Regular Service</MenuItem>
                    <MenuItem value="special_crusade">Special Crusade</MenuItem>
                    <MenuItem value="harvest">Harvest Service</MenuItem>
                    <MenuItem value="thanksgiving">Thanksgiving Service</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem xs={12} md={6}>
                <TextField
                  label="Event Description"
                  value={formData.eventDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventDescription: e.target.value }))}
                  fullWidth
                />
              </GridItem>

              {/* Attendance Data */}
              <GridItem xs={12}>
                <Typography variant="h6" gutterBottom>
                  Attendance Data
                </Typography>
              </GridItem>

              <GridItem xs={12} md={4}>
                <TextField
                  label="Male"
                  type="number"
                  value={formData.data.male}
                  onChange={handleDataChange('male')}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </GridItem>

              <GridItem xs={12} md={4}>
                <TextField
                  label="Female"
                  type="number"
                  value={formData.data.female}
                  onChange={handleDataChange('female')}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </GridItem>

              <GridItem xs={12} md={4}>
                <TextField
                  label="Children"
                  type="number"
                  value={formData.data.children}
                  onChange={handleDataChange('children')}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </GridItem>

              {/* Other Data */}
              <GridItem xs={12} md={6}>
                <TextField
                  label="Offerings (₦)"
                  type="number"
                  value={formData.data.offerings}
                  onChange={handleDataChange('offerings')}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </GridItem>

              <GridItem xs={12} md={6}>
                <TextField
                  label="Number of Testimonies"
                  type="number"
                  value={formData.data.numberOfTestimonies}
                  onChange={handleDataChange('numberOfTestimonies')}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </GridItem>

              {/* First Timers */}
              <GridItem xs={12} md={4}>
                <TextField
                  label="First Timers"
                  type="number"
                  value={formData.data.numberOfFirstTimers}
                  onChange={handleDataChange('numberOfFirstTimers')}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </GridItem>

              <GridItem xs={12} md={4}>
                <TextField
                  label="First Timers Followed Up"
                  type="number"
                  value={formData.data.firstTimersFollowedUp}
                  onChange={handleDataChange('firstTimersFollowedUp')}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </GridItem>

              <GridItem xs={12} md={4}>
                <TextField
                  label="First Timers Converted"
                  type="number"
                  value={formData.data.firstTimersConvertedToCITH}
                  onChange={handleDataChange('firstTimersConvertedToCITH')}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </GridItem>

              {/* Mode and Remarks */}
              <GridItem xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Mode of Meeting</InputLabel>
                  <Select
                    value={formData.data.modeOfMeeting}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      data: { ...prev.data, modeOfMeeting: e.target.value }
                    }))}
                  >
                    <MenuItem value="physical">Physical</MenuItem>
                    <MenuItem value="virtual">Virtual</MenuItem>
                    <MenuItem value="hybrid">Hybrid</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem xs={12}>
                <TextField
                  label="Remarks"
                  value={formData.data.remarks}
                  onChange={handleDataChange('remarks')}
                  fullWidth
                  multiline
                  rows={3}
                />
              </GridItem>

              {/* Admin Controls */}
              <GridItem xs={12}>
                <Divider />
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Admin Controls
                </Typography>
              </GridItem>

            <GridItem xs={12} md={6}>
               <FormControl fullWidth>
                 <InputLabel>Set Approval Level</InputLabel>
                 <Select
                   value={formData.targetApprovalLevel}
                   onChange={(e) => setFormData(prev => ({ ...prev, targetApprovalLevel: e.target.value }))}
                 >
                   <MenuItem value="pending">Pending (Reset to Start)</MenuItem>
                   <MenuItem value="area">Area Approved</MenuItem>
                   <MenuItem value="zonal">Zonal Approved</MenuItem>
                   <MenuItem value="district">District Approved (Final)</MenuItem>
                 </Select>
               </FormControl>
             </GridItem>

             <GridItem xs={12} md={6}>
               <FormControlLabel
                 control={
                   <Switch
                     checked={formData.resetApprovals}
                     onChange={(e) => setFormData(prev => ({ ...prev, resetApprovals: e.target.checked }))}
                   />
                 }
                 label="Reset all existing approvals"
               />
               <Typography variant="caption" display="block" color="textSecondary">
                 This will clear all approval history and timestamps
               </Typography>
             </GridItem>

             {/* Submit Buttons */}
             <GridItem xs={12}>
               <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                 <Button
                   type="submit"
                   variant="contained"
                   startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                   disabled={saving}
                 >
                   {saving ? 'Saving...' : 'Save Changes'}
                 </Button>
                 <Button
                   variant="outlined"
                   onClick={() => navigate('/reports')}
                 >
                   Cancel
                 </Button>
               </Box>
             </GridItem>
           </Grid>
         </form>
       </CardContent>
     </Card>
   </Box>
 );
};

export default AdminReportEdit;