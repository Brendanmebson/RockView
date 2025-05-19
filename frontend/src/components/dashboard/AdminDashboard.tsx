import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
} from '@mui/material';
import { People, Business, Home, BarChart } from '@mui/icons-material';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDistricts: 0,
    totalAreaSupervisors: 0,
    totalCithCentres: 0,
    totalReports: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // This would need to be implemented in the backend
      // For now, we'll use placeholder data
      setStats({
        totalUsers: 50,
        totalDistricts: 6,
        totalAreaSupervisors: 24,
        totalCithCentres: 96,
        totalReports: 500,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/users')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6">Total Users</Typography>
                  <Typography variant="h4">{stats.totalUsers}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/districts')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Business sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6">Districts</Typography>
                  <Typography variant="h4">{stats.totalDistricts}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/area-supervisors')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Home sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6">Area Supervisors</Typography>
                  <Typography variant="h4">{stats.totalAreaSupervisors}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/cith-centres')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Home sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6">CITH Centres</Typography>
                  <Typography variant="h4">{stats.totalCithCentres}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/reports')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BarChart sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6">Total Reports</Typography>
                  <Typography variant="h4">{stats.totalReports}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
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
                >
                  Manage Districts
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/area-supervisors')}
                  fullWidth
                >
                  Manage Area Supervisors
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/cith-centres')}
                  fullWidth
                >
                  Manage CITH Centres
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/users')}
                  fullWidth
                >
                  Manage Users
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;