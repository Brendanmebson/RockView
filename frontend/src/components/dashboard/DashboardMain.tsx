import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import CithCentreDashboard from './CithCentreDashboard';
import AreaSupervisorDashboard from './AreaSupervisorDashboard';
import ZonalSupervisorDashboard from './ZonalSupervisorDashboard';
import DistrictPastorDashboard from './DistrictPastorDashboard';
import AdminDashboard from './AdminDashboard';
import { Box, CircularProgress, Typography } from '@mui/material';

const DashboardMain: React.FC = () => {
  const { user, loading } = useAuth();
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      // Small delay to ensure all context is loaded
      setTimeout(() => {
        setDashboardLoading(false);
      }, 500);
    }
  }, [loading, user]);

  if (loading || dashboardLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        gap: 2
      }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="textSecondary">
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  if (!user) return null;

  switch (user.role) {
    case 'cith_centre':
      return <CithCentreDashboard />;
    case 'area_supervisor':
      return <AreaSupervisorDashboard />;
    case 'zonal_supervisor':
      return <ZonalSupervisorDashboard />;
    case 'district_pastor':
      return <DistrictPastorDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Invalid user role: {user.role}
          </Typography>
        </Box>
      );
  }
};

export default DashboardMain;