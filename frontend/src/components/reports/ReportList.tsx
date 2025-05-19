import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Pagination,
} from '@mui/material';
import { Download, Add } from '@mui/icons-material';
import api from '../../services/api';
import { WeeklyReport } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ReportList: React.FC = () => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
  });
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      params.append('page', filters.page.toString());
      
      const response = await api.get(`/reports?${params}`);
      setReports(response.data.reports);
      setTotalPages(response.data.totalPages);
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

  const handleExport = async () => {
    try {
      const response = await api.get('/export/excel', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports-${new Date().toISOString().split('T')[0]}.xlsx`);
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
        <Typography variant="h4">Reports</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {user?.role === 'cith_centre' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/reports/new')}
            >
              Submit Report
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export Excel
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="area_approved">Area Approved</MenuItem>
              <MenuItem value="district_approved">District Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>CITH Centre</TableCell>
                  <TableCell>Week</TableCell>
                  <TableCell>Total Attendance</TableCell>
                  <TableCell>Offerings</TableCell>
                  <TableCell>First Timers</TableCell>
                  <TableCell>Status</TableCell>
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
                    <TableCell>{report.data.numberOfFirstTimers}</TableCell>
                    <TableCell>
                      <Chip
                        label={report.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(report.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => navigate(`/reports/${report._id}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {reports.length === 0 && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
              No reports found
            </Typography>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={filters.page}
            onChange={(_, page) => setFilters(prev => ({ ...prev, page }))}
          />
        </Box>
      )}
    </Box>
  );
};

export default ReportList;