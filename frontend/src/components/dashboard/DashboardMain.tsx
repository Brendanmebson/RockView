import React from 'react';
import { useAuth } from '../../context/AuthContext';
import CithCentreDashboard from './CithCentreDashboard';
import AreaSupervisorDashboard from './AreaSupervisorDashboard';
import DistrictPastorDashboard from './DistrictPastorDashboard';
import AdminDashboard from './AdminDashboard';

const DashboardMain: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'cith_centre':
      return <CithCentreDashboard />;
    case 'area_supervisor':
      return <AreaSupervisorDashboard />;
    case 'district_pastor':
      return <DistrictPastorDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <div>Invalid role</div>;
  }
};

export default DashboardMain;