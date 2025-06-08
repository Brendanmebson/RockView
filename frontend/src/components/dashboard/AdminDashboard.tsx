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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip as MuiTooltip,
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
  LocationCity,
  CheckCircle,
  Cancel,
  Assignment,
  PersonAdd,
  Visibility,
  ManageAccounts,
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

interface PositionRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  currentRole: string;
  newRole: string;
  targetId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  rejectionReason?: string;
  targetEntityName?: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDistricts: 0,
    totalAreaSupervisors: 0,
    totalCithCentres: 0,
    assignedDistricts: 0,
    assignedAreas: 0,
    assignedCentres: 0,
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
  const [positionRequests, setPositionRequests] = useState<PositionRequest[]>([]);
  const [thisMonthStats, setThisMonthStats] = useState({
    reports: 0,
    members: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PositionRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
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
        summaryResult,
        positionRequestsResult
      ] = await Promise.allSettled([
        api.get('/auth/users'),
        api.get('/districts'),
        api.get('/area-supervisors'),
        api.get('/cith-centres'),
        api.get('/reports?limit=10'),
        api.get('/reports/summary'),
        api.get('/auth/position-change-requests')
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

      // Handle districts with assignment info
      if (districtsResult.status === 'fulfilled') {
        const districtsData = districtsResult.value.data || [];
        setDistricts(districtsData);
        const assignedCount = districtsData.filter((d: any) => d.isAssigned).length;
        setStats(prev => ({ 
          ...prev, 
          totalDistricts: districtsData.length,
          assignedDistricts: assignedCount
        }));
      }

      // Handle area supervisors with assignment info
      if (areasResult.status === 'fulfilled') {
        const areasData = areasResult.value.data || [];
        setAreaSupervisors(areasData);
        const assignedCount = areasData.filter((a: any) => a.isAssigned).length;
        setStats(prev => ({ 
          ...prev, 
          totalAreaSupervisors: areasData.length,
          assignedAreas: assignedCount
        }));
      }

      // Handle centres with assignment info
      if (centresResult.status === 'fulfilled') {
        const centresData = centresResult.value.data || [];
        setCentres(centresData);
        const assignedCount = centresData.filter((c: any) => c.isAssigned).length;
        setStats(prev => ({ 
          ...prev, 
          totalCithCentres: centresData.length,
          assignedCentres: assignedCount
        }));
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

      // Handle position requests
      if (positionRequestsResult.status === 'fulfilled') {
        const requests = positionRequestsResult.value.data || [];
        const requestsWithEntityNames = await Promise.all(
          requests.map(async (request: PositionRequest) => {
            let targetEntityName = 'Unknown';
            try {
              if (request.newRole === 'district_pastor') {
                const districtResponse = await api.get(`/districts/${request.targetId}`);
                targetEntityName = districtResponse.data.name;
              } else if (request.newRole === 'area_supervisor') {
                const areaResponse = await api.get(`/area-supervisors/${request.targetId}`);
                targetEntityName = areaResponse.data.name;
              } else if (request.newRole === 'cith_centre') {
                const centreResponse = await api.get(`/cith-centres/${request.targetId}`);
                targetEntityName = centreResponse.data.name;
              }
            } catch {
              // Keep default 'Unknown' if fetch fails
            }
            return { ...request, targetEntityName };
          })
        );
        setPositionRequests(requestsWithEntityNames);
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
          assigned: district.isAssigned ? 1 : 0,
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

  const handleApproveRequest = async (requestId: string) => {
    try {
      await api.put(`/auth/position-change-requests/${requestId}/approve`);
      setSuccess('Position change request approved successfully');
      fetchDashboardData(); // Refresh data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      await api.put(`/auth/position-change-requests/${selectedRequest._id}/reject`, {
        reason: rejectionReason
      });
      
      setSuccess('Position change request rejected');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchDashboardData(); // Refresh data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const openRejectDialog = (request: PositionRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'approved':
        return <Chip label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'cith_centre':
        return 'CITH Centre Leader';
      case 'area_supervisor':
        return 'Area Supervisor';
      case 'district_pastor':
        return 'District Pastor';
      case 'admin':
        return 'Administrator';
      default:
        return role;
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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

  const pendingRequests = positionRequests.filter(req => req.status === 'pending');

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
                {stats.assignedDistricts}/{stats.totalDistricts} Districts Assigned
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Map fontSize="small" />
              <Typography variant="body2">
                {stats.assignedAreas}/{stats.totalAreaSupervisors} Areas Assigned
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Home fontSize="small" />
              <Typography variant="body2">
                {stats.assignedCentres}/{stats.totalCithCentres} Centres Assigned
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
                {stats.totalUsers} Active Users
              </Typography>
            </Box>

            {pendingRequests.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assignment fontSize="small" />
                <Typography variant="body2">
                  {pendingRequests.length} Pending Requests
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {/* Position Change Requests Section */}
      {pendingRequests.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ManageAccounts color="primary" />
              <Typography variant="h6">Pending Position Change Requests</Typography>
              <Chip label={pendingRequests.length} color="warning" size="small" />
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Current Role</TableCell>
                    <TableCell>Requested Role</TableCell>
                    <TableCell>Target Position</TableCell>
                    <TableCell>Date Requested</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {request.userId.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {request.userId.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{getRoleName(request.currentRole)}</TableCell>
                      <TableCell>{getRoleName(request.newRole)}</TableCell>
                      <TableCell>{request.targetEntityName || 'Loading...'}</TableCell>
                      <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <MuiTooltip title="Approve Request">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApproveRequest(request._id)}
                            >
                              <CheckCircle />
                            </IconButton>
                          </MuiTooltip>
                          <MuiTooltip title="Reject Request">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openRejectDialog(request)}
                            >
                              <Cancel />
                            </IconButton>
                          </MuiTooltip>
                          <MuiTooltip title="View Details">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate('/admin/position-requests')}
                            >
                              <Visibility />
                            </IconButton>
                          </MuiTooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/admin/position-requests')}
                startIcon={<ManageAccounts />}
              >
                Manage All Requests
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

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
                <Typography variant="caption" color="textSecondary">
                  {stats.assignedDistricts} Assigned
                </Typography>
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
                <Typography variant="caption" color="textSecondary">
                  {stats.assignedAreas} Assigned
                </Typography>
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
                <Typography variant="caption" color="textSecondary">
                  {stats.assignedCentres} Assigned
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>

      <Grid container spacing={3}>
        {/* District Performance Comparison - Make full width */}
        <GridItem xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>District Structure & Assignment</Typography>
              {districtData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ReBarChart data={districtData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="centres" fill="#ffc658" name="CITH Centres" />
                    <Bar dataKey="supervisors" fill="#82ca9d" name="Area Supervisors" />
                    <Bar dataKey="assigned" fill="#8884d8" name="Pastor Assigned" />
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
        
        {/* System User Distribution - Make larger */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>User Distribution</Typography>
              {usersByRole.length > 0 && usersByRole.some(role => role.value > 0) ? (
                <ResponsiveContainer width="100%" height={450}>
                  <PieChart>
                    <Pie
                      data={usersByRole.filter(role => role.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={140}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {usersByRole.filter(role => role.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
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
                  Manage Districts ({stats.assignedDistricts}/{stats.totalDistricts} Assigned)
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/area-supervisors')}
                  fullWidth
                  startIcon={<AccountTree />}
                >
                  Manage Area Supervisors ({stats.assignedAreas}/{stats.totalAreaSupervisors} Assigned)
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/cith-centres')}
                  fullWidth
                  startIcon={<Home />}
                >
                  Manage CITH Centres ({stats.assignedCentres}/{stats.totalCithCentres} Assigned)
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/users')}
                  fullWidth
                  startIcon={<People />}
                >
                  Manage Users ({stats.totalUsers} Active)
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/position-requests')}
                  fullWidth
                  startIcon={<ManageAccounts />}
                  color={pendingRequests.length > 0 ? 'warning' : 'primary'}
                >
                  Position Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
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
        <GridItem xs={12}>
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

     {/* Rejection Dialog */}
     <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
       <DialogTitle>Reject Position Change Request</DialogTitle>
       <DialogContent>
         <Typography sx={{ mb: 2 }}>
           Please provide a reason for rejecting this position change request:
         </Typography>
         <TextField
           autoFocus
           margin="dense"
           label="Reason for Rejection"
           fullWidth
           multiline
           rows={3}
           value={rejectionReason}
           onChange={(e) => setRejectionReason(e.target.value)}
         />
       </DialogContent>
       <DialogActions>
         <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
         <Button 
           onClick={handleRejectRequest} 
           color="error"
           disabled={!rejectionReason.trim()}
         >
           Reject Request
         </Button>
       </DialogActions>
     </Dialog>

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