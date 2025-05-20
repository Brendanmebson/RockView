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
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  Divider,
} from '@mui/material';
import { 
  Download, 
  Add, 
  Visibility, 
  DateRange,
  FilterList,
  Refresh,
  CheckCircle,
  Cancel,
  Search,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import api from '../../services/api';
import { WeeklyReport, CithCentre, AreaSupervisor } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const ReportList: React.FC = () => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    startDate: null as Dayjs | null,
    endDate: null as Dayjs | null,
    cithCentreId: '',
    areaSupervisorId: '',
  });
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [centres, setCentres] = useState<CithCentre[]>([]);
  const [areaSupervisors, setAreaSupervisors] = useState<AreaSupervisor[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchReports();
    if (user && (user.role === 'district_pastor' || user.role === 'admin')) {
      fetchCentresAndSupervisors();
    }
  }, [filters.page, filters.status]);

  useEffect(() => {
    // When advanced filters change, reset to page 1
    if (
      filters.startDate !== null ||
      filters.endDate !== null ||
      filters.cithCentreId !== '' ||
      filters.areaSupervisorId !== ''
    ) {
      setFilters(prev => ({ ...prev, page: 1 }));
      fetchReports();
    }
  }, [filters.startDate, filters.endDate, filters.cithCentreId, filters.areaSupervisorId]);

  const fetchCentresAndSupervisors = async () => {
    try {
      const [centresResponse, supervisorsResponse] = await Promise.all([
        api.get('/cith-centres'),
        api.get('/area-supervisors')
      ]);
      setCentres(centresResponse.data);
      setAreaSupervisors(supervisorsResponse.data);
    } catch (error) {
      console.error('Error fetching filters data:', error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      params.append('page', filters.page.toString());
      
      // Add date filters if provided
      if (filters.startDate) {
        params.append('startDate', filters.startDate.format('YYYY-MM-DD'));
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate.format('YYYY-MM-DD'));
      }
      
      // Add centre/area filters if provided
      if (filters.cithCentreId) {
        params.append('cithCentreId', filters.cithCentreId);
      }
      if (filters.areaSupervisorId) {
        params.append('areaSupervisorId', filters.areaSupervisorId);
      }
      
      const response = await api.get(`/reports?${params}`);
      setReports(response.data.reports);
      setTotalPages(response.data.totalPages);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch reports');
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
      // Build export params
      const params = new URLSearchParams();
      if (filters.startDate) {
        params.append('startDate', filters.startDate.format('YYYY-MM-DD'));
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate.format('YYYY-MM-DD'));
      }
      
      const response = await api.get(`/export/excel?${params}`, {
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
      setError('Failed to export reports');
    }
  };

  const handleApprove = async (reportId: string) => {
    try {
      await api.put(`/reports/${reportId}/approve`);
      fetchReports(); // Refresh data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to approve report');
      console.error('Error approving report:', error);
    }
  };

  const handleReject = async (reportId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;
    
    try {
      await api.put(`/reports/${reportId}/reject`, { reason });
      fetchReports(); // Refresh data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reject report');
      console.error('Error rejecting report:', error);
    }
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      page: 1,
      startDate: null,
      endDate: null,
      cithCentreId: '',
      areaSupervisorId: '',
    });
    fetchReports();
  };

  const canApproveReports = () => {
    return user?.role === 'area_supervisor' || user?.role === 'district_pastor';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
            {user?.role !== 'cith_centre' && (
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExport}
              >
                Export Excel
              </Button>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Filters</Typography>
              <Box>
                <Tooltip title={showFilters ? "Hide advanced filters" : "Show advanced filters"}>
                  <IconButton onClick={() => setShowFilters(!showFilters)}>
                    <FilterList />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reset all filters">
                  <IconButton onClick={resetFilters}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
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
              
              {showFilters && (
                <>
                  <Grid item xs={12} md={4}>
                    <DatePicker
                      label="Start Date"
                      value={filters.startDate}
                      onChange={(newValue) => 
                        setFilters(prev => ({ ...prev, startDate: newValue }))
                      }
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <DatePicker
                      label="End Date"
                      value={filters.endDate}
                      onChange={(newValue) => 
                        setFilters(prev => ({ ...prev, endDate: newValue }))
                      }
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  
                  {(user?.role === 'admin' || user?.role === 'district_pastor') && (
                    <>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Area Supervisor</InputLabel>
                          <Select
                            value={filters.areaSupervisorId}
                            onChange={(e) => 
                              setFilters(prev => ({ 
                                ...prev, 
                                areaSupervisorId: e.target.value as string,
                                cithCentreId: '' // Reset centre when area changes
                              }))
                            }
                          >
                            <MenuItem value="">All Areas</MenuItem>
                            {areaSupervisors.map(area => (
                              <MenuItem key={area._id} value={area._id}>
                                {area.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>CITH Centre</InputLabel>
                          <Select
                            value={filters.cithCentreId}
                            onChange={(e) => 
                              setFilters(prev => ({ ...prev, cithCentreId: e.target.value as string }))
                            }
                          >
                            <MenuItem value="">All Centres</MenuItem>
                            {centres
                              .filter(centre => 
                                !filters.areaSupervisorId || 
                                centre.areaSupervisorId._id === filters.areaSupervisorId
                              )
                              .map(centre => (
                                <MenuItem key={centre._id} value={centre._id}>
                                  {centre.name}
                                </MenuItem>
                              ))
                            }
                          </Select>
                        </FormControl>
                      </Grid>
                    </>
                  )}
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="contained" 
                        onClick={fetchReports}
                        startIcon={<Search />}
                      >
                        Apply Filters
                      </Button>
                    </Box>
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
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
                          <TableCell>{new Date(report.week).toLocaleDateString()}</TableCell>
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
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Visibility />}
                                onClick={() => navigate(`/reports/${report._id}`)}
                              >
                                View
                              </Button>
                              
                              {/* Approval buttons for area supervisors and district pastors */}
                              {canApproveReports() && report.status === 
                                (user?.role === 'area_supervisor' ? 'pending' : 'area_approved') && (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    startIcon={<CheckCircle />}
                                    onClick={() => handleApprove(report._id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    startIcon={<Cancel />}
                                    onClick={() => handleReject(report._id)}
                                  >
                                    Reject
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {reports.length === 0 && (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="textSecondary">
                      No reports found
                    </Typography>
                    {user?.role === 'cith_centre' && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/reports/new')}
                        sx={{ mt: 2 }}
                      >
                        Submit Your First Report
                      </Button>
                    )}
                  </Box>
                )}
              </>
            )}
            
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={filters.page}
                  onChange={(_, page) => setFilters(prev => ({ ...prev, page }))}
                  color="primary"
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportList;