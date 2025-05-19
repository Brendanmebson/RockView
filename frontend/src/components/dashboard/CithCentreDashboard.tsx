import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { Add } from '@mui/icons-material';
import api from '../../services/api';
import { WeeklyReport } from '../../types';
import { useNavigate } from 'react-router-dom';

const CithCentreDashboard: React.FC = () => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports?limit=5');
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <Box>
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                  Total Reports Submitted: {reports.length}
                </Typography>
                <Typography variant="body1">
                  Pending Approval: {reports.filter(r => r.status === 'pending').length}
                </Typography>
                <Typography variant="body1">
                    Approved Reports: {reports.filter(r => r.status === 'district_approved').length}
               </Typography>
               <Typography variant="body1">
                 Rejected Reports: {reports.filter(r => r.status === 'rejected').length}
               </Typography>
             </Box>
           </CardContent>
         </Card>
       </Grid>
     </Grid>
   </Box>
 );
};

export default CithCentreDashboard;