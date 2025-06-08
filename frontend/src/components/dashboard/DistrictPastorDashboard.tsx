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
  Paper,
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  Download, 
  PeopleAlt, 
  AttachMoney, 
  TrendingUp, 
  Assessment, 
  Group, 
  People,
  Business 
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
         LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, Scatter, 
         Treemap } from 'recharts';
import api from '../../services/api';
import { WeeklyReport, ReportSummary, AreaSupervisor, CithCentre, District } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DistrictPastorDashboard: React.FC = () => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [pendingReports, setPendingReports] = useState<WeeklyReport[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [districtInfo, setDistrictInfo] = useState<District | null>(null);
  const [areaSupervisors, setAreaSupervisors] = useState<AreaSupervisor[]>([]);
  const [centres, setCentres] = useState<CithCentre[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [areaComparisonData, setAreaComparisonData] = useState<any[]>([]);
  const [conversionData, setConversionData] = useState<any[]>([]);
  const [centreTreemapData, setCentreTreemapData] = useState<any[]>([]);
  const { user, userDistrict } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    
    // Set context from auth context
    if (userDistrict) setDistrictInfo(userDistrict);
    
    // If not available in auth context, fetch it
    if (!userDistrict && user?.districtId) {
      fetchUserContext();
    }
  }, [user, userDistrict]);

  const fetchUserContext = async () => {
    if (!user || !user.districtId) return;
    
    try {
      // Fetch District info
      const districtResponse = await api.get(`/districts/${user.districtId}`);
      setDistrictInfo(districtResponse.data);
      
      // Fetch Area Supervisors in this district
      const areasResponse = await api.get(`/area-supervisors?districtId=${user.districtId}`);
      setAreaSupervisors(areasResponse.data);
      
      // Fetch all centres in the district's areas
      if (areasResponse.data.length > 0) {
        const areaIds = areasResponse.data.map((area: AreaSupervisor) => area._id).join(',');
        const centresResponse = await api.get(`/cith-centres?areaSupervisorIds=${areaIds}`);
        setCentres(centresResponse.data);
      }
    } catch (error) {
      console.error("Error fetching user context:", error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [reportsResponse, pendingResponse, summaryResponse, areasResponse, centresResponse] = await Promise.all([
        api.get('/reports?limit=50'),
        api.get('/reports?status=area_approved&limit=10'),
        api.get('/reports/summary'),
        api.get('/area-supervisors'),
        api.get('/cith-centres')
      ]);
      setReports(reportsResponse.data.reports);
      setPendingReports(pendingResponse.data.reports);
      setSummary(summaryResponse.data);
      setAreaSupervisors(areasResponse.data);
      setCentres(centresResponse.data);
      
      // Process data for charts
      processChartData(reportsResponse.data.reports, areasResponse.data, centresResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (reports: WeeklyReport[], areas: AreaSupervisor[], centres: CithCentre[]) => {
    // Group reports by week for attendance trends
    const weeklyData: {[key: string]: any} = {};
    reports.forEach(report => {
      const week = new Date(report.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!weeklyData[week]) {
        weeklyData[week] = { 
          week, 
          male: 0, 
          female: 0, 
          children: 0, 
          total: 0,
          offerings: 0,
          firstTimers: 0 
        };
      }
      weeklyData[week].male += report.data.male;
      weeklyData[week].female += report.data.female;
      weeklyData[week].children += report.data.children;
      weeklyData[week].total += report.data.male + report.data.female + report.data.children;
      weeklyData[week].offerings += report.data.offerings;
      weeklyData[week].firstTimers += report.data.numberOfFirstTimers;
    });
    setAttendanceData(Object.values(weeklyData).sort((a, b) => {
     const dateA = new Date(a.week);
     const dateB = new Date(b.week);
     return dateA.getTime() - dateB.getTime();
   }));
   
   // Area comparison data
   const areaData: {[key: string]: any} = {};
   areas.forEach(area => {
     areaData[area._id] = { 
       name: area.name, 
       attendance: 0, 
       offerings: 0, 
       firstTimers: 0,
       testimonies: 0,
       centres: 0
     };
   });
   
   // Map centres to areas
   const centresToArea: {[key: string]: string} = {};
   centres.forEach(centre => {
     if (centre.areaSupervisorId && typeof centre.areaSupervisorId === 'object') {
       centresToArea[centre._id] = centre.areaSupervisorId._id;
       if (areaData[centre.areaSupervisorId._id]) {
         areaData[centre.areaSupervisorId._id].centres++;
       }
     }
   });
   
   reports.forEach(report => {
     const centreId = report.cithCentreId._id;
     const areaId = centresToArea[centreId];
     
     if (areaData[areaId]) {
       areaData[areaId].attendance += report.data.male + report.data.female + report.data.children;
       areaData[areaId].offerings += report.data.offerings;
       areaData[areaId].firstTimers += report.data.numberOfFirstTimers;
       areaData[areaId].testimonies += report.data.numberOfTestimonies;
     }
   });
   
   setAreaComparisonData(Object.values(areaData));
   
   // First timer conversion funnel
   const conversionFunnel = reports.reduce((acc, report) => {
     acc.firstTimers += report.data.numberOfFirstTimers;
     acc.followedUp += report.data.firstTimersFollowedUp;
     acc.converted += report.data.firstTimersConvertedToCITH;
     return acc;
   }, { firstTimers: 0, followedUp: 0, converted: 0 });
   
   setConversionData([
     { name: 'First Timers', value: conversionFunnel.firstTimers },
     { name: 'Followed Up', value: conversionFunnel.followedUp },
     { name: 'Converted', value: conversionFunnel.converted }
   ]);
   
   // Centre treemap data
   const treemapData: { name: string, children: any[] } = { name: 'Centres', children: [] };
   const centreData: {[key: string]: any} = {};
   
   centres.forEach(centre => {
     let areaName = 'Unknown Area';
     if (centre.areaSupervisorId && typeof centre.areaSupervisorId === 'object') {
       areaName = centre.areaSupervisorId.name;
     }
     
     centreData[centre._id] = { 
       name: centre.name, 
       size: 0,
       area: areaName
     };
   });
   
   reports.forEach(report => {
     const centreId = report.cithCentreId._id;
     if (centreData[centreId]) {
       centreData[centreId].size += report.data.male + report.data.female + report.data.children;
     }
   });
   
   // Group by area
   const areaGroups: {[key: string]: any} = {};
   Object.values(centreData).forEach(centre => {
     if (!areaGroups[centre.area]) {
       areaGroups[centre.area] = {
         name: centre.area,
         children: []
       };
     }
     areaGroups[centre.area].children.push({
       name: centre.name,
       size: centre.size > 0 ? centre.size : 1 // Ensure minimum size for visibility
     });
   });
   
   treemapData.children = Object.values(areaGroups);
   setCentreTreemapData([treemapData]);
 };

 const handleApprove = async (reportId: string) => {
   try {
     await api.put(`/reports/${reportId}/approve`);
     fetchDashboardData();
   } catch (error) {
     console.error('Error approving report:', error);
   }
 };

 const handleReject = async (reportId: string) => {
   const reason = prompt('Please enter rejection reason:');
   if (!reason) return;
   
   try {
     await api.put(`/reports/${reportId}/reject`, { reason });
     fetchDashboardData();
   } catch (error) {
     console.error('Error rejecting report:', error);
   }
 };

 const handleExport = async () => {
   try {
     const response = await api.get('/export/excel', {
       responseType: 'blob',
     });
     
     const url = window.URL.createObjectURL(new Blob([response.data]));
     const link = document.createElement('a');
     link.href = url;
     link.setAttribute('download', `district-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
     document.body.appendChild(link);
     link.click();
     link.remove();
   } catch (error) {
     console.error('Error exporting reports:', error);
   }
 };

 const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

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
           <Business />
           <Typography variant="subtitle1" fontWeight="bold">
             {districtInfo ? districtInfo.name : 'Loading...'}
           </Typography>
           {districtInfo && (
             <Chip 
               label={`District ${districtInfo.districtNumber}`} 
               size="small" 
               sx={{ 
                 bgcolor: 'rgba(255,255,255,0.15)', 
                 color: 'white',
                 '& .MuiChip-label': { fontWeight: 500 }
               }} 
             />
           )}
         </Box>
         
         <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
         
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
           <People />
           <Typography variant="subtitle1">
             District Pastor: {districtInfo ? districtInfo.pastorName : 'Loading...'}
           </Typography>
         </Box>
         
         <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
           <Chip 
             label={`${areaSupervisors.length} Areas`} 
             size="small" 
             sx={{ 
               bgcolor: 'secondary.main', 
               color: 'white',
               '& .MuiChip-label': { fontWeight: 500 }
             }} 
           />
           <Chip 
             label={`${centres.length} CITH Centres`} 
             size="small" 
             sx={{ 
               bgcolor: 'primary.main', 
               color: 'white',
               '& .MuiChip-label': { fontWeight: 500 }
             }} 
           />
         </Box>
       </Box>
     </Paper>

     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
       <Typography variant="h4" gutterBottom>
         District Pastor Dashboard
       </Typography>
       <Button
         variant="contained"
         startIcon={<Download />}
         onClick={handleExport}
       >
         Export Reports
       </Button>
     </Box>

     {/* Summary Statistics */}
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
                   <Chip label={`${summary.totalMale} Male`} size="small" color="primary" variant="outlined" />
                   <Chip label={`${summary.totalFemale} Female`} size="small" color="secondary" variant="outlined" />
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
                 <Typography variant="h5">₦{summary.totalOfferings.toLocaleString()}</Typography>
                 <Typography variant="caption" color="textSecondary">
                   From {summary.totalReports} services
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
                     label={`${summary.totalFirstTimersConverted} Converted`} 
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
                 <Group />
               </Avatar>
               <Box>
                 <Typography variant="body2" color="textSecondary">CITH Centres</Typography>
                 <Typography variant="h5">{centres.length}</Typography>
                 <Typography variant="caption" color="textSecondary">
                   {areaSupervisors.length} Areas
                 </Typography>
               </Box>
             </CardContent>
           </Card>
         </GridItem>
       </Grid>
     )}

     {/* Charts and Analytics */}
     <Grid container spacing={3}>
       {/* District Growth Trend */}
       <GridItem xs={12} md={8}>
         <Card>
           <CardContent>
             <Typography variant="h6" gutterBottom>District Growth Trends</Typography>
             <ResponsiveContainer width="100%" height={300}>
               <ComposedChart data={attendanceData}>
                 <XAxis dataKey="week" />
                 <YAxis yAxisId="left" />
                 <YAxis yAxisId="right" orientation="right" />
                 <Tooltip />
                 <Legend />
                 <Bar yAxisId="left" dataKey="total" name="Total Attendance" fill="#8884d8" />
                 <Line yAxisId="right" type="monotone" dataKey="offerings" name="Offerings" stroke="#82ca9d" />
                 <Area yAxisId="left" type="monotone" dataKey="firstTimers" name="First Timers" fill="#ffc658" stroke="#ffc658" />
               </ComposedChart>
             </ResponsiveContainer>
           </CardContent>
         </Card>
       </GridItem>
       
       {/* First Timer Conversion Funnel */}
       <GridItem xs={12} md={4}>
         <Card>
           <CardContent>
             <Typography variant="h6" gutterBottom>First Timer Conversion</Typography>
             <ResponsiveContainer width="100%" height={300}>
               <BarChart data={conversionData} layout="vertical">
                 <XAxis type="number" />
                 <YAxis type="category" dataKey="name" />
                 <Tooltip />
                 <Legend />
                 <Bar dataKey="value" fill="#8884d8">
                   {conversionData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
             {conversionData.length > 0 && (
               <Box sx={{ mt: 2 }}>
                 <Typography variant="body2" color="textSecondary">
                   Conversion Rate: {((conversionData[2]?.value / conversionData[0]?.value) * 100 || 0).toFixed(1)}%
                 </Typography>
                 <Typography variant="body2" color="textSecondary">
                   Follow-up Rate: {((conversionData[1]?.value / conversionData[0]?.value) * 100 || 0).toFixed(1)}%
                 </Typography>
               </Box>
             )}
           </CardContent>
         </Card>
       </GridItem>
       
       {/* Area Performance Comparison */}
       <GridItem xs={12} md={6}>
         <Card>
           <CardContent>
             <Typography variant="h6" gutterBottom>Area Performance</Typography>
             <ResponsiveContainer width="100%" height={300}>
               <BarChart data={areaComparisonData}>
                 <XAxis dataKey="name" />
                 <YAxis />
                 <Tooltip />
                 <Legend />
                 <Bar dataKey="attendance" name="Attendance" fill="#8884d8" />
                 <Bar dataKey="firstTimers" name="First Timers" fill="#82ca9d" />
                 <Bar dataKey="testimonies" name="Testimonies" fill="#ffc658" />
               </BarChart>
             </ResponsiveContainer>
           </CardContent>
         </Card>
       </GridItem>
       
       {/* Centre Distribution Treemap */}
       <GridItem xs={12} md={6}>
         <Card>
           <CardContent>
             <Typography variant="h6" gutterBottom>Centre Size Distribution</Typography>
             <ResponsiveContainer width="100%" height={300}>
               <Treemap
                 data={centreTreemapData}
                 dataKey="size"
                 stroke="#fff"
                 fill="#8884d8"
                 content={<CustomizedContent colors={COLORS} />}
               />
             </ResponsiveContainer>
           </CardContent>
         </Card>
       </GridItem>

       {/* Reports for Final Approval */}
       <GridItem xs={12}>
         <Card>
           <CardContent>
             <Typography variant="h6" gutterBottom>
               Reports for Final Approval
             </Typography>
             <TableContainer>
               <Table>
                 <TableHead>
                   <TableRow>
                     <TableCell>CITH Centre</TableCell>
                     <TableCell>Area</TableCell>
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
                      <TableCell>
                        {typeof report.cithCentreId.areaSupervisorId === 'object' && report.cithCentreId.areaSupervisorId?.name 
                          ? report.cithCentreId.areaSupervisorId.name 
                          : 'Unknown'}
                      </TableCell> 
                      <TableCell>{new Date(report.week).toDateString()}</TableCell>
                       <TableCell>
                         {report.data.male + report.data.female + report.data.children}
                       </TableCell>
                       <TableCell>₦{report.data.offerings.toLocaleString()}</TableCell>
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
                 No reports pending approval
               </Typography>
             )}
           </CardContent>
           </Card>
       </GridItem>
     </Grid>
   </Box>
 );
};

// Custom content component for Treemap
const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, colors, name, value } = props;
  
  // Add safety checks
  if (!root || !root.children || !colors || !Array.isArray(colors)) {
    return null;
  }

  // Ensure we have valid dimensions
  if (!width || !height || width <= 0 || height <= 0) {
    return null;
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: depth < 2 
            ? colors[Math.floor((index / Math.max(root.children.length, 1)) * colors.length) % colors.length]
            : 'rgba(255,255,255,0.3)',
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {depth === 1 && width > 50 && height > 20 && name && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 7}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
        >
          {name}
        </text>
      )}
    </g>
  );
};

export default DistrictPastorDashboard;