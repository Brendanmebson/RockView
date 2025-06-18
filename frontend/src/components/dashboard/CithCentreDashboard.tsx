// frontend/src/components/dashboard/CithCentreDashboard.tsx
import React, { useEffect, useState } from 'react';
import GridItem from '../common/GridItem';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { 
  Add, 
  TrendingUp, 
  People, 
  AttachMoney, 
  Assignment, 
  LocationOn, 
  Business, 
  Domain 
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
         LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import api from '../../services/api';
import { WeeklyReport, CithCentre, AreaSupervisor, District } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const CithCentreDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const darkMode = theme.palette.mode === 'dark';
  
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [centreInfo, setCentreInfo] = useState<CithCentre | null>(null);
  const [areaInfo, setAreaInfo] = useState<AreaSupervisor | null>(null);
  const [districtInfo, setDistrictInfo] = useState<District | null>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [offeringData, setOfferingData] = useState<any[]>([]);
  const [demographicData, setDemographicData] = useState<any[]>([]);
  const [firstTimerData, setFirstTimerData] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalAttendance: 0,
    totalOfferings: 0,
    totalFirstTimers: 0,
    totalReports: 0
  });
  const navigate = useNavigate();
  const { user, userCentre, userArea, userDistrict } = useAuth();

  useEffect(() => {
    fetchReports();
    
    // Set context from auth context
    if (userCentre) setCentreInfo(userCentre);
    if (userArea) setAreaInfo(userArea);
    if (userDistrict) setDistrictInfo(userDistrict);
    
    // If not available in auth context, fetch it
    if (!userCentre && user?.cithCentreId) {
      fetchUserContext();
    }
  }, [user, userCentre, userArea, userDistrict]);

  const fetchUserContext = async () => {
    if (!user || !user.cithCentreId) return;
    
    try {
      // Fetch CITH Centre info with populated relations
      const centreResponse = await api.get(`/cith-centres/${user.cithCentreId}?populate=true`);
      const centre = centreResponse.data;
      setCentreInfo(centre);
      
      // If the centre has area supervisor info, set it
      if (centre.areaSupervisorId) {
        setAreaInfo(centre.areaSupervisorId);
        
        // If the area has district info, set it
        if (centre.areaSupervisorId.districtId) {
          setDistrictInfo(centre.areaSupervisorId.districtId);
        }
      }
    } catch (error) {
      console.error("Error fetching user context:", error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Get current month's date range
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await api.get(`/reports?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}&limit=50`);
      const reports = response.data.reports;
      setReports(reports);
      
      // Process data for charts and monthly stats
      processChartData(reports);
      calculateMonthlyStats(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyStats = (reports: WeeklyReport[]) => {
    const stats = reports.reduce((acc, report) => {
      acc.totalAttendance += (report.data.male + report.data.female + report.data.children);
      acc.totalOfferings += report.data.offerings;
      acc.totalFirstTimers += report.data.numberOfFirstTimers;
      acc.totalReports += 1;
      return acc;
    }, {
      totalAttendance: 0,
      totalOfferings: 0,
      totalFirstTimers: 0,
      totalReports: 0
    });
    
    setMonthlyStats(stats);
  };

  const processChartData = (reports: WeeklyReport[]) => {
    // Sort reports by date
    const sortedReports = [...reports].sort((a, b) => 
      new Date(a.week).getTime() - new Date(b.week).getTime()
    );
    
    // Attendance data for line chart
    const attendance = sortedReports.map(report => ({
      week: new Date(report.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      male: report.data.male,
      female: report.data.female,
      children: report.data.children,
      total: report.data.male + report.data.female + report.data.children
    }));
    setAttendanceData(attendance);
    
    // Offering data for bar chart
    const offerings = sortedReports.map(report => ({
      week: new Date(report.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: report.data.offerings
    }));
    setOfferingData(offerings);
    
    // Demographic data for pie chart (current month totals)
    const totalDemographics = sortedReports.reduce((acc, report) => {
      acc.male += report.data.male;
      acc.female += report.data.female;
      acc.children += report.data.children;
      return acc;
    }, { male: 0, female: 0, children: 0 });
    
    const demographics = [
      { name: 'Male', value: totalDemographics.male },
      { name: 'Female', value: totalDemographics.female },
      { name: 'Children', value: totalDemographics.children }
    ];
    setDemographicData(demographics);
    
    // First timer data for area chart
    const firstTimers = sortedReports.map(report => ({
      week: new Date(report.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      firstTimers: report.data.numberOfFirstTimers,
      followedUp: report.data.firstTimersFollowedUp,
      converted: report.data.firstTimersConvertedToCITH
    }));
    setFirstTimerData(firstTimers);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'area_approved':
        return 'info';
      case 'district_approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
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
            <LocationOn />
            <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {centreInfo ? centreInfo.name : 'Loading...'}
            </Typography>
          </Box>
          
          {!isMobile && <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', sm: 'auto' } }}>
            <Business />
            <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {areaInfo ? areaInfo.name : 'Loading...'}
            </Typography>
          </Box>
          
          {!isMobile && <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', sm: 'auto' } }}>
            <Domain />
            <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {districtInfo ? districtInfo.name : 'Loading...'}
            </Typography>
          </Box>
          
          <Box sx={{ ml: { xs: 0, sm: 'auto' }, mt: { xs: 1, sm: 0 } }}>
            <Chip 
              label={currentMonth} 
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                fontWeight: 'bold',
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }} 
            />
          </Box>
        </Box>
      </Paper>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          CITH Centre Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/reports/new')}
          size={isMobile ? "small" : "medium"}
        >
          Submit Report
        </Button>
      </Box>

      {/* Key Metrics - Monthly Stats */}
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
                <People />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Monthly Attendance
                </Typography>
                <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  {monthlyStats.totalAttendance}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  {currentMonth}
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
                  {currentMonth}
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
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  {currentMonth}
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
                bgcolor: darkMode ? '#E57373' : '#D32F2F', 
                mr: 2,
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 }
              }}>
                <Assignment />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Reports Submitted
                </Typography>
                <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  {monthlyStats.totalReports}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  {currentMonth}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Attendance Trend Line Chart - Made Wider */}
        <GridItem xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Monthly Attendance Trends
              </Typography>
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
                    <Line type="monotone" dataKey="male" name="Male" stroke="#8884d8" activeDot={{ r: isMobile ? 4 : 8 }} />
                    <Line type="monotone" dataKey="female" name="Female" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="children" name="Children" stroke="#ffc658" />
                    <Line type="monotone" dataKey="total" name="Total" stroke="#ff7300" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* Demographic Pie Chart - Made Larger */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Monthly Demographics Distribution
              </Typography>
              <Box sx={{ 
                width: '100%', 
                height: { xs: 300, sm: 350, md: 400 },
                overflow: 'hidden'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={demographicData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={!isMobile ? ({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)` : false}
                      outerRadius={isMobile ? 100 : 120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {demographicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* Offerings Bar Chart */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Weekly Offering Trends
              </Typography>
              <Box sx={{ 
                width: '100%', 
                height: { xs: 300, sm: 350, md: 400 },
                overflow: 'hidden'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={offeringData} margin={{ top: 5, right: isMobile ? 5 : 30, left: isMobile ? 5 : 20, bottom: 5 }}>
                    <XAxis 
                      dataKey="week" 
                      fontSize={isMobile ? 10 : 12}
                      interval={isMobile ? 'preserveStartEnd' : 0}
                    />
                    <YAxis fontSize={isMobile ? 10 : 12} />
                    <Tooltip formatter={(value) => [`₦${value.toLocaleString()}`, 'Amount']} />
                    <Legend />
                    <Bar dataKey="amount" name="Offering Amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* First Timer Conversion Funnel */}
        <GridItem xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                First Timer Journey Tracking
              </Typography>
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
                    <Area type="monotone" dataKey="firstTimers" name="First Timers" stackId="1" fill="#8884d8" stroke="#8884d8" />
                    <Area type="monotone" dataKey="followedUp" name="Followed Up" stackId="2" fill="#82ca9d" stroke="#82ca9d" />
                    <Area type="monotone" dataKey="converted" name="Converted" stackId="3" fill="#ffc658" stroke="#ffc658" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* Recent Reports Table */}
        <GridItem xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Recent Reports ({currentMonth})
              </Typography>
              <Box sx={{ overflow: 'auto' }}>
                <TableContainer>
                  <Table size={isMobile ? "small" : "medium"}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Week</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Status</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Total Attendance</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Offerings</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>First Timers</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report._id}>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {new Date(report.week).toDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={report.status.replace('_', ' ').toUpperCase()}
                              color={getStatusColor(report.status)}
                              size="small"
                              sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {report.data.male + report.data.female + report.data.children}
                          </TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            ₦{report.data.offerings.toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>
                            {report.data.numberOfFirstTimers}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => navigate(`/reports/${report._id}`)}
                              variant="outlined"
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              {reports.length === 0 && !loading && (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 3 }}>
                  No reports found for {currentMonth}. Submit your first report to see data.
                </Typography>
              )}
            </CardContent>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default CithCentreDashboard;