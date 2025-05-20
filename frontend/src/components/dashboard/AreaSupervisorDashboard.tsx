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
} from '@mui/material';
import { CheckCircle, Cancel, PeopleAlt, AttachMoney, TrendingUp, Assessment } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
         LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, 
         PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import api from '../../services/api';
import { WeeklyReport, ReportSummary, CithCentre } from '../../types';
import { useNavigate } from 'react-router-dom';

const AreaSupervisorDashboard: React.FC = () => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [pendingReports, setPendingReports] = useState<WeeklyReport[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [centres, setCentres] = useState<CithCentre[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [centreComparisonData, setCentreComparisonData] = useState<any[]>([]);
  const [offeringTrends, setOfferingTrends] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [reportsResponse, pendingResponse, summaryResponse, centresResponse] = await Promise.all([
        api.get('/reports?limit=10'),
        api.get('/reports?status=pending&limit=10'),
        api.get('/reports/summary'),
        api.get('/cith-centres')
      ]);
      
      setReports(reportsResponse.data.reports);
      setPendingReports(pendingResponse.data.reports);
      setSummary(summaryResponse.data);
      setCentres(centresResponse.data);
      
      // Process data for charts
      processChartData(reportsResponse.data.reports, centresResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (reports: WeeklyReport[], centres: CithCentre[]) => {
    // Group reports by week for attendance trends
    const weeklyData: {[key: string]: any} = {};
    reports.forEach(report => {
      const week = new Date(report.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!weeklyData[week]) {
        weeklyData[week] = { week, male: 0, female: 0, children: 0, total: 0 };
      }
      weeklyData[week].male += report.data.male;
      weeklyData[week].female += report.data.female;
      weeklyData[week].children += report.data.children;
      weeklyData[week].total += report.data.male + report.data.female + report.data.children;
    });
    
    setAttendanceData(Object.values(weeklyData).sort((a, b) => {
      const dateA = new Date(a.week);
      const dateB = new Date(b.week);
      return dateA.getTime() - dateB.getTime();
    }));
    
    // Centre comparison data for radar chart
    const centreData: {[key: string]: any} = {};
    centres.forEach(centre => {
      centreData[centre._id] = { 
        name: centre.name, 
        attendance: 0, 
        offerings: 0, 
        firstTimers: 0,
        testimonies: 0
      };
    });
    
    reports.forEach(report => {
      const centreId = report.cithCentreId._id;
      if (centreData[centreId]) {
        centreData[centreId].attendance += report.data.male + report.data.female + report.data.children;
        centreData[centreId].offerings += report.data.offerings;
        centreData[centreId].firstTimers += report.data.numberOfFirstTimers;
        centreData[centreId].testimonies += report.data.numberOfTestimonies;
      }
    });
    
    setCentreComparisonData(Object.values(centreData));
    
    // Offering trends
    const offeringData: {[key: string]: any} = {};
    reports.forEach(report => {
      const week = new Date(report.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!offeringData[week]) {
        offeringData[week] = { week, amount: 0 };
      }
      offeringData[week].amount += report.data.offerings;
    });
    
    setOfferingTrends(Object.values(offeringData).sort((a, b) => {
      const dateA = new Date(a.week);
      const dateB = new Date(b.week);
      return dateA.getTime() - dateB.getTime();
    }));
  };

  const handleApprove = async (reportId: string) => {
    try {
      await api.put(`/reports/${reportId}/approve`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error approving report:', error);
    }
  };

  const handleReject = async (reportId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;
    
    try {
      await api.put(`/reports/${reportId}/reject`, { reason });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting report:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Area Supervisor Dashboard
      </Typography>

      {/* Summary Stats Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <GridItem xs={12} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <PeopleAlt />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="textSecondary">Total Attendance</Typography>
                  <Typography variant="h5">
                    {summary.totalMale + summary.totalFemale + summary.totalChildren}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip label={`M: ${summary.totalMale}`} size="small" color="primary" variant="outlined" />
                    <Chip label={`F: ${summary.totalFemale}`} size="small" color="secondary" variant="outlined" />
                    <Chip label={`C: ${summary.totalChildren}`} size="small" color="info" variant="outlined" />
                  </Box>
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
                  <Typography variant="body2" color="textSecondary">Total Offerings</Typography>
                  <Typography variant="h5">${summary.totalOfferings}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Avg: ${Math.round(summary.totalOfferings / (summary.totalReports || 1))} per service
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
                  <Typography variant="h5">{summary.totalFirstTimers}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip 
                      label={`${summary.totalFirstTimersFollowedUp} followed`} 
                      size="small" 
                      color="success" 
                      variant="outlined" 
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </GridItem>
          <GridItem xs={12} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Assessment />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="textSecondary">Testimonies</Typography>
                  <Typography variant="h5">{summary.totalTestimonies}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Across {summary.totalReports} services
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </GridItem>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Attendance Trends Chart */}
        <GridItem xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Area Attendance Trends</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceData}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="male" name="Male" stroke="#8884d8" />
                  <Line type="monotone" dataKey="female" name="Female" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="children" name="Children" stroke="#ffc658" />
                  <Line type="monotone" dataKey="total" name="Total" stroke="#ff7300" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* Centre Comparison Radar Chart */}
        <GridItem xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Centre Performance</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart outerRadius={90} data={centreComparisonData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                  <Radar name="Attendance" dataKey="attendance" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Offerings" dataKey="offerings" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Radar name="First Timers" dataKey="firstTimers" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </GridItem>
        
        {/* Offerings Trend */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Offering Trends</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={offeringTrends}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" name="Offering Amount" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </GridItem>

        {/* Centres Card */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Supervised Centres</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Centre Name</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Leader</TableCell>
                      <TableCell>Reports</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {centres.map((centre) => (
                      <TableRow key={centre._id}>
                        <TableCell>{centre.name}</TableCell>
                        <TableCell>{centre.location}</TableCell>
                        <TableCell>{centre.leaderName}</TableCell>
                        <TableCell>
                          {reports.filter(r => r.cithCentreId._id === centre._id).length}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </GridItem>

        {/* Pending Reports Card */}
        <GridItem xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Reports for Approval
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>CITH Centre</TableCell>
                      <TableCell>Week</TableCell>
                      <TableCell>Total Attendance</TableCell>
                      <TableCell>Offerings</TableCell>
                      <TableCell>First Timers</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingReports.map((report) => (
                      <TableRow key={report._id}>
                        <TableCell>{report.cithCentreId.name}</TableCell>
                        <TableCell>{new Date(report.week).toDateString()}</TableCell>
                        <TableCell>
                          {report.data.male + report.data.female + report.data.children}
                        </TableCell>
                        <TableCell>${report.data.offerings}</TableCell>
                        <TableCell>{report.data.numberOfFirstTimers}</TableCell>
                        <TableCell>
                          <Button
                            startIcon={<CheckCircle />}
                            color="success"
                            onClick={() => handleApprove(report._id)}
                            sx={{ mr: 1 }}
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {pendingReports.length === 0 && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center', py: 3 }}>
                  No pending reports
                </Typography>
              )}
            </CardContent>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default AreaSupervisorDashboard;