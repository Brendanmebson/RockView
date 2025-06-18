// frontend/src/components/dashboard/ZonalSupervisorDashboard.tsx
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
  Paper,
  CircularProgress,
  Alert,
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
  Domain 
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
         LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, 
         PolarAngleAxis, PolarRadiusAxis, ComposedChart, Area } from 'recharts';
import api from '../../services/api';
import { WeeklyReport, ReportSummary, CithCentre, AreaSupervisor, ZonalSupervisor, District } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ZonalSupervisorDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const darkMode = theme.palette.mode === 'dark';
  
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [pendingReports, setPendingReports] = useState<WeeklyReport[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [zonalInfo, setZonalInfo] = useState<ZonalSupervisor | null>(null);
  const [districtInfo, setDistrictInfo] = useState<District | null>(null);
  const [areaSupervisors, setAreaSupervisors] = useState<AreaSupervisor[]>([]);
  const [centres, setCentres] = useState<CithCentre[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [areaComparisonData, setAreaComparisonData] = useState<any[]>([]);
  const [offeringTrends, setOfferingTrends] = useState<any[]>([]);
  const [firstTimerConversion, setFirstTimerConversion] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    fetchUserContext();
  }, [user]);

  const fetchUserContext = async () => {
    if (!user || !user.zonalSupervisorId) return;
    
    try {
      // Fetch Zonal Supervisor info
      const zonalResponse = await api.get(`/zonal-supervisors/${user.zonalSupervisorId}`);
      setZonalInfo(zonalResponse.data);
      
      // Fetch District info
      if (zonalResponse.data.districtId) {
        const districtResponse = await api.get(`/districts/${zonalResponse.data.districtId}`);
        setDistrictInfo(districtResponse.data);
      }
      
      // Fetch Area Supervisors under this zonal supervisor
      const areasResponse = await api.get(`/area-supervisors`);
      const myAreas = areasResponse.data.filter((area: AreaSupervisor) => 
        zonalResponse.data.areaSupervisorIds.includes(area._id)
      );
      setAreaSupervisors(myAreas);
      
      // Fetch all centres under these areas
      if (myAreas.length > 0) {
        const areaIds = myAreas.map((area: AreaSupervisor) => area._id).join(',');
        const centresResponse = await api.get(`/cith-centres?areaSupervisorIds=${areaIds}`);
        setCentres(centresResponse.data);
      }
    } catch (error) {
      console.error("Error fetching user context:", error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get current month's date range
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const [
        reportsResult,
        pendingResult,
        summaryResult
      ] = await Promise.allSettled([
        api.get(`/reports?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}&limit=100`),
        api.get('/reports?status=area_approved&limit=10'),
        api.get('/reports/summary')
      ]);
      
      // Handle reports
      if (reportsResult.status === 'fulfilled') {
        const reportsData = reportsResult.value.data?.reports || [];
        setReports(reportsData);
        processChartData(reportsData);
      }
      
      // Handle pending reports
      if (pendingResult.status === 'fulfilled') {
        const pendingData = pendingResult.value.data?.reports || [];
        setPendingReports(pendingData);
      }
      
      // Handle summary
      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value.data);
      }
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (reports: WeeklyReport[]) => {
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
            weeklyData[week] = { 
              week, 
              male: 0, 
              female: 0, 
              children: 0, 
              total: 0,
              offerings: 0,
              firstTimers: 0 
            };
          }
          weeklyData[week].male += report.data.male || 0;
          weeklyData[week].female += report.data.female || 0;
          weeklyData[week].children += report.data.children || 0;
          weeklyData[week].total += (report.data.male || 0) + (report.data.female || 0) + (report.data.children || 0);
          weeklyData[week].offerings += report.data.offerings || 0;
          weeklyData[week].firstTimers += report.data.numberOfFirstTimers || 0;
        } catch (err) {
          console.warn('Error processing report for week data:', err);
        }
      });
      
      const sortedAttendanceData = Object.values(weeklyData).sort((a, b) => {
        try {
          const dateA = new Date(a.week + ' 2024');
          const dateB = new Date(b.week + ' 2024');
          return dateA.getTime() - dateB.getTime();
        } catch (err) {
          return 0;
        }
      });
      
      setAttendanceData(sortedAttendanceData);
      
      // Area comparison data for radar chart
      const areaData: {[key: string]: any} = {};
      areaSupervisors.forEach(area => {
        if (area && area._id && area.name) {
          areaData[area._id] = { 
            name: area.name, 
            attendance: 0, 
            offerings: 0, 
            firstTimers: 0,
            testimonies: 0,
            centres: 0
          };
        }
      });
      
      // Map centres to areas
      const centresToArea: {[key: string]: string} = {};
      centres.forEach(centre => {
        if (centre.areaSupervisorId && typeof centre.areaSupervisorId === 'object') {
          centresToArea[centre._id] = centre.areaSupervisorId._id;
          if (areaData[centre.areaSupervisorId._id]) {
            areaData[centre.areaSupervisorId._id].centres++;
          }
        }
      });
      
      validReports.forEach(report => {
        try {
          const centreId = report.cithCentreId?._id;
          const areaId = centresToArea[centreId];
          
          if (areaData[areaId]) {
            areaData[areaId].attendance += (report.data.male || 0) + (report.data.female || 0) + (report.data.children || 0);
            areaData[areaId].offerings += report.data.offerings || 0;
            areaData[areaId].firstTimers += report.data.numberOfFirstTimers || 0;
            areaData[areaId].testimonies += report.data.numberOfTestimonies || 0;
          }
        } catch (err) {
          console.warn('Error processing report for area data:', err);
        }
      });
      
      setAreaComparisonData(Object.values(areaData));
      
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
      
      const sortedOfferingData = Object.values(offeringData).sort((a, b) => {
        try {
          const dateA = new Date(a.week + ' 2024');
          const dateB = new Date(b.week + ' 2024');
          return dateA.getTime() - dateB.getTime();
        } catch (err) {
          return 0;
        }
      });
      
      setOfferingTrends(sortedOfferingData);
      
      // First timer conversion data
      const conversionData: {[key: string]: any} = {};
      validReports.forEach(report => {
        try {
          const week = new Date(report.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!conversionData[week]) {
            conversionData[week] = { 
              week, 
              firstTimers: 0, 
              followedUp: 0, 
              converted: 0 
            };
          }
          conversionData[week].firstTimers += report.data.numberOfFirstTimers || 0;
          conversionData[week].followedUp += report.data.firstTimersFollowedUp || 0;
          conversionData[week].converted += report.data.firstTimersConvertedToCITH || 0;
        } catch (err) {
          console.warn('Error processing report for conversion data:', err);
        }
      });
      
      const sortedConversionData = Object.values(conversionData).sort((a, b) => {
        try {
          const dateA = new Date(a.week + ' 2024');
          const dateB = new Date(b.week + ' 2024');
          return dateA.getTime() - dateB.getTime();
        } catch (err) {
          return 0;
        }
      });
      
      setFirstTimerConversion(sortedConversionData);
      
    } catch (error) {
      console.error('Error processing chart data:', error);
      // Set empty arrays as fallback
      setAttendanceData([]);
      setAreaComparisonData([]);
      setOfferingTrends([]);
      setFirstTimerConversion([]);
    }
  };

  const handleApprove = async (reportId: string) => {
    try {
      await api.put(`/reports/${reportId}/approve`);
      fetchDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error approving report:', error);
    }
  };

  const handleReject = async (reportId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;
    
    try {
      await api.put(`/reports/${reportId}/reject`, { reason });
      fetchDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error rejecting report:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
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
          background: 'linear-gradient(90deg, #4A5568 0%, #2D3748 100%)',
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
              {zonalInfo ? zonalInfo.name : 'Loading...'}
            </Typography>
          </Box>
          
          {!isMobile && <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', sm: 'auto' } }}>
            <Domain />
            <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {districtInfo ? districtInfo.name : 'Loading...'}
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
              label={`${areaSupervisors.length} Areas`} 
              size="small" 
              sx={{ 
                bgcolor: 'secondary.main', 
                color: 'white',
                '& .MuiChip-label': { fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.75rem' } }
              }} 
            />
            <Chip 
              label={`${centres.length} CITH Centres`} 
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
        Zonal Supervisor Dashboard - {currentMonth}
      </Typography>

      {/* Summary Statistics */}
      {summary && (
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
                    {summary.totalMale + summary.totalFemale + summary.totalChildren}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={`M: ${summary.totalMale}`} size="small" color="primary" variant="outlined" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }} />
                    <Chip label={`F: ${summary.totalFemale}`} size="small" color="secondary" variant="outlined" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }} />
                    <Chip label={`C: ${summary.totalChildren}`} size="small" color="info" variant="outlined" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }} />
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
                    ₦{summary.totalOfferings.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    From {summary.totalReports} services
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
                    {summary.totalFirstTimers}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`${summary.totalFirstTimersConverted} Converted`} 
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
                    {summary.totalTestimonies}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Across {areaSupervisors.length} areas
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </GridItem>
        </Grid>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Zone Attendance Trends Chart - Made Wider */}
        <GridItem xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Zone Attendance Trends - {currentMonth}
              </Typography>
              {attendanceData.length > 0 ? (
                <Box sx={{ 
                  width: '100%', 
                  height: { xs: 300, sm: 350, md: 400 },
                  overflow: 'hidden'
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={attendanceData} margin={{ top: 5, right: isMobile ? 5 : 30, left: isMobile ? 5 : 20, bottom: 5 }}>
                      <XAxis 
                        dataKey="week" 
                        fontSize={isMobile ? 10 : 12}
                        interval={isMobile ? 'preserveStartEnd' : 0}
                      />
                      <YAxis yAxisId="left" fontSize={isMobile ? 10 : 12} />
                      <YAxis yAxisId="right" orientation="right" fontSize={isMobile ? 10 : 12} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="total" name="Total Attendance" fill="#8884d8" />
                      <Line yAxisId="right" type="monotone" dataKey="offerings" name="Offerings" stroke="#82ca9d" />
                      <Area yAxisId="left" type="monotone" dataKey="firstTimers" name="First Timers" fill="#ffc658" stroke="#ffc658" />
                    </ComposedChart>
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
        
        {/* Area Performance Comparison */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Area Performance Comparison - {currentMonth}
              </Typography>
              {areaComparisonData.length > 0 ? (
                <Box sx={{ 
                  width: '100%', 
                  height: { xs: 300, sm: 350, md: 400 },
                  overflow: 'hidden'
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={isMobile ? 80 : 120} data={areaComparisonData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" fontSize={isMobile ? 10 : 12} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} fontSize={isMobile ? 8 : 10} />
                      <Radar name="Attendance" dataKey="attendance" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Radar name="Offerings" dataKey="offerings" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                      <Radar name="First Timers" dataKey="firstTimers" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No area data available for {currentMonth}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>
        
        {/* First Timer Conversion Funnel */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                First Timer Conversion Journey - {currentMonth}
              </Typography>
              {firstTimerConversion.length > 0 ? (
                <Box sx={{ 
                  width: '100%', 
                  height: { xs: 300, sm: 350, md: 400 },
                  overflow: 'hidden'
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={firstTimerConversion} margin={{ top: 5, right: isMobile ? 5 : 30, left: isMobile ? 5 : 20, bottom: 5 }}>
                      <XAxis 
                        dataKey="week" 
                        fontSize={isMobile ? 10 : 12}
                        interval={isMobile ? 'preserveStartEnd' : 0}
                      />
                      <YAxis fontSize={isMobile ? 10 : 12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="firstTimers" name="First Timers" fill="#8884d8" />
                      <Bar dataKey="followedUp" name="Followed Up" fill="#82ca9d" />
                      <Bar dataKey="converted" name="Converted" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No conversion data available for {currentMonth}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>

        {/* Area Supervisors Card */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Supervised Areas
              </Typography>
              {areaSupervisors.length > 0 ? (
                <Box sx={{ overflow: 'auto', maxHeight: { xs: 300, sm: 400 } }}>
                  <TableContainer>
                    <Table size={isMobile ? "small" : "medium"}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Area Name</TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>Supervisor</TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>CITH Centres</TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>Monthly Reports</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {areaSupervisors.map((area) => (
                          <TableRow key={area._id}>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {area.name || 'Unknown'}
                            </TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>
                              {area.supervisorName || 'TBD'}
                            </TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {centres.filter(c => 
                                typeof c.areaSupervisorId === 'object' 
                                  ? c.areaSupervisorId._id === area._id 
                                  : c.areaSupervisorId === area._id
                              ).length}
                            </TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>
                              {reports.filter(r => {
                                const centreAreaId = typeof r.cithCentreId?.areaSupervisorId === 'object'
                                  ? r.cithCentreId.areaSupervisorId._id
                                  : r.cithCentreId?.areaSupervisorId;
                                return centreAreaId === area._id;
                              }).length}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ py: 3 }}>
                  No areas assigned
                </Typography>
              )}
            </CardContent>
          </Card>
        </GridItem>

        {/* Pending Reports for Zonal Approval */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Reports for Zonal Approval
              </Typography>
              {pendingReports.length > 0 ? (
                <Box sx={{ overflow: 'auto', maxHeight: { xs: 300, sm: 400 } }}>
                  <TableContainer>
                    <Table size={isMobile ? "small" : "medium"}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>CITH Centre</TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>Area</TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>Week</TableCell>
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
                              {typeof report.cithCentreId?.areaSupervisorId === 'object' && report.cithCentreId.areaSupervisorId?.name 
                                ? report.cithCentreId.areaSupervisorId.name 
                                : 'Unknown'}
                            </TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>
                              {new Date(report.week).toDateString()}
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
                  No reports pending zonal approval
                </Typography>
              )}
            </CardContent>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default ZonalSupervisorDashboard;