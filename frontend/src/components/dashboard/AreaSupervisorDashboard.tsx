// frontend/src/components/dashboard/AreaSupervisorDashboard.tsx
import React, { useEffect, useState } from 'react';
import GridItem from '../common/GridItem';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  PeopleAlt, 
  AttachMoney, 
  TrendingUp, 
  Assessment,
  Business,
  Home,
  Group
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  AreaChart,
  Area
} from 'recharts';
import api from '../../services/api';
import { WeeklyReport, ReportSummary, CithCentre } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AreaSupervisorDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const darkMode = theme.palette.mode === 'dark';
  
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [pendingReports, setPendingReports] = useState<WeeklyReport[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalMale: 0,
    totalFemale: 0,
    totalChildren: 0,
    totalOfferings: 0,
    totalTestimonies: 0,
    totalFirstTimers: 0,
    totalFirstTimersFollowedUp: 0,
    totalFirstTimersConverted: 0,
    totalReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [centres, setCentres] = useState<CithCentre[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [centreComparisonData, setCentreComparisonData] = useState<any[]>([]);
  const [offeringTrends, setOfferingTrends] = useState<any[]>([]);
  const [firstTimerData, setFirstTimerData] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user, userArea, userDistrict } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Clear error message after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Get current month's date range
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const [
        reportsResult,
        pendingResult,
        centresResult
      ] = await Promise.allSettled([
        api.get(`/reports?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}&limit=100`),
        api.get('/reports?status=pending&limit=50'),
        api.get('/cith-centres')
      ]);
      
      // Handle reports
      if (reportsResult.status === 'fulfilled') {
        const reportsData = reportsResult.value.data?.reports || [];
        setReports(reportsData);
        calculateMonthlyStats(reportsData);
      }
      
      // Handle pending reports
      if (pendingResult.status === 'fulfilled') {
        const pendingData = pendingResult.value.data?.reports || [];
        setPendingReports(pendingData);
      }
      
      // Handle centres
      if (centresResult.status === 'fulfilled') {
        const centresData = centresResult.value.data || [];
        setCentres(centresData);
      }
      
      // Process chart data with the fetched data
      const validReports = reportsResult.status === 'fulfilled' ? 
        (reportsResult.value.data?.reports || []) : [];
      const validCentres = centresResult.status === 'fulfilled' ? 
        (centresResult.value.data || []) : [];
        
      processChartData(validReports, validCentres);
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyStats = (reports: WeeklyReport[]) => {
    const stats = reports.reduce((acc, report) => {
      if (report && report.data) {
        acc.totalMale += report.data?.male || 0;
        acc.totalFemale += report.data?.female || 0;
        acc.totalChildren += report.data?.children || 0;
        acc.totalOfferings += report.data?.offerings || 0;
        acc.totalTestimonies += report.data?.numberOfTestimonies || 0;
        acc.totalFirstTimers += report.data?.numberOfFirstTimers || 0;
        acc.totalFirstTimersFollowedUp += report.data?.firstTimersFollowedUp || 0;
        acc.totalFirstTimersConverted += report.data?.firstTimersConvertedToCITH || 0;
        acc.totalReports += 1;
      }
      return acc;
    }, {
      totalMale: 0,
      totalFemale: 0,
      totalChildren: 0,
      totalOfferings: 0,
      totalTestimonies: 0,
      totalFirstTimers: 0,
      totalFirstTimersFollowedUp: 0,
      totalFirstTimersConverted: 0,
      totalReports: 0,
    });
    
    setMonthlyStats(stats);
  };

  const processChartData = (reports: WeeklyReport[], centres: CithCentre[]) => {
    try {
      // Filter out invalid reports
      const validReports = reports.filter(report => 
        report && 
        report.data && 
        typeof report.data === 'object' &&
        report.week
      );

      // Group reports by week for attendance trends
      const weeklyData: {[key: string]: any} = {};
      validReports.forEach(report => {
        try {
          const week = new Date(report.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!weeklyData[week]) {
            weeklyData[week] = { week, male: 0, female: 0, children: 0, total: 0 };
          }
          weeklyData[week].male += report.data.male || 0;
          weeklyData[week].female += report.data.female || 0;
          weeklyData[week].children += report.data.children || 0;
          weeklyData[week].total += (report.data.male || 0) + (report.data.female || 0) + (report.data.children || 0);
        } catch (err) {
          console.warn('Error processing report for week data:', err);
        }
      });
      
      const sortedAttendanceData = Object.values(weeklyData).sort((a: any, b: any) => {
        try {
          const dateA = new Date(a.week + ', 2024'); // Add year for proper sorting
          const dateB = new Date(b.week + ', 2024');
          return dateA.getTime() - dateB.getTime();
        } catch (err) {
          return 0;
        }
      });
      
      setAttendanceData(sortedAttendanceData);
      
      // Centre comparison data for radar chart
      const centreData: {[key: string]: any} = {};
      centres.forEach(centre => {
        if (centre && centre._id && centre.name) {
          centreData[centre._id] = { 
            name: centre.name, 
            attendance: 0, 
            offerings: 0, 
            firstTimers: 0,
            testimonies: 0
          };
        }
      });
      
      validReports.forEach(report => {
        try {
          const centreId = report.cithCentreId?._id;
          if (centreId && centreData[centreId]) {
            centreData[centreId].attendance += (report.data.male || 0) + (report.data.female || 0) + (report.data.children || 0);
            centreData[centreId].offerings += report.data.offerings || 0;
            centreData[centreId].firstTimers += report.data.numberOfFirstTimers || 0;
            centreData[centreId].testimonies += report.data.numberOfTestimonies || 0;
          }
        } catch (err) {
          console.warn('Error processing report for centre data:', err);
        }
      });
      
      setCentreComparisonData(Object.values(centreData));
      
      // Offering trends
      const offeringData: {[key: string]: any} = {};
      validReports.forEach(report => {
        try {
          const week = new Date(report.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!offeringData[week]) {
            offeringData[week] = { week, amount: 0 };
          }
          offeringData[week].amount += report.data.offerings || 0;
        } catch (err) {
          console.warn('Error processing report for offering data:', err);
        }
      });
      
      const sortedOfferingData = Object.values(offeringData).sort((a: any, b: any) => {
        try {
          const dateA = new Date(a.week + ', 2024');
          const dateB = new Date(b.week + ', 2024');
          return dateA.getTime() - dateB.getTime();
        } catch (err) {
          return 0;
        }
      });
      
      setOfferingTrends(sortedOfferingData);

      // First timer journey data
      const firstTimerWeeklyData: {[key: string]: any} = {};
      validReports.forEach(report => {
        try {
          const week = new Date(report.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!firstTimerWeeklyData[week]) {
            firstTimerWeeklyData[week] = { 
              week, 
              firstTimers: 0, 
              followedUp: 0, 
              converted: 0 
            };
          }
          firstTimerWeeklyData[week].firstTimers += report.data.numberOfFirstTimers || 0;
          firstTimerWeeklyData[week].followedUp += report.data.firstTimersFollowedUp || 0;
          firstTimerWeeklyData[week].converted += report.data.firstTimersConvertedToCITH || 0;
        } catch (err) {
          console.warn('Error processing report for first timer data:', err);
        }
      });
      
      const sortedFirstTimerData = Object.values(firstTimerWeeklyData).sort((a: any, b: any) => {
        try {
          const dateA = new Date(a.week + ', 2024');
          const dateB = new Date(b.week + ', 2024');
          return dateA.getTime() - dateB.getTime();
        } catch (err) {
          return 0;
        }
      });
      
      setFirstTimerData(sortedFirstTimerData);
      
    } catch (error) {
      console.error('Error processing chart data:', error);
      // Set empty arrays as fallback
      setAttendanceData([]);
      setCentreComparisonData([]);
      setOfferingTrends([]);
      setFirstTimerData([]);
    }
  };

  const handleApprove = async (reportId: string) => {
    try {
      await api.put(`/reports/${reportId}/approve`);
      setSuccess('Report approved successfully');
      fetchDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error approving report:', error);
      setError(error.response?.data?.message || 'Failed to approve report');
    }
  };

  const handleReject = async (reportId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;
    
    try {
      await api.put(`/reports/${reportId}/reject`, { reason });
      setSuccess('Report rejected successfully');
      fetchDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error rejecting report:', error);
      setError(error.response?.data?.message || 'Failed to reject report');
    }
  };

  const COLORS = ['#2E7D32', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9'];
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%',
      overflow: 'hidden',
      px: { xs: 0, sm: 0 }
    }}>
      {/* Context Banner */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          mb: 3, 
          background: 'linear-gradient(90deg, #2E7D32 0%, #1B5E20 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: { xs: 1.5, sm: 2 },
          justifyContent: { xs: 'space-between', sm: 'flex-start' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '100%', sm: 'auto' } }}>
            <Business />
            <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {userArea ? userArea.name : 'Loading Area...'}
            </Typography>
          </Box>
          
          {!isMobile && <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', sm: 'auto' } }}>
            <Home />
            <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {userDistrict ? userDistrict.name : 'Loading District...'}
            </Typography>
          </Box>
          
          <Box sx={{ 
            ml: { xs: 0, sm: 'auto' }, 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 },
            mt: { xs: 1, sm: 0 },
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-end' }
          }}>
            <Chip 
              label={`${centres.length} CITH Centres`} 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                color: 'white',
                '& .MuiChip-label': { fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.75rem' } }
              }} 
            />
            <Chip 
              label={currentMonth} 
              size="small" 
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                '& .MuiChip-label': { fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.75rem' } }
              }} 
            />
          </Box>
        </Box>
      </Paper>

      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
        Area Supervisor Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Summary Stats Cards - Using Monthly Stats */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
        <GridItem xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center',
              p: { xs: 2, sm: 3 },
              '&:last-child': { pb: { xs: 2, sm: 3 } }
            }}>
              <Avatar sx={{ 
                bgcolor: darkMode ? '#64B5F6' : '#1976D2', 
                mr: 2,
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 }
              }}>
                <PeopleAlt />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Monthly Attendance
                </Typography>
                <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  {monthlyStats.totalMale + monthlyStats.totalFemale + monthlyStats.totalChildren}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                  <Chip label={`M: ${monthlyStats.totalMale}`} size="small" color="primary" variant="outlined" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }} />
                  <Chip label={`F: ${monthlyStats.totalFemale}`} size="small" color="secondary" variant="outlined" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }} />
                  <Chip label={`C: ${monthlyStats.totalChildren}`} size="small" color="info" variant="outlined" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        
        <GridItem xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center',
              p: { xs: 2, sm: 3 },
              '&:last-child': { pb: { xs: 2, sm: 3 } }
            }}>
              <Avatar sx={{ 
                bgcolor: darkMode ? '#81C784' : '#388E3C', 
                mr: 2,
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 }
              }}>
                <AttachMoney />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Monthly Offerings
                </Typography>
                <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  ₦{monthlyStats.totalOfferings.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  Avg: ₦{Math.round(monthlyStats.totalOfferings / Math.max(monthlyStats.totalReports, 1)).toLocaleString()} per service
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        
        <GridItem xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center',
              p: { xs: 2, sm: 3 },
              '&:last-child': { pb: { xs: 2, sm: 3 } }
            }}>
              <Avatar sx={{ 
                bgcolor: darkMode ? '#FFB74D' : '#F57C00', 
                mr: 2,
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 }
              }}>
                <TrendingUp />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Monthly First Timers
                </Typography>
                <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  {monthlyStats.totalFirstTimers}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`${monthlyStats.totalFirstTimersFollowedUp} followed`} 
                    size="small" 
                    color="success" 
                    variant="outlined" 
                    sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        
        <GridItem xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center',
              p: { xs: 2, sm: 3 },
              '&:last-child': { pb: { xs: 2, sm: 3 } }
            }}>
              <Avatar sx={{ 
                bgcolor: darkMode ? '#BA68C8' : '#7B1FA2', 
                mr: 2,
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 }
              }}>
                <Assessment />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Monthly Testimonies
                </Typography>
                <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  {monthlyStats.totalTestimonies}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  Across {monthlyStats.totalReports} services
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Attendance Trends Chart - Made Wider */}
        <GridItem xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Area Attendance Trends - {currentMonth}
              </Typography>
              {attendanceData.length > 0 ? (
                <Box sx={{ 
                  width: '100%', 
                  height: { xs: 300, sm: 350, md: 400 },
                  overflow: 'hidden'
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceData} margin={{ top: 5, right: isMobile ? 5 : 30, left: isMobile ? 5 : 20, bottom: 5 }}>
                      <XAxis 
                        dataKey="week" 
                        fontSize={isMobile ? 10 : 12}
                        interval={isMobile ? 'preserveStartEnd' : 0}
                      />
                      <YAxis fontSize={isMobile ? 10 : 12} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="male" name="Male" stroke="#2E7D32" />
                      <Line type="monotone" dataKey="female" name="Female" stroke="#4CAF50" />
                      <Line type="monotone" dataKey="children" name="Children" stroke="#66BB6A" />
                      <Line type="monotone" dataKey="total" name="Total" stroke="#1B5E20" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No attendance data available for {currentMonth}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>
        
        {/* Offerings Trend */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Offering Trends - {currentMonth}
              </Typography>
              {offeringTrends.length > 0 ? (
                <Box sx={{ 
                  width: '100%', 
                  height: { xs: 300, sm: 350, md: 400 },
                  overflow: 'hidden'
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={offeringTrends} margin={{ top: 5, right: isMobile ? 5 : 30, left: isMobile ? 5 : 20, bottom: 5 }}>
                      <XAxis 
                        dataKey="week" 
                        fontSize={isMobile ? 10 : 12}
                        interval={isMobile ? 'preserveStartEnd' : 0}
                      />
                      <YAxis fontSize={isMobile ? 10 : 12} />
                      <Tooltip formatter={(value) => [`₦${value.toLocaleString()}`, 'Amount']} />
                      <Legend />
                      <Bar dataKey="amount" name="Offering Amount" fill="#4CAF50" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No offering data available for {currentMonth}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>

        {/* First Timer Journey Tracking */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                First Timer Journey - {currentMonth}
              </Typography>
              {firstTimerData.length > 0 ? (
                <Box sx={{ 
                  width: '100%', 
                  height: { xs: 300, sm: 350, md: 400 },
                  overflow: 'hidden'
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={firstTimerData} margin={{ top: 5, right: isMobile ? 5 : 30, left: isMobile ? 5 : 20, bottom: 5 }}>
                      <XAxis 
                        dataKey="week" 
                        fontSize={isMobile ? 10 : 12}
                        interval={isMobile ? 'preserveStartEnd' : 0}
                      />
                      <YAxis fontSize={isMobile ? 10 : 12} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="firstTimers" name="First Timers" stackId="1" fill="#2E7D32" stroke="#2E7D32" />
                      <Area type="monotone" dataKey="followedUp" name="Followed Up" stackId="2" fill="#4CAF50" stroke="#4CAF50" />
                      <Area type="monotone" dataKey="converted" name="Converted" stackId="3" fill="#66BB6A" stroke="#66BB6A" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No first timer data available for {currentMonth}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>

        {/* Centres Card */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Supervised Centres
              </Typography>
              {centres.length > 0 ? (
                <Box sx={{ overflow: 'auto', maxHeight: { xs: 300, sm: 400 } }}>
                  <TableContainer>
                    <Table size={isMobile ? "small" : "medium"}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Centre Name</TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>Location</TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>Leader</TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Monthly Reports</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {centres.map((centre) => (
                          <TableRow key={centre._id}>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {centre.name || 'Unknown'}
                            </TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>
                              {centre.location || 'Unknown'}
                            </TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>
                              {centre.leaderName || 'TBD'}
                            </TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {reports.filter(r => r.cithCentreId?._id === centre._id).length}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ py: 3 }}>
                  No centres assigned
                </Typography>
              )}
            </CardContent>
          </Card>
        </GridItem>

        {/* Pending Reports Card */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Reports Pending Approval
              </Typography>
              {pendingReports.length > 0 ? (
                <Box sx={{ overflow: 'auto', maxHeight: { xs: 300, sm: 400 } }}>
                  <TableContainer>
                    <Table size={isMobile ? "small" : "medium"}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>CITH Centre</TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>Week</TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Attendance</TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingReports.slice(0, 5).map((report) => (
                          <TableRow key={report._id}>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {report.cithCentreId?.name || 'Unknown Centre'}
                            </TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>
                              {new Date(report.week).toLocaleDateString()}
                            </TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {(report.data?.male || 0) + (report.data?.female || 0) + (report.data?.children || 0)}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <Button
                                  startIcon={<CheckCircle />}
                                  color="success"
                                  onClick={() => handleApprove(report._id)}
                                  size="small"
                                  variant="outlined"
                                >
                                  Approve
                                </Button>
                                <Button
                                  startIcon={<Cancel />}
                                  color="error"
                                  onClick={() => handleReject(report._id)}
                                  size="small"
                                  variant="outlined"
                                >
                                  Reject
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center', py: 3 }}>
                  No pending reports
                </Typography>
              )}
            </CardContent>
          </Card>
        </GridItem>
        
        {/* Centre Performance Radar Chart - Moved to last position */}
        <GridItem xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Centre Performance Comparison - {currentMonth}
              </Typography>
              {centreComparisonData.length > 0 ? (
                <Box sx={{ 
                  width: '100%', 
                  height: { xs: 300, sm: 350, md: 400 },
                  overflow: 'hidden'
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={isMobile ? 80 : 120} data={centreComparisonData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" fontSize={isMobile ? 10 : 12} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} fontSize={isMobile ? 8 : 10} />
                      <Radar name="Attendance" dataKey="attendance" stroke="#2E7D32" fill="#2E7D32" fillOpacity={0.6} />
                      <Radar name="Offerings" dataKey="offerings" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.6} />
                      <Radar name="First Timers" dataKey="firstTimers" stroke="#66BB6A" fill="#66BB6A" fillOpacity={0.6} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No centre data available for {currentMonth}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default AreaSupervisorDashboard;