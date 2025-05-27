// frontend/src/components/dashboard/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import GridItem from '../common/GridItem';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { 
  People, 
  Business, 
  Home, 
  BarChart, 
  PeopleAlt, 
  AttachMoney, 
  TrendingUp, 
  AccountTree,
  Map,
  LocationCity
} from '@mui/icons-material';
import { 
  BarChart as ReBarChart, 
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
  Treemap, 
  Scatter,
  ScatterChart,
  CartesianGrid,
  ZAxis
} from 'recharts';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { District, AreaSupervisor, CithCentre } from '../../types';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDistricts: 0,
    totalAreaSupervisors: 0,
    totalCithCentres: 0,
    totalReports: 0,
    totalAttendance: 0,
    totalOfferings: 0,
    totalFirstTimers: 0,
  });
  const [districts, setDistricts] = useState<District[]>([]);
  const [areaSupervisors, setAreaSupervisors] = useState<AreaSupervisor[]>([]);
  const [centres, setCentres] = useState<CithCentre[]>([]);
  const [districtData, setDistrictData] = useState<any[]>([]);
  const [usersByRole, setUsersByRole] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [offeringData, setOfferingData] = useState<any[]>([]);
  const [centrePerformanceData, setCentrePerformanceData] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all data concurrently with error handling for each
      const [
        statsResult,
        districtsResult,
        areasResult,
        centresResult,
        reportsResult
      ] = await Promise.allSettled([
        fetchStats(),
        api.get('/districts'),
        api.get('/area-supervisors'),
        api.get('/cith-centres'),
        api.get('/reports?limit=10')
      ]);

      // Handle districts
      if (districtsResult.status === 'fulfilled') {
        setDistricts(districtsResult.value.data || []);
      }

      // Handle area supervisors
      if (areasResult.status === 'fulfilled') {
        setAreaSupervisors(areasResult.value.data || []);
      }

      // Handle centres
      if (centresResult.status === 'fulfilled') {
        setCentres(centresResult.value.data || []);
      }

      // Handle reports
      if (reportsResult.status === 'fulfilled') {
        const reports = reportsResult.value.data?.reports || [];
        setRecentReports(reports);
        processChartData(reports);
      }

      // Process chart data with the fetched data
      processDistrictData(
        districtsResult.status === 'fulfilled' ? districtsResult.value.data || [] : [],
        areasResult.status === 'fulfilled' ? areasResult.value.data || [] : [],
        centresResult.status === 'fulfilled' ? centresResult.value.data || [] : []
      );

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // In a real implementation, you'd have endpoints for these stats
      // For now, using mock data
      setStats({
        totalUsers: 50,
        totalDistricts: 6,
        totalAreaSupervisors: 24,
        totalCithCentres: 96,
        totalReports: 500,
        totalAttendance: 12500,
        totalOfferings: 25000,
        totalFirstTimers: 350,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const processDistrictData = (districts: any[], areas: any[], centres: any[]) => {
    try {
      // Safely process district data
      const mockDistrictData = districts.map(district => {
        if (!district || !district.name) return null;
        
        // Count areas in this district
        const areasInDistrict = areas.filter(area => 
          area && area.districtId && 
          (typeof area.districtId === 'string' ? 
            area.districtId === district._id : 
            area.districtId._id === district._id)
        );

        // Count centres in this district
        const centresInDistrict = centres.filter(centre => {
          if (!centre || !centre.areaSupervisorId) return false;
          
          const areaSupervisorId = typeof centre.areaSupervisorId === 'string' ? 
            centre.areaSupervisorId : 
            centre.areaSupervisorId._id;
            
          return areasInDistrict.some(area => area && area._id === areaSupervisorId);
        });

        return {
          name: district.name,
          centres: centresInDistrict.length,
          supervisors: areasInDistrict.length,
          attendance: Math.floor(Math.random() * 1000) + 2000, // Mock data
          offerings: Math.floor(Math.random() * 2000) + 4000 // Mock data
        };
      }).filter(Boolean); // Remove null entries

      setDistrictData(mockDistrictData);
    } catch (error) {
      console.error('Error processing district data:', error);
      setDistrictData([]);
    }
  };

  const processChartData = (reports: any[]) => {
    try {
      // Safely process reports data
      const validReports = reports.filter(report => 
        report && 
        report.data && 
        typeof report.data === 'object'
      );

      // Set user role distribution
      setUsersByRole([
        { name: 'CITH Centre Leaders', value: 96 },
        { name: 'Area Supervisors', value: 24 },
        { name: 'District Pastors', value: 6 },
        { name: 'Administrators', value: 4 }
      ]);

      // Process attendance data
      const mockAttendanceData = [
        { month: 'Jan', attendance: 8500 },
        { month: 'Feb', attendance: 9200 },
        { month: 'Mar', attendance: 9800 },
        { month: 'Apr', attendance: 10300 },
        { month: 'May', attendance: 11000 },
        { month: 'Jun', attendance: 10500 },
        { month: 'Jul', attendance: 11200 },
        { month: 'Aug', attendance: 11800 },
        { month: 'Sep', attendance: 12300 },
        { month: 'Oct', attendance: 12500 }
      ];
      setAttendanceData(mockAttendanceData);

      // Process offering data
      const mockOfferingData = [
        { month: 'Jan', offerings: 17000 },
        { month: 'Feb', offerings: 18400 },
        { month: 'Mar', offerings: 19600 },
        { month: 'Apr', offerings: 20600 },
        { month: 'May', offerings: 22000 },
        { month: 'Jun', offerings: 21000 },
        { month: 'Jul', offerings: 22400 },
        { month: 'Aug', offerings: 23600 },
        { month: 'Sep', offerings: 24600 },
        { month: 'Oct', offerings: 25000 }
      ];
      setOfferingData(mockOfferingData);

      // Process centre performance data
      const mockCentrePerformance = [
        { name: 'Agric Ojo', attendance: 120, offerings: 240, firstTimers: 5, district: 'Festac' },
        { name: 'FHA Satellite', attendance: 150, offerings: 300, firstTimers: 7, district: 'Festac' },
        { name: 'Community Road', attendance: 80, offerings: 160, firstTimers: 3, district: 'Festac' },
        { name: 'Ikeja GRA', attendance: 200, offerings: 400, firstTimers: 10, district: 'Ikeja' },
        { name: 'Allen Avenue', attendance: 180, offerings: 360, firstTimers: 8, district: 'Ikeja' },
        { name: 'Lekki Phase 1', attendance: 250, offerings: 500, firstTimers: 12, district: 'Lekki' },
        { name: 'Chevron Drive', attendance: 220, offerings: 440, firstTimers: 11, district: 'Lekki' },
        { name: 'Ajah', attendance: 170, offerings: 340, firstTimers: 6, district: 'Lekki' },
        { name: 'Adeniran Ogunsanya', attendance: 130, offerings: 260, firstTimers: 5, district: 'Surulere' },
        { name: 'Adelabu', attendance: 110, offerings: 220, firstTimers: 4, district: 'Surulere' }
      ];
      setCentrePerformanceData(mockCentrePerformance);

    } catch (error) {
      console.error('Error processing chart data:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button onClick={fetchDashboardData} variant="contained">
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Organization Overview */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 3, 
          background: 'linear-gradient(90deg, #4A5568 0%, #2D3748 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Church Organization Overview
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationCity fontSize="small" />
              <Typography variant="body2">
                {districts.length} Districts
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Map fontSize="small" />
              <Typography variant="body2">
                {areaSupervisors.length} Areas
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Home fontSize="small" />
              <Typography variant="body2">
                {centres.length} CITH Centres
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChart fontSize="small" />
              <Typography variant="body2">
                {stats.totalReports} Reports
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <People fontSize="small" />
              <Typography variant="body2">
                {stats.totalUsers} Users
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Summary stats cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <GridItem xs={12} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/users')}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <PeopleAlt />
              </Avatar>
              <Box>
                <Typography variant="body2" color="textSecondary">Total Users</Typography>
                <Typography variant="h5">{stats.totalUsers}</Typography>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        <GridItem xs={12} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/districts')}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                <Business />
              </Avatar>
              <Box>
                <Typography variant="body2" color="textSecondary">Districts</Typography>
                <Typography variant="h5">{stats.totalDistricts}</Typography>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        <GridItem xs={12} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/area-supervisors')}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                <AccountTree />
              </Avatar>
              <Box>
                <Typography variant="body2" color="textSecondary">Area Supervisors</Typography>
                <Typography variant="h5">{stats.totalAreaSupervisors}</Typography>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        <GridItem xs={12} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/cith-centres')}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                <Home />
              </Avatar>
              <Box>
                <Typography variant="body2" color="textSecondary">CITH Centres</Typography>
                <Typography variant="h5">{stats.totalCithCentres}</Typography>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>

      <Grid container spacing={3}>
        {/* District Performance Comparison */}
        <GridItem xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>District Performance</Typography>
              {districtData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <ReBarChart data={districtData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="attendance" fill="#8884d8" name="Attendance" />
                    <Bar dataKey="offerings" fill="#82ca9d" name="Offerings" />
                    <Bar dataKey="centres" fill="#ffc658" name="Centres" />
                  </ReBarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No district data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>
        
        {/* System User Distribution */}
        <GridItem xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>User Distribution</Typography>
              {usersByRole.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={usersByRole}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {usersByRole.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No user data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>

        {/* Attendance Growth Trend */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Attendance Growth Trend</Typography>
              {attendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="attendance" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No attendance data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>

        {/* Offering Growth Trend */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Offering Growth Trend</Typography>
              {offeringData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={offeringData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="offerings" stroke="#82ca9d" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No offering data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>

        {/* Centre Performance Scatter Plot */}
        <GridItem xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Centre Performance Analysis</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Bubble size represents number of first timers
              </Typography>
              {centrePerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="attendance" name="Attendance" unit=" people" />
                    <YAxis type="number" dataKey="offerings" name="Offerings" unit=" $" />
                    <ZAxis type="number" dataKey="firstTimers" range={[40, 160]} name="First Timers" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Scatter 
                      name="Festac District" 
                      data={centrePerformanceData.filter(d => d.district === 'Festac')} 
                      fill="#8884d8" 
                    />
                    <Scatter 
                      name="Ikeja District" 
                      data={centrePerformanceData.filter(d => d.district === 'Ikeja')} 
                      fill="#82ca9d" 
                    />
                    <Scatter 
                      name="Lekki District" 
                      data={centrePerformanceData.filter(d => d.district === 'Lekki')} 
                      fill="#ffc658" 
                    />
                    <Scatter 
                      name="Surulere District" 
                      data={centrePerformanceData.filter(d => d.district === 'Surulere')} 
                      fill="#ff7300" 
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No performance data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>

        {/* Quick Action Links */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/districts')}
                  fullWidth
                  startIcon={<Business />}
                >
                  Manage Districts
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/area-supervisors')}
                  fullWidth
                  startIcon={<AccountTree />}
                >
                  Manage Area Supervisors
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/cith-centres')}
                  fullWidth
                  startIcon={<Home />}
                >
                  Manage CITH Centres
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/users')}
                  fullWidth
                  startIcon={<People />}
                >
                  Manage Users
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/reports')}
                  fullWidth
                  startIcon={<BarChart />}
                >
                  View All Reports
                </Button>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* Recent Reports */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Reports</Typography>
              {recentReports.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Centre</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Attendance</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentReports.slice(0, 5).map((report) => (
                        <TableRow key={report._id}>
                          <TableCell>
                            {report.cithCentreId?.name || 'Unknown Centre'}
                          </TableCell>
                          <TableCell>
                            {new Date(report.week).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {(report.data?.male || 0) + (report.data?.female || 0) + (report.data?.children || 0)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={report.status.replace('_', ' ').toUpperCase()}
                              color={
                                report.status === 'district_approved' 
                                  ? 'success' 
                                  : report.status === 'area_approved' 
                                  ? 'info' 
                                  : report.status === 'pending' 
                                  ? 'warning' 
                                  : 'error'
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ py: 2 }}>
                  No recent reports available
                </Typography>
              )}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="text" 
                  onClick={() => navigate('/reports')}
                  size="small"
                >
                  View All Reports
                </Button>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;