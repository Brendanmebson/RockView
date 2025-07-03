// frontend/src/components/reports/ReportDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack,
  CalendarMonth,
  Person,
  CheckCircle,
  HourglassEmpty,
  Cancel,
} from '@mui/icons-material';
import { Download, GetApp } from '@mui/icons-material';
import api from '../../services/api';
import GridItem from '../common/GridItem';
import { WeeklyReport } from '../../types';

const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const response = await api.get(`/reports/${id}`);
      setReport(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    try {
      const response = await api.get(`/export/report/${id}?format=${format}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${id}-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export report');
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return <Chip icon={<HourglassEmpty />} label="Pending" color="warning" />;
      case 'area_approved':
        return <Chip icon={<CheckCircle />} label="Area Approved" color="info" />;
      case 'district_approved':
        return <Chip icon={<CheckCircle />} label="District Approved" color="success" />;
      case 'rejected':
        return <Chip icon={<Cancel />} label="Rejected" color="error" />;
      default:
        return <Chip label={status} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ my: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/reports')}
          sx={{ mt: 2 }}
        >
          Back to Reports
        </Button>
      </Box>
    );
  }

  if (!report) {
    return (
      <Box sx={{ my: 3 }}>
        <Alert severity="info">Report not found</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/reports')}
          sx={{ mt: 2 }}
        >
          Back to Reports
        </Button>
      </Box>
    );
  }

  const totalAttendance = report.data.male + report.data.female + report.data.children;

  return (
    <Box>
      {/* Header with Back Button */}
<Box sx={{ mb: 3 }}>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
    <Button
      variant="outlined"
      startIcon={<ArrowBack />}
      onClick={() => navigate('/reports')}
      size={isMobile ? "small" : "medium"}
    >
      {isMobile ? 'Back' : 'Back to Reports'}
    </Button>
    <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
      Report Details
    </Typography>
  </Box>
  
  {/* Mobile-responsive action buttons */}
  <Box sx={{ 
    display: 'flex', 
    flexDirection: { xs: 'column', sm: 'row' },
    gap: 1,
    alignItems: { xs: 'stretch', sm: 'center' },
    justifyContent: { xs: 'stretch', sm: 'space-between' }
  }}>
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' },
      gap: 1,
      flex: { xs: 1, sm: 'none' }
    }}>
      <Button
        variant="outlined"
        startIcon={<Download />}
        onClick={() => handleExport('xlsx')}
        size={isMobile ? "small" : "medium"}
        fullWidth={isMobile}
      >
        Excel
      </Button>
      <Button
        variant="outlined"
        startIcon={<GetApp />}
        onClick={() => handleExport('pdf')}
        size={isMobile ? "small" : "medium"}
        fullWidth={isMobile}
      >
        PDF
      </Button>
    </Box>
    <Box sx={{ alignSelf: { xs: 'center', sm: 'flex-end' } }}>
      {getStatusChip(report.status)}
    </Box>
  </Box>
</Box>

      {/* Meta Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <GridItem xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth color="primary" />
                <Typography variant="subtitle1">
                  Week: {new Date(report.week).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              </Box>
            </GridItem>

            <GridItem xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person color="primary" />
                <Typography variant="subtitle1">
                  Submitted by: {report.submittedBy?.name || 'Unknown'}
                </Typography>
              </Box>
            </GridItem>

            <GridItem xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth color="primary" />
                <Typography variant="subtitle1">
                  Submitted on: {new Date(report.submittedAt || report.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </GridItem>
          </Grid>
        </CardContent>
      </Card>

      {/* Report Data */}
      <Grid container spacing={3}>
        {/* Attendance Information */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attendance Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TableContainer component={Paper} elevation={0} sx={{ mb: 2 }}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th">Male</TableCell>
                      <TableCell align="right">{report.data.male}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">Female</TableCell>
                      <TableCell align="right">{report.data.female}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">Children</TableCell>
                      <TableCell align="right">{report.data.children}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                        Total Attendance
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {totalAttendance}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 2 }}>
                <Chip 
                  label={`Mode: ${report.data.modeOfMeeting.charAt(0).toUpperCase() + report.data.modeOfMeeting.slice(1)}`} 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>
            </CardContent>
          </Card>
        </GridItem>

        {/* Offerings & Testimonies */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Offerings & Testimonies
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TableContainer component={Paper} elevation={0} sx={{ mb: 2 }}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th">Offerings</TableCell>
                      <TableCell align="right">₦{report.data.offerings.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">Number of Testimonies</TableCell>
                      <TableCell align="right">{report.data.numberOfTestimonies}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </GridItem>

        {/* First Timers Information */}
        <GridItem xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                First Timers Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableBody>
                   <TableRow>
                     <TableCell component="th">Number of First Timers</TableCell>
                     <TableCell align="right">{report.data.numberOfFirstTimers}</TableCell>
                   </TableRow>
                   <TableRow>
                     <TableCell component="th">First Timers Followed Up</TableCell>
                     <TableCell align="right">{report.data.firstTimersFollowedUp}</TableCell>
                   </TableRow>
                   <TableRow>
                     <TableCell component="th">First Timers Converted to CITH</TableCell>
                     <TableCell align="right">{report.data.firstTimersConvertedToCITH}</TableCell>
                   </TableRow>
                   {report.data.numberOfFirstTimers > 0 && (
                     <>
                       <TableRow>
                         <TableCell component="th">Follow-up Rate</TableCell>
                         <TableCell align="right">
                           {((report.data.firstTimersFollowedUp / report.data.numberOfFirstTimers) * 100).toFixed(1)}%
                         </TableCell>
                       </TableRow>
                       <TableRow>
                         <TableCell component="th">Conversion Rate</TableCell>
                         <TableCell align="right">
                           {((report.data.firstTimersConvertedToCITH / report.data.numberOfFirstTimers) * 100).toFixed(1)}%
                         </TableCell>
                       </TableRow>
                     </>
                   )}
                 </TableBody>
               </Table>
             </TableContainer>
           </CardContent>
         </Card>
       </GridItem>

       {/* Remarks */}
       {report.data.remarks && (
         <GridItem xs={12}>
           <Card>
             <CardContent>
               <Typography variant="h6" gutterBottom>
                 Remarks
               </Typography>
               <Divider sx={{ mb: 2 }} />
               <Typography variant="body1">{report.data.remarks}</Typography>
             </CardContent>
           </Card>
         </GridItem>
       )}

       {/* Approval Information */}
       {(report.status === 'area_approved' || report.status === 'district_approved') && (
         <GridItem xs={12}>
           <Card>
             <CardContent>
               <Typography variant="h6" gutterBottom>
                 Approval Information
               </Typography>
               <Divider sx={{ mb: 2 }} />

               <Grid container spacing={2}>
                 {report.areaApprovedBy && (
                   <GridItem xs={12} md={6}>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <CheckCircle color="info" />
                       <Typography>
                         Area Approved by: {report.areaApprovedBy.name}
                         {report.areaApprovedAt && (
                           <Typography variant="caption" display="block" color="textSecondary">
                             on {new Date(report.areaApprovedAt).toLocaleString()}
                           </Typography>
                         )}
                       </Typography>
                     </Box>
                   </GridItem>
                 )}

                 {report.districtApprovedBy && (
                   <GridItem xs={12} md={6}>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <CheckCircle color="success" />
                       <Typography>
                         District Approved by: {report.districtApprovedBy.name}
                         {report.districtApprovedAt && (
                           <Typography variant="caption" display="block" color="textSecondary">
                             on {new Date(report.districtApprovedAt).toLocaleString()}
                           </Typography>
                         )}
                       </Typography>
                     </Box>
                   </GridItem>
                 )}
               </Grid>
             </CardContent>
           </Card>
         </GridItem>
       )}

       {/* Rejection Information */}
       {report.status === 'rejected' && report.rejectionReason && (
         <GridItem xs={12}>
           <Card sx={{ bgcolor: 'error.light' }}>
             <CardContent>
               <Typography variant="h6" gutterBottom color="error">
                 Rejection Information
               </Typography>
               <Divider sx={{ mb: 2 }} />

               <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                 <Cancel color="error" sx={{ mt: 0.5 }} />
                 <Box>
                   <Typography color="error">
                     Rejected by: {report.rejectedBy?.name || 'Unknown'}
                     {report.rejectedAt && (
                       <Typography variant="caption" display="block" color="error.dark">
                         on {new Date(report.rejectedAt).toLocaleString()}
                       </Typography>
                     )}
                   </Typography>
                   <Typography variant="body1" color="error.dark" sx={{ mt: 1 }}>
                     Reason: {report.rejectionReason}
                   </Typography>
                 </Box>
               </Box>
             </CardContent>
           </Card>
         </GridItem>
       )}
     </Grid>
   </Box>
 );
};

export default ReportDetail;