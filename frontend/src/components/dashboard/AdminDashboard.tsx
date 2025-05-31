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
  Cell
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
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [thisMonthStats, setThisMonthStats] = useState({
    reports: 0,
    members: 0
  });
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
      const [
        usersResult,
        districtsResult,
        areasResult,
        centresResult,
        reportsResult,
        summaryResult
      ] = await Promise.allSettled([
        api.get('/auth/users'),
        api.get('/districts'),
        api.get('/area-supervisors'),
        api.get('/cith-centres'),
        api.get('/reports?limit=10'),
        api.get('/reports/summary')
      ]);

      // Handle users - exclude admins from count
      if (usersResult.status === 'fulfilled') {
        const allUsers = usersResult.value.data || [];
        const nonAdminUsers = allUsers.filter((user: any) => user.role !== 'admin');
        setStats(prev => ({ ...prev, totalUsers: nonAdminUsers.length }));
        
        // Set user role distribution (excluding admins)
        type UserRole = 'cith_centre' | 'area_supervisor' | 'district_pastor';
        const roleCount = {
          cith_centre: 0,
          area_supervisor: 0,
          district_pastor: 0
        };
        
        nonAdminUsers.forEach((user: { role: UserRole }) => {
          if (roleCount.hasOwnProperty(user.role)) {
            roleCount[user.role]++;
          }
        });
        
        setUsersByRole([
          { name: 'CITH Centre Leaders', value: roleCount.cith_centre },
          { name: 'Area Supervisors', value: roleCount.area_supervisor },
          { name: 'District Pastors', value: roleCount.district_pastor }
        ]);
      }

      // Handle districts
      if (districtsResult.status === 'fulfilled') {
        const districtsData = districtsResult.value.data || [];
        setDistricts(districtsData);
        setStats(prev => ({ ...prev, totalDistricts: districtsData.length }));
      }

      // Handle area supervisors
      if (areasResult.status === 'fulfilled') {
        const areasData = areasResult.value.data || [];
        setAreaSupervisors(areasData);
        setStats(prev => ({ ...prev, totalAreaSupervisors: areasData.length }));
      }

      // Handle centres
      if (centresResult.status === 'fulfilled') {
        const centresData = centresResult.value.data || [];
        setCentres(centresData);
        setStats(prev => ({ ...prev, totalCithCentres: centresData.length }));
      }

      // Handle reports
      if (reportsResult.status === 'fulfilled') {
        const reports = reportsResult.value.data?.reports || [];
        setRecentReports(reports);
        setStats(prev => ({ ...prev, totalReports: reports.length }));
        
        // Calculate this month's stats from actual reports
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const thisMonthReports = reports.filter((report: any) => {
          const reportDate = new Date(report.week || report.createdAt);
          return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
        });
        
        const thisMonthAttendance = thisMonthReports.reduce((total: number, report: any) => {
          return total + (report.data?.male || 0) + (report.data?.female || 0) + (report.data?.children || 0);
        }, 0);
        
        setThisMonthStats({
          reports: thisMonthReports.length,
          members: thisMonthAttendance
        });
      }

      // Handle summary for totals
      if (summaryResult.status === 'fulfilled') {
        const summary = summaryResult.value.data || {};
        setStats(prev => ({
          ...prev,
          totalAttendance: (summary.totalMale || 0) + (summary.totalFemale || 0) + (summary.totalChildren || 0),
          totalOfferings: summary.totalOfferings || 0,
          totalFirstTimers: summary.totalFirstTimers || 0
        }));
      }

      // Process chart data with the fetched data
      processDistrictData(
        districtsResult.status === 'fulfilled' ? districtsResult.value.data || [] : [],
        areasResult.status === 'fulfilled' ? areasResult.value.data || [] : [],
        centresResult.status === 'fulfilled' ? centresResult.value.data || [] : []
      );

      processChartData(
        reportsResult.status === 'fulfilled' ? reportsResult.value.data?.reports || [] : []
      );

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const processDistrictData = (districts: any[], areas: any[], centres: any[]) => {
    try {
      const mockDistrictData = districts.map(district => {
        if (!district || !district.name) return null;
        
        const areasInDistrict = areas.filter(area => 
          area && area.districtId && 
          (typeof area.districtId === 'string' ? 
            area.districtId === district._id : 
            area.districtId._id === district._id)
        );

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
          attendance: 0, // Will be calculated from actual reports
          offerings: 0   // Will be calculated from actual reports
        };
      }).filter(Boolean);

      setDistrictData(mockDistrictData);
    } catch (error) {
      console.error('Error processing district data:', error);
      setDistrictData([]);
    }
  };

  const processChartData = (reports: any[]) => {
    try {
      const validReports = reports.filter(report => 
        report && 
        report.data && 
        typeof report.data === 'object'
      );

      // Process attendance data from actual reports
      if (validReports.length > 0) {
        const monthlyData: {[key: string]: any} = {};
        
        validReports.forEach(report => {
          try {
            const date = new Date(report.week || report.createdAt);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
            
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { month: monthKey, attendance: 0 };
            }
            
            monthlyData[monthKey].attendance += (report.data.male || 0) + 
              (report.data.female || 0) + (report.data.children || 0);
          } catch (err) {
            console.warn('Error processing report for attendance data:', err);
          }
        });
        
        setAttendanceData(Object.values(monthlyData));

        // Process offering data from actual reports
        const offeringMonthlyData: {[key: string]: any} = {};
        
        validReports.forEach(report => {
          try {
            const date = new Date(report.week || report.createdAt);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
            
            if (!offeringMonthlyData[monthKey]) {
              offeringMonthlyData[monthKey] = { month: monthKey, offerings: 0 };
            }
            
            offeringMonthlyData[monthKey].offerings += report.data.offerings || 0;
          } catch (err) {
            console.warn('Error processing report for offering data:', err);
          }
        });
        
        setOfferingData(Object.values(offeringMonthlyData));
      } else {
        // No reports yet, set empty data
        setAttendanceData([]);
        setOfferingData([]);
      }

    } catch (error) {
      console.error('Error processing chart data:', error);
      setAttendanceData([]);
      setOfferingData([]);
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
                {recentReports.length} Reports
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <People fontSize="small" />
              <Typography variant="body2">
                {stats.totalUsers} Users (Non-Admin)
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
                <Typography variant="caption" color="textSecondary">Excludes admins</Typography>
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
              <Typography variant="h6" gutterBottom>District Structure</Typography>
              {districtData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <ReBarChart data={districtData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="centres" fill="#ffc658" name="CITH Centres" />
                    <Bar dataKey="supervisors" fill="#82ca9d" name="Area Supervisors" />
                  </ReBarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    District structure visualization
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
              {usersByRole.length > 0 && usersByRole.some(role => role.value > 0) ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={usersByRole.filter(role => role.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {usersByRole.filter(role => role.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No users assigned to roles yet
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
                    No attendance data available yet
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
                    No offering data available yet
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
                            {report.week ? new Date(report.week).toLocaleDateString() : 'Unknown Date'}
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
                  No reports submitted yet
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

      {/* This Month Activity - Updated to show actual data */}
      <Box sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1000 }}>
        <Paper 
          elevation={6} 
          sx={{ 
            p: 2, 
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
            borderRadius: 3,
            minWidth: 200
          }}
        >
          <Typography variant="caption" color="textSecondary" gutterBottom>
            📊 This Month's Activity
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Box textAlign="center">
              <Typography variant="h6" color="primary">{thisMonthStats.reports}</Typography>
              <Typography variant="caption">Reports</Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" color="success.main">{thisMonthStats.members}</Typography>
              <Typography variant="caption">Attendance</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminDashboard;