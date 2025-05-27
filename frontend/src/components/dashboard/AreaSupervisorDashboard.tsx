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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    setError('');
    try {
      const [
        reportsResult,
        pendingResult,
        summaryResult,
        centresResult
      ] = await Promise.allSettled([
        api.get('/reports?limit=10'),
        api.get('/reports?status=pending&limit=10'),
        api.get('/reports/summary'),
        api.get('/cith-centres')
      ]);
      
      // Handle reports
      if (reportsResult.status === 'fulfilled') {
        const reportsData = reportsResult.value.data?.reports || [];
        setReports(reportsData);
      }
      
      // Handle pending reports
      if (pendingResult.status === 'fulfilled') {
        const pendingData = pendingResult.value.data?.reports || [];
        setPendingReports(pendingData);
      }
      
      // Handle summary
      if (summaryResult.status === 'fulfilled') {
        const summaryData = summaryResult.value.data || {};
        // Ensure all summary fields have default values
        setSummary({
          totalMale: summaryData.totalMale || 0,
          totalFemale: summaryData.totalFemale || 0,
          totalChildren: summaryData.totalChildren || 0,
          totalOfferings: summaryData.totalOfferings || 0,
          totalTestimonies: summaryData.totalTestimonies || 0,
          totalFirstTimers: summaryData.totalFirstTimers || 0,
          totalFirstTimersFollowedUp: summaryData.totalFirstTimersFollowedUp || 0,
          totalFirstTimersConverted: summaryData.totalFirstTimersConverted || 0,
          totalReports: summaryData.totalReports || 0,
        });
      } else {
        // Set default summary if API fails
        setSummary({
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
      // Set default values on error
      setSummary({
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
    } finally {
      setLoading(false);
    }
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
      
      const sortedAttendanceData = Object.values(weeklyData).sort((a, b) => {
        try {
          const dateA = new Date(a.week + ' 2024'); // Add year for proper sorting
          const dateB = new Date(b.week + ' 2024');
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
      
    } catch (error) {
      console.error('Error processing chart data:', error);
      // Set empty arrays as fallback
      setAttendanceData([]);
      setCentreComparisonData([]);
      setOfferingTrends([]);
    }
  };

  const handleApprove = async (reportId: string) => {
    try {
      await api.put(`/reports/${reportId}/approve`);
      fetchDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error approving report:', error);
      setError('Failed to approve report');
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
      setError('Failed to reject report');
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
                    {(summary.totalMale || 0) + (summary.totalFemale || 0) + (summary.totalChildren || 0)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip label={`M: ${summary.totalMale || 0}`} size="small" color="primary" variant="outlined" />
                    <Chip label={`F: ${summary.totalFemale || 0}`} size="small" color="secondary" variant="outlined" />
                    <Chip label={`C: ${summary.totalChildren || 0}`} size="small" color="info" variant="outlined" />
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
                  <Typography variant="h5">₦{(summary.totalOfferings || 0).toLocaleString()}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Avg: ₦{Math.round((summary.totalOfferings || 0) / Math.max(summary.totalReports || 1, 1)).toLocaleString()} per service
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
                  <Typography variant="h5">{summary.totalFirstTimers || 0}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip 
                      label={`${summary.totalFirstTimersFollowedUp || 0} followed`} 
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
                  <Typography variant="h5">{summary.totalTestimonies || 0}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Across {summary.totalReports || 0} services
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
              {attendanceData.length > 0 ? (
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
        
        {/* Centre Comparison Radar Chart */}
        <GridItem xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Centre Performance</Typography>
              {centreComparisonData.length > 0 ? (
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
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No centre data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>
        
        {/* Offerings Trend */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Offering Trends</Typography>
              {offeringTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={offeringTrends}>
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" name="Offering Amount" fill="#82ca9d" />
                  </BarChart>
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

        {/* Centres Card */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Supervised Centres</Typography>
              {centres.length > 0 ? (
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
                          <TableCell>{centre.name || 'Unknown'}</TableCell>
                          <TableCell>{centre.location || 'Unknown'}</TableCell>
                          <TableCell>{centre.leaderName || 'TBD'}</TableCell>
                          <TableCell>
                            {reports.filter(r => r.cithCentreId?._id === centre._id).length}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ py: 3 }}>
                  No centres assigned
                </Typography>
              )}
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
              {pendingReports.length > 0 ? (
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
                          <TableCell>{report.cithCentreId?.name || 'Unknown Centre'}</TableCell>
                          <TableCell>{new Date(report.week).toDateString()}</TableCell>
                          <TableCell>
                            {(report.data?.male || 0) + (report.data?.female || 0) + (report.data?.children || 0)}
                          </TableCell>
                          <TableCell>₦{(report.data?.offerings || 0).toLocaleString()}</TableCell>
                          <TableCell>{report.data?.numberOfFirstTimers || 0}</TableCell>
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
              ) : (
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