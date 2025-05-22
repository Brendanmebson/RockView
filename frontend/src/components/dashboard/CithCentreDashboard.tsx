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
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [centreInfo, setCentreInfo] = useState<CithCentre | null>(null);
  const [areaInfo, setAreaInfo] = useState<AreaSupervisor | null>(null);
  const [districtInfo, setDistrictInfo] = useState<District | null>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [offeringData, setOfferingData] = useState<any[]>([]);
  const [demographicData, setDemographicData] = useState<any[]>([]);
  const [firstTimerData, setFirstTimerData] = useState<any[]>([]);
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
      const response = await api.get('/reports?limit=10');
      const reports = response.data.reports;
      setReports(reports);
      
      // Process data for charts
      processChartData(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
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
    
    // Demographic data for pie chart
    if (sortedReports.length > 0) {
      const latestReport = sortedReports[sortedReports.length - 1];
      const demographics = [
        { name: 'Male', value: latestReport.data.male },
        { name: 'Female', value: latestReport.data.female },
        { name: 'Children', value: latestReport.data.children }
      ];
      setDemographicData(demographics);
    }
    
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

  return (
    <Box>
      {/* Context Banner */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn />
            <Typography variant="subtitle1">
              {centreInfo ? centreInfo.name : 'Loading...'}
            </Typography>
          </Box>
          
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business />
            <Typography variant="subtitle1">
              {areaInfo ? areaInfo.name : 'Loading...'}
            </Typography>
          </Box>
          
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Domain />
            <Typography variant="subtitle1">
              {districtInfo ? districtInfo.name : 'Loading...'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">CITH Centre Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/reports/new')}
        >
          Submit Report
        </Button>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <GridItem xs={12} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <People />
              </Avatar>
              <Box>
                <Typography variant="body2" color="textSecondary">Total Attendance</Typography>
                <Typography variant="h5">
                  {reports.length > 0 ? 
                    reports[0].data.male + reports[0].data.female + reports[0].data.children 
                    : 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        <GridItem xs={12} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                <AttachMoney />
              </Avatar>
              <Box>
                <Typography variant="body2" color="textSecondary">Offerings</Typography>
                <Typography variant="h5">
                  ${reports.length > 0 ? reports[0].data.offerings : 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        <GridItem xs={12} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography variant="body2" color="textSecondary">First Timers</Typography>
                <Typography variant="h5">
                  {reports.length > 0 ? reports[0].data.numberOfFirstTimers : 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
        <GridItem xs={12} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                <Assignment />
              </Avatar>
              <Box>
                <Typography variant="body2" color="textSecondary">Reports</Typography>
                <Typography variant="h5">{reports.length}</Typography>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Attendance Trend Line Chart */}
        <GridItem xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Attendance Trends</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceData}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="male" name="Male" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="female" name="Female" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="children" name="Children" stroke="#ffc658" />
                  <Line type="monotone" dataKey="total" name="Total" stroke="#ff7300" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* Demographic Pie Chart */}
        <GridItem xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Demographics</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={demographicData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {demographicData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* Offerings Bar Chart */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Offering Trends</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={offeringData}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" name="Offering Amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* First Timer Conversion Funnel */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>First Timer Conversion</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={firstTimerData}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="firstTimers" name="First Timers" stackId="1" fill="#8884d8" stroke="#8884d8" />
                  <Area type="monotone" dataKey="followedUp" name="Followed Up" stackId="2" fill="#82ca9d" stroke="#82ca9d" />
                  <Area type="monotone" dataKey="converted" name="Converted" stackId="3" fill="#ffc658" stroke="#ffc658" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* Recent Reports Table */}
        <GridItem xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Reports
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Week</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Total Attendance</TableCell>
                      <TableCell>Offerings</TableCell>
                      <TableCell>First Timers</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report._id}>
                        <TableCell>
                          {new Date(report.week).toDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={report.status.replace('_', ' ').toUpperCase()}
                            color={getStatusColor(report.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {report.data.male + report.data.female + report.data.children}
                        </TableCell>
                        <TableCell>${report.data.offerings}</TableCell>
                        <TableCell>{report.data.numberOfFirstTimers}</TableCell>
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
              {reports.length === 0 && !loading && (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 3 }}>
                  No reports found. Submit your first report to see data.
                </Typography>
              )}
              {loading && (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 3 }}>
                  Loading reports...
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