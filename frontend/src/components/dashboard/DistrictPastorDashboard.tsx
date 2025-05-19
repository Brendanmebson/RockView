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
} from '@mui/material';
import { CheckCircle, Cancel, Download } from '@mui/icons-material';
import api from '../../services/api';
import { WeeklyReport, ReportSummary } from '../../types';

const DistrictPastorDashboard: React.FC = () => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [reportsResponse, summaryResponse] = await Promise.all([
        api.get('/reports?status=area_approved&limit=10'),
        api.get('/reports/summary'),
      ]);
      setReports(reportsResponse.data.reports);
      setSummary(summaryResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <Box>
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

      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Attendance</Typography>
                <Typography variant="h4">
                  {summary.totalMale + summary.totalFemale + summary.totalChildren}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Offerings</Typography>
                <Typography variant="h4">${summary.totalOfferings}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">First Timers</Typography>
                <Typography variant="h4">{summary.totalFirstTimers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Testimonies</Typography>
                <Typography variant="h4">{summary.totalTestimonies}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

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
                  <TableCell>Week</TableCell>
                  <TableCell>Total Attendance</TableCell>
                  <TableCell>Offerings</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report._id}>
                    <TableCell>{report.cithCentreId.name}</TableCell>
                    <TableCell>{new Date(report.week).toDateString()}</TableCell>
                    <TableCell>
                      {report.data.male + report.data.female + report.data.children}
                    </TableCell>
                    <TableCell>${report.data.offerings}</TableCell>
                    <TableCell>
                      <Button
                        startIcon={<CheckCircle />}
                        color="success"
                        onClick={() => handleApprove(report._id)}
                        sx={{ mr: 1 }}
                      >
                        Approve
                      </Button>
                      <Button
                        startIcon={<Cancel />}
                        color="error"
                        onClick={() => handleReject(report._id)}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {reports.length === 0 && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              No reports pending approval
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DistrictPastorDashboard;