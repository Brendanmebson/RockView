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
} from '@mui/material';
import { 
  People, 
  Business, 
  Home, 
  BarChart, 
  PeopleAlt, 
  AttachMoney, 
  TrendingUp, 
  AccountTree 
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
  Sankey,
  Scatter,
  ScatterChart,
  CartesianGrid,
  ZAxis
} from 'recharts';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

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
  const [districtData, setDistrictData] = useState<any[]>([]);
  const [usersByRole, setUsersByRole] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [offeringData, setOfferingData] = useState<any[]>([]);
  const [centrePerformanceData, setCentrePerformanceData] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchChartData();
  }, []);

  const fetchStats = async () => {
    try {
      // This would need to be implemented in the backend
      // For demo purposes, using simulated data
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

  const fetchChartData = async () => {
    setLoading(true);
    try {
      // Fetch data for charts
      const [districtsResponse, reportsResponse, usersResponse] = await Promise.all([
        api.get('/districts'),
        api.get('/reports?limit=10'),
        api.get('/users') // This endpoint would need to be implemented
      ]);
      
      const districts = districtsResponse.data;
      const reports = reportsResponse.data.reports;
      
      // Simulate user data by role if the endpoint doesn't exist
      const mockUsersByRole = [
        { name: 'CITH Centre Leaders', value: 96 },
        { name: 'Area Supervisors', value: 24 },
        { name: 'District Pastors', value: 6 },
        { name: 'Administrators', value: 4 }
      ];
      setUsersByRole(mockUsersByRole);
      
      // Process district data (would be fetched in real implementation)
      const mockDistrictData = [
        { name: 'Festac', centres: 17, supervisors: 4, attendance: 3500, offerings: 7000 },
        { name: 'Ikeja', centres: 15, supervisors: 4, attendance: 2800, offerings: 5600 },
        { name: 'Lekki', centres: 20, supervisors: 5, attendance: 4200, offerings: 8400 },
        { name: 'Surulere', centres: 14, supervisors: 3, attendance: 2100, offerings: 4200 },
        { name: 'Victoria Island', centres: 18, supervisors: 5, attendance: 3800, offerings: 7600 },
        { name: 'Yaba', centres: 12, supervisors: 3, attendance: 1800, offerings: 3600 }
      ];
      setDistrictData(mockDistrictData);
      
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
      
      // Process centre performance data (attendance vs offerings)
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
      
      // Set recent reports
      setRecentReports(reports);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Summary stats cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <GridItem xs={12} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/users')}>
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
            </CardContent>
          </Card>
        </GridItem>
        
        {/* System User Distribution */}
        <GridItem xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>User Distribution</Typography>
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
            </CardContent>
          </Card>
        </GridItem>

        {/* Attendance Growth Trend */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Attendance Growth Trend</Typography>
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
            </CardContent>
          </Card>
        </GridItem>

        {/* Offering Growth Trend */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Offering Growth Trend</Typography>
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
                  onClick={() => navigate('/users')}
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
                        <TableCell>{report.cithCentreId.name}</TableCell>
                        <TableCell>{new Date(report.week).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {report.data.male + report.data.female + report.data.children}
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
              {recentReports.length === 0 && (
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