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
  useTheme,
  useMediaQuery,
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
  Group,
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
import { District, AreaSupervisor, ZonalSupervisor, CithCentre } from '../../types';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const darkMode = theme.palette.mode === 'dark';
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDistricts: 0,
    totalZonalSupervisors: 0,
    totalAreaSupervisors: 0,
    totalCithCentres: 0,
    assignedDistricts: 0,
    assignedZonals: 0,
    assignedAreas: 0,
    assignedCentres: 0,
    totalReports: 0,
    totalAttendance: 0,
    totalOfferings: 0,
    totalFirstTimers: 0,
  });
  const [districts, setDistricts] = useState<District[]>([]);
  const [zonalSupervisors, setZonalSupervisors] = useState<ZonalSupervisor[]>([]);
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
        zonalResult,
        areasResult,
        centresResult,
        reportsResult,
        summaryResult,
        positionRequestsResult
      ] = await Promise.allSettled([
        api.get('/auth/users'),
        api.get('/districts'),
        api.get('/zonal-supervisors'),
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
        type UserRole = 'cith_centre' | 'area_supervisor' | 'zonal_supervisor' | 'district_pastor';
        const roleCount = {
          cith_centre: 0,
          area_supervisor: 0,
          zonal_supervisor: 0,
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
          { name: 'Zonal Supervisors', value: roleCount.zonal_supervisor },
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

      // Handle zonal supervisors with assignment info
      if (zonalResult.status === 'fulfilled') {
        const zonalData = zonalResult.value.data || [];
        setZonalSupervisors(zonalData);
        const assignedCount = zonalData.filter((z: any) => z.isAssigned).length;
        setStats(prev => ({ 
          ...prev, 
          totalZonalSupervisors: zonalData.length,
          assignedZonals: assignedCount
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
              } else if (request.newRole === 'zonal_supervisor') {
                const zonalResponse = await api.get(`/zonal-supervisors/${request.targetId}`);
                targetEntityName = zonalResponse.data.name;
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
        zonalResult.status === 'fulfilled' ? zonalResult.value.data || [] : [],
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

  const processDistrictData = (districts: any[], zonals: any[], areas: any[], centres: any[]) => {
    try {
      const mockDistrictData = districts.map(district => {
        if (!district || !district.name) return null;
        
        const zonalsInDistrict = zonals.filter(zonal => 
          zonal && zonal.districtId && 
          (typeof zonal.districtId === 'string' ? 
            zonal.districtId === district._id : 
            zonal.districtId._id === district._id)
        );

        const areasInDistrict = areas.filter(area => {
          if (!area || !area.zonalSupervisorId) return false;
          
          const zonalSupervisorId = typeof area.zonalSupervisorId === 'string' ? 
            area.zonalSupervisorId : 
            area.zonalSupervisorId._id;
            
          return zonalsInDistrict.some(zonal => zonal && zonal._id === zonalSupervisorId);
        });

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
         areas: areasInDistrict.length,
         zonals: zonalsInDistrict.length,
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
     case 'zonal_supervisor':
       return 'Zonal Supervisor';
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
   <Box sx={{ 
     width: '100%', 
     maxWidth: '100%',
     overflow: 'hidden',
     px: { xs: 0, sm: 0 }
   }}>
     {/* Organization Overview */}
     <Paper 
       elevation={3} 
       sx={{ 
         p: { xs: 1.5, sm: 2 },
         mb: 3, 
         background: 'linear-gradient(90deg, #4A5568 0%, #2D3748 100%)',
         color: 'white',
         borderRadius: 2,
         mx: { xs: 0, sm: 0 },
       }}
     >
       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
         <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
           Church Organization Overview
         </Typography>
         
         <Box sx={{ 
           display: 'flex', 
           flexWrap: 'wrap', 
           gap: { xs: 2, sm: 3 },
           justifyContent: { xs: 'space-between', sm: 'flex-start' }
         }}>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', sm: 'auto' } }}>
             <LocationCity fontSize="small" />
             <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
               {stats.assignedDistricts}/{stats.totalDistricts} Districts Assigned
             </Typography>
           </Box>
           
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', sm: 'auto' } }}>
             <Group fontSize="small" />
             <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
               {stats.assignedZonals}/{stats.totalZonalSupervisors} Zones Assigned
             </Typography>
           </Box>
           
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', sm: 'auto' } }}>
             <Map fontSize="small" />
             <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
               {stats.assignedAreas}/{stats.totalAreaSupervisors} Areas Assigned
             </Typography>
           </Box>
           
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', sm: 'auto' } }}>
             <Home fontSize="small" />
             <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
               {stats.assignedCentres}/{stats.totalCithCentres} Centres Assigned
             </Typography>
           </Box>
           
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', sm: 'auto' } }}>
             <BarChart fontSize="small" />
             <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
               {recentReports.length} Reports
             </Typography>
           </Box>
           
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', sm: 'auto' } }}>
             <People fontSize="small" />
             <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
               {stats.totalUsers} Active Users
             </Typography>
           </Box>

           {pendingRequests.length > 0 && (
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', sm: 'auto' } }}>
               <Assignment fontSize="small" />
               <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                 {pendingRequests.length} Pending Requests
               </Typography>
             </Box>
           )}
         </Box>
       </Box>
     </Paper>

     <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
       Admin Dashboard
     </Typography>

     {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

     {/* Position Change Requests Section */}
     {pendingRequests.length > 0 && (
       <Card sx={{ mb: 3 }}>
         <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
             <ManageAccounts color="primary" />
             <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
               Pending Position Change Requests
             </Typography>
             <Chip label={pendingRequests.length} color="warning" size="small" />
           </Box>
           
           <Box sx={{ overflow: 'auto' }}>
             <TableContainer>
               <Table size={isMobile ? "small" : "medium"}>
                 <TableHead>
                   <TableRow>
                     <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>User</TableCell>
                     <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Current Role</TableCell>
                     <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Requested Role</TableCell>
                     <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>Target Position</TableCell>
                     <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>Date Requested</TableCell>
                     <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {pendingRequests.map((request) => (
                     <TableRow key={request._id}>
                       <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                         <Box>
                           <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                             {request.userId.name}
                           </Typography>
                           <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                             {request.userId.email}
                           </Typography>
                         </Box>
                       </TableCell>
                       <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                         {getRoleName(request.currentRole)}
                       </TableCell>
                       <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                         {getRoleName(request.newRole)}
                       </TableCell>
                       <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>
                         {request.targetEntityName || 'Loading...'}
                       </TableCell>
                       <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>
                         {new Date(request.createdAt).toLocaleDateString()}
                       </TableCell>
                       <TableCell>
                         <Box sx={{ display: 'flex', gap: 0.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                           <MuiTooltip title="Approve Request">
                             <IconButton
                               size="small"
                               color="success"
                               onClick={() => handleApproveRequest(request._id)}
                             >
                               <CheckCircle fontSize="small" />
                             </IconButton>
                           </MuiTooltip>
                           <MuiTooltip title="Reject Request">
                             <IconButton
                               size="small"
                               color="error"
                               onClick={() => openRejectDialog(request)}
                             >
                               <Cancel fontSize="small" />
                             </IconButton>
                           </MuiTooltip>
                           <MuiTooltip title="View Details">
                             <IconButton
                               size="small"
                               color="primary"
                               onClick={() => navigate('/admin/position-requests')}
                             >
                               <Visibility fontSize="small" />
                             </IconButton>
                           </MuiTooltip>
                         </Box>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </TableContainer>
           </Box>
           
           <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
             <Button
               variant="outlined"
               onClick={() => navigate('/admin/position-requests')}
               startIcon={<ManageAccounts />}
               size={isMobile ? "small" : "medium"}
             >
               Manage All Requests
             </Button>
           </Box>
         </CardContent>
       </Card>
     )}

     {/* Summary stats cards */}
     <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
       <GridItem xs={12} sm={6} md={3}>
         <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={() => navigate('/admin/users')}>
           <CardContent sx={{ 
             display: 'flex', 
             alignItems: 'center',
             p: { xs: 2, sm: 3 },
             '&:last-child': { pb: { xs: 2, sm: 3 } }
           }}>
             <Avatar sx={{ 
               bgcolor: darkMode ? '#64B5F6' : '#1976D2', 
               mr: 2,
               width: { xs: 40, sm: 48 },
               height: { xs: 40, sm: 48 }
             }}>
               <PeopleAlt />
             </Avatar>
             <Box sx={{ minWidth: 0, flex: 1 }}>
               <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                 Total Users
               </Typography>
               <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                 {stats.totalUsers}
               </Typography>
               <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                 Excludes admins
               </Typography>
             </Box>
           </CardContent>
         </Card>
       </GridItem>
       
       <GridItem xs={12} sm={6} md={3}>
         <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={() => navigate('/districts')}>
           <CardContent sx={{ 
             display: 'flex', 
             alignItems: 'center',
             p: { xs: 2, sm: 3 },
             '&:last-child': { pb: { xs: 2, sm: 3 } }
           }}>
             <Avatar sx={{ 
               bgcolor: darkMode ? '#E57373' : '#D32F2F', 
               mr: 2,
               width: { xs: 40, sm: 48 },
               height: { xs: 40, sm: 48 }
             }}>
               <Business />
             </Avatar>
             <Box sx={{ minWidth: 0, flex: 1 }}>
               <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                 Districts
               </Typography>
               <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                 {stats.totalDistricts}
               </Typography>
               <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                 {stats.assignedDistricts} Assigned
               </Typography>
             </Box>
           </CardContent>
         </Card>
       </GridItem>
       
       <GridItem xs={12} sm={6} md={3}>
         <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={() => navigate('/zonal-supervisors')}>
           <CardContent sx={{ 
             display: 'flex', 
             alignItems: 'center',
             p: { xs: 2, sm: 3 },
             '&:last-child': { pb: { xs: 2, sm: 3 } }
           }}>
             <Avatar sx={{ 
               bgcolor: darkMode ? '#BA68C8' : '#7B1FA2', 
               mr: 2,
               width: { xs: 40, sm: 48 },
               height: { xs: 40, sm: 48 }
             }}>
               <Group />
             </Avatar>
             <Box sx={{ minWidth: 0, flex: 1 }}>
               <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                 Zonal Supervisors
               </Typography>
               <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                 {stats.totalZonalSupervisors}
               </Typography>
               <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                 {stats.assignedZonals} Assigned
               </Typography>
             </Box>
           </CardContent>
         </Card>
       </GridItem>
       
       <GridItem xs={12} sm={6} md={3}>
         <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={() => navigate('/area-supervisors')}>
           <CardContent sx={{ 
             display: 'flex', 
             alignItems: 'center',
             p: { xs: 2, sm: 3 },
             '&:last-child': { pb: { xs: 2, sm: 3 } }
           }}>
             <Avatar sx={{ 
               bgcolor: darkMode ? '#4FC3F7' : '#0288D1', 
               mr: 2,
               width: { xs: 40, sm: 48 },
               height: { xs: 40, sm: 48 }
             }}>
               <AccountTree />
             </Avatar>
             <Box sx={{ minWidth: 0, flex: 1 }}>
               <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                 Area Supervisors
               </Typography>
               <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                 {stats.totalAreaSupervisors}
               </Typography>
               <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                 {stats.assignedAreas} Assigned
               </Typography>
             </Box>
           </CardContent>
         </Card>
       </GridItem>
     </Grid>

     <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
       <GridItem xs={12} md={6}>
         <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={() => navigate('/cith-centres')}>
           <CardContent sx={{ 
             display: 'flex', 
             alignItems: 'center',
             p: { xs: 2, sm: 3 },
             '&:last-child': { pb: { xs: 2, sm: 3 } }
           }}>
             <Avatar sx={{ 
               bgcolor: darkMode ? '#FFD54F' : '#FFA000', 
               mr: 2,
               width: { xs: 40, sm: 48 },
               height: { xs: 40, sm: 48 }
             }}>
               <Home />
             </Avatar>
             <Box sx={{ minWidth: 0, flex: 1 }}>
               <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                 CITH Centres
               </Typography>
               <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                 {stats.totalCithCentres}
               </Typography>
               <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                 {stats.assignedCentres} Assigned
               </Typography>
             </Box>
           </CardContent>
         </Card>
       </GridItem>
     </Grid>

     <Grid container spacing={{ xs: 2, sm: 3 }}>
       {/* District Performance Comparison - Full width with responsive height */}
       <GridItem xs={12}>
         <Card>
           <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
             <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
               District Structure & Assignment
             </Typography>
             {districtData.length > 0 ? (
               <Box sx={{ 
                 width: '100%', 
                 height: { xs: 300, sm: 350, md: 400 },
                 overflow: 'hidden'
               }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <ReBarChart data={districtData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                     <XAxis 
                       dataKey="name" 
                       fontSize={isMobile ? 10 : 12}
                       interval={0}
                       angle={isMobile ? -45 : 0}
                       textAnchor={isMobile ? 'end' : 'middle'}
                       height={isMobile ? 60 : 30}
                     />
                     <YAxis fontSize={isMobile ? 10 : 12} />
                     <Tooltip />
                     <Legend />
                     <Bar dataKey="centres" fill="#ffc658" name="CITH Centres" />
                     <Bar dataKey="areas" fill="#82ca9d" name="Area Supervisors" />
                     <Bar dataKey="zonals" fill="#8dd1e1" name="Zonal Supervisors" />
                     <Bar dataKey="assigned" fill="#8884d8" name="Pastor Assigned" />
                   </ReBarChart>
                 </ResponsiveContainer>
               </Box>
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
       <GridItem xs={12} md={6}>
         <Card>
           <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
             <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
               User Distribution
             </Typography>
             {usersByRole.length > 0 && usersByRole.some(role => role.value > 0) ? (
               <Box sx={{ 
                 width: '100%', 
                 height: { xs: 350, sm: 400, md: 450 },
                 overflow: 'hidden'
               }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={usersByRole.filter(role => role.value > 0)}
                       cx="50%"
                       cy="50%"
                       labelLine={false}
                       label={!isMobile ? ({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)` : false}
                       outerRadius={isMobile ? 100 : 140}
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
               </Box>
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

       {/* Reports Status Overview */}
       <GridItem xs={12} md={6}>
         <Card>
           <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
             <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
               Reports Status Overview
             </Typography>
             {recentReports.length > 0 ? (
               <Box sx={{ 
                 width: '100%',
                 height: { xs: 300, sm: 350, md: 400 },
                 overflow: 'hidden'
               }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={[
                         { 
                           name: 'Pending', 
                           value: recentReports.filter(r => r.status === 'pending').length,
                           color: '#FF9800'
                         },
                         { 
                           name: 'Area Approved', 
                           value: recentReports.filter(r => r.status === 'area_approved').length,
                           color: '#2196F3'
                         },
                         { 
                           name: 'District Approved', 
                           value: recentReports.filter(r => r.status === 'district_approved').length,
                           color: '#4CAF50'
                         },
                         { 
                           name: 'Rejected', 
                           value: recentReports.filter(r => r.status === 'rejected').length,
                           color: '#F44336'
                         }
                       ].filter(item => item.value > 0)}
                       cx="50%"
                       cy="50%"
                       labelLine={false}
                       label={!isMobile ? ({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)` : false}
                       outerRadius={isMobile ? 100 : 120}
                       fill="#8884d8"
                       dataKey="value"
                     >
                       {[
                         { name: 'Pending', value: recentReports.filter(r => r.status === 'pending').length },
                         { name: 'Area Approved', value: recentReports.filter(r => r.status === 'area_approved').length },
                         { name: 'District Approved', value: recentReports.filter(r => r.status === 'district_approved').length },
                         { name: 'Rejected', value: recentReports.filter(r => r.status === 'rejected').length }
                       ].filter(item => item.value > 0).map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.name === 'Pending' ? '#FF9800' : 
                           entry.name === 'Area Approved' ? '#2196F3' :
                           entry.name === 'District Approved' ? '#4CAF50' : '#F44336'} />
                       ))}
                     </Pie>
                     <Tooltip formatter={(value) => [value, 'Reports']} />
                     <Legend />
                   </PieChart>
                 </ResponsiveContainer>
               </Box>
             ) : (
               <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                 <Typography variant="body2" color="textSecondary">
                   No reports data available
                 </Typography>
               </Box>
             )}
           </CardContent>
         </Card>
       </GridItem>

       {/* Quick Action Links */}
       <GridItem xs={12} md={6}>
         <Card>
           <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
             <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
               Quick Actions
             </Typography>
             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
               <Button
                 variant="outlined"
                 onClick={() => navigate('/districts')}
                 fullWidth
                 startIcon={<Business />}
                 size={isMobile ? "small" : "medium"}
                 sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
               >
                 Manage Districts ({stats.assignedDistricts}/{stats.totalDistricts} Assigned)
               </Button>
               <Button
                 variant="outlined"
                 onClick={() => navigate('/zonal-supervisors')}
                 fullWidth
                 startIcon={<Group />}
                 size={isMobile ? "small" : "medium"}
                 sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
               >
                 Manage Zonal Supervisors ({stats.assignedZonals}/{stats.totalZonalSupervisors} Assigned)
               </Button>
               <Button
                 variant="outlined"
                 onClick={() => navigate('/area-supervisors')}
                 fullWidth
                 startIcon={<AccountTree />}
                 size={isMobile ? "small" : "medium"}
                 sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
               >
                 Manage Area Supervisors ({stats.assignedAreas}/{stats.totalAreaSupervisors} Assigned)
               </Button>
               <Button
                 variant="outlined"
                 onClick={() => navigate('/cith-centres')}
                 fullWidth
                 startIcon={<Home />}
                 size={isMobile ? "small" : "medium"}
                 sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
               >
                 Manage CITH Centres ({stats.assignedCentres}/{stats.totalCithCentres} Assigned)
               </Button>
               <Button
                 variant="outlined"
                 onClick={() => navigate('/admin/users')}
                 fullWidth
                 startIcon={<People />}
                 size={isMobile ? "small" : "medium"}
                 sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
               >
                 Manage Users ({stats.totalUsers} Active)
               </Button>
               <Button
                 variant="outlined"
                 onClick={() => navigate('/admin/position-requests')}
                 fullWidth
                 startIcon={<ManageAccounts />}
                 color={pendingRequests.length > 0 ? 'warning' : 'primary'}
                 size={isMobile ? "small" : "medium"}
                 sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
               >
                 Position Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
               </Button>
               <Button
                 variant="outlined"
                 onClick={() => navigate('/reports')}
                 fullWidth
                 startIcon={<BarChart />}
                 size={isMobile ? "small" : "medium"}
                 sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
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
           <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
             <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
               Recent Reports
             </Typography>
             {recentReports.length > 0 ? (
               <Box sx={{ overflow: 'auto' }}>
                 <TableContainer>
                   <Table size={isMobile ? "small" : "medium"}>
                     <TableHead>
                       <TableRow>
                         <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Centre</TableCell>
                         <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Date</TableCell>
                         <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Attendance</TableCell>
                         <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Status</TableCell>
                       </TableRow>
                     </TableHead>
                     <TableBody>
                       {recentReports.slice(0, 5).map((report) => (
                         <TableRow key={report._id}>
                           <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                             {report.cithCentreId?.name || 'Unknown Centre'}
                           </TableCell>
                           <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                             {report.week ? new Date(report.week).toLocaleDateString() : 'Unknown Date'}
                           </TableCell>
                           <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
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
                               sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                             />
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </TableContainer>
               </Box>
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
    <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
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
    <Box sx={{ 
      position: 'fixed', 
      bottom: { xs: 16, sm: 80 }, 
      right: 16, 
      zIndex: 1000,
      display: { xs: 'none', sm: 'block' }
    }}>
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