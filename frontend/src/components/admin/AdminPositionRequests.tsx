// frontend/src/components/dashboard/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  People as Users,
  Business,
  Home,
  AssignmentInd,
  Dashboard as DashboardIcon,
  Add,
  SupervisorAccount,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GridItem from '../common/GridItem';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDistricts: 0,
    assignedDistricts: 0,
    totalZonalSupervisors: 0,
    assignedZonals: 0,
    totalAreaSupervisors: 0,
    assignedAreas: 0,
    totalCithCentres: 0,
    assignedCentres: 0,
    usersByRole: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [userStats, districts, zonalSupervisors, areaSupervisors, cithCentres] = await Promise.all([
        api.get('/users/stats'),
        api.get('/districts'),
        api.get('/zonal-supervisors'),
        api.get('/area-supervisors'),
        api.get('/cith-centres'),
      ]);

      // Calculate assigned positions
      const assignedDistricts = userStats.data.byRole.find((r: any) => r._id === 'district_pastor')?.count || 0;
      const assignedZonals = userStats.data.byRole.find((r: any) => r._id === 'zonal_supervisor')?.count || 0;
      const assignedAreas = userStats.data.byRole.find((r: any) => r._id === 'area_supervisor')?.count || 0;
      const assignedCentres = userStats.data.byRole.find((r: any) => r._id === 'cith_centre')?.count || 0;

      setStats({
        totalUsers: userStats.data.total,
        activeUsers: userStats.data.active,
        totalDistricts: districts.data.length,
        assignedDistricts,
        totalZonalSupervisors: zonalSupervisors.data.length,
        assignedZonals,
        totalAreaSupervisors: areaSupervisors.data.length,
        assignedAreas,
        totalCithCentres: cithCentres.data.length,
        assignedCentres,
        usersByRole: userStats.data.byRole,
      });
    } catch (error: any) {
      setError('Failed to load dashboard statistics');
      console.error('Dashboard stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'district_pastor': return 'District Pastors';
      case 'zonal_supervisor': return 'Zonal Supervisors';
      case 'area_supervisor': return 'Area Supervisors';
      case 'cith_centre': return 'CITH Centre Leaders';
      case 'admin': return 'Administrators';
      default: return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <DashboardIcon color="primary" />
        <Typography variant="h4">Admin Dashboard</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* User Statistics */}
        <GridItem xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Users color="primary" />
                <Box>
                  <Typography variant="h4">{stats.totalUsers}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Users ({stats.activeUsers} active)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </GridItem>

        {/* Districts */}
        <GridItem xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Business color="secondary" />
                <Box>
                  <Typography variant="h4">{stats.totalDistricts}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Districts ({stats.assignedDistricts} assigned)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </GridItem>

        {/* Zonal Supervisors */}
        <GridItem xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SupervisorAccount color="info" />
                <Box>
                  <Typography variant="h4">{stats.totalZonalSupervisors}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Zones ({stats.assignedZonals} assigned)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </GridItem>

        {/* Area Supervisors */}
        <GridItem xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssignmentInd color="warning" />
                <Box>
                  <Typography variant="h4">{stats.totalAreaSupervisors}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Areas ({stats.assignedAreas} assigned)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </GridItem>

        {/* User Roles Breakdown */}
        <GridItem xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>User Roles Overview</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {stats.usersByRole.map((role) => (
                  <Chip
                    key={role._id}
                    label={`${getRoleDisplayName(role._id)}: ${role.count}`}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </GridItem>

        {/* Organization Overview */}
        <GridItem xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Organization Structure</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business fontSize="small" />
                  <Typography variant="body2">
                    {stats.assignedDistricts}/{stats.totalDistricts} Districts Assigned
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SupervisorAccount fontSize="small" />
                  <Typography variant="body2">
                    {stats.assignedZonals}/{stats.totalZonalSupervisors} Zones Assigned
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentInd fontSize="small" />
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
              </Box>
            </CardContent>
          </Card>
        </GridItem>

        {/* Quick Actions */}
        <GridItem xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick Actions</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/users')}
                    fullWidth
                    startIcon={<Users />}
                  >
                    Manage Users
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/districts')}
                    fullWidth
                    startIcon={<Business />}
                  >
                    Manage Districts
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/zonal-supervisors')}
                    fullWidth
                    startIcon={<SupervisorAccount />}
                  >
                    Manage Zonal Supervisors
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/area-supervisors')}
                    fullWidth
                    startIcon={<AssignmentInd />}
                  >
                    Manage Area Supervisors
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/cith-centres')}
                    fullWidth
                    startIcon={<Home />}
                  >
                    Manage CITH Centres
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/users/create')}
                    fullWidth
                    startIcon={<Add />}
                  >
                    Add New User
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;