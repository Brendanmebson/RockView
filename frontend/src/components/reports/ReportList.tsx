// frontend/src/components/reports/ReportList.tsx
import React, { useEffect, useState } from 'react';
import GridItem from '../common/GridItem';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
  Delete,
  Edit,
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
  const [success, setSuccess] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<WeeklyReport | null>(null);
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

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchCentresAndSupervisors = async () => {
    try {
      const [centresResponse, supervisorsResponse] = await Promise.allSettled([
        api.get('/cith-centres'),
        api.get('/area-supervisors')
      ]);
      
      if (centresResponse.status === 'fulfilled') {
        setCentres(centresResponse.value.data || []);
      }
      
      if (supervisorsResponse.status === 'fulfilled') {
        setAreaSupervisors(supervisorsResponse.value.data || []);
      }
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
      const reportsData = response.data?.reports || [];
      
      // Ensure all reports have valid structure
      const validatedReports = reportsData.map((report: any) => ({
        ...report,
        cithCentreId: report.cithCentreId || { name: 'Unknown Centre', _id: '', location: '' },
        data: report.data || {
          male: 0,
          female: 0,
          children: 0,
          offerings: 0,
          numberOfFirstTimers: 0,
          numberOfTestimonies: 0,
          firstTimersFollowedUp: 0,
          firstTimersConvertedToCITH: 0,
          modeOfMeeting: 'physical',
          remarks: ''
        },
        submittedBy: report.submittedBy || { name: 'Unknown User', _id: '', email: '' }
      }));
      
      setReports(validatedReports);
      setTotalPages(response.data?.totalPages || 1);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch reports');
      console.error('Error fetching reports:', error);
      setReports([]); // Set empty array on error
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
      setSuccess('Report approved successfully');
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
      setSuccess('Report rejected successfully');
      fetchReports(); // Refresh data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reject report');
      console.error('Error rejecting report:', error);
    }
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;

    try {
      await api.delete(`/reports/${reportToDelete._id}`);
      setSuccess('Report deleted successfully');
      setDeleteDialogOpen(false);
      setReportToDelete(null);
      fetchReports(); // Refresh the list
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete report');
      console.error('Error deleting report:', error);
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const openDeleteDialog = (report: WeeklyReport) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
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

  const canDeleteReport = (report: WeeklyReport) => {
    if (user?.role === 'admin') {
      return true;
    }
    
    if (user?.role === 'cith_centre') {
      return report.submittedBy?._id === user._id && 
             (report.status === 'pending' || report.status === 'rejected');
    }
    
    return false;
  };

  const getSafeCentreName = (report: WeeklyReport) => {
    if (!report || !report.cithCentreId) return 'Unknown Centre';
    if (typeof report.cithCentreId === 'string') return 'Centre ID: ' + report.cithCentreId;
    return report.cithCentreId.name || 'Unknown Centre';
  };

  const getSafeReportData = (report: WeeklyReport) => {
    if (!report || !report.data) {
      return { male: 0, female: 0, children: 0, offerings: 0, numberOfFirstTimers: 0 };
    }
    return {
      male: report.data.male || 0,
      female: report.data.female || 0,
      children: report.data.children || 0,
      offerings: report.data.offerings || 0,
      numberOfFirstTimers: report.data.numberOfFirstTimers || 0
    };
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pending':
        return 'PENDING';
      case 'area_approved':
        return 'AREA APPROVED';
      case 'district_approved':
        return 'DISTRICT APPROVED';
      case 'rejected':
        return 'REJECTED';
      default:
        return status?.toUpperCase() || 'UNKNOWN';
    }
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
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
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
              <GridItem xs={12} md={4}>
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
              </GridItem>
              
              {showFilters && (
                <>
                  <GridItem xs={12} md={4}>
                    <DatePicker
                      label="Start Date"
                      value={filters.startDate}
                      onChange={(newValue) => 
                        setFilters(prev => ({ ...prev, startDate: newValue }))
                      }
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </GridItem>
                  
                  <GridItem xs={12} md={4}>
                    <DatePicker
                      label="End Date"
                      value={filters.endDate}
                      onChange={(newValue) => 
                        setFilters(prev => ({ ...prev, endDate: newValue }))
                      }
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </GridItem>
                  
                  {(user?.role === 'admin' || user?.role === 'district_pastor') && (
                    <>
                      <GridItem xs={12} md={6}>
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
                                {area.name || 'Unknown Area'}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </GridItem>
                      
                      <GridItem xs={12} md={6}>
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
                              .filter(centre => {
                                if (!filters.areaSupervisorId) return true;
                                if (!centre.areaSupervisorId) return false;
                                const areaSupervisorId = typeof centre.areaSupervisorId === 'string' ? 
                                  centre.areaSupervisorId : 
                                  centre.areaSupervisorId._id;
                                return areaSupervisorId === filters.areaSupervisorId;
                              })
                              .map(centre => (
                                <MenuItem key={centre._id} value={centre._id}>
                                  {centre.name || 'Unknown Centre'}
                                </MenuItem>
                              ))
                            }
                          </Select>
                        </FormControl>
                      </GridItem>
                    </>
                  )}
                  
                  <GridItem xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="contained" 
                        onClick={fetchReports}
                        startIcon={<Search />}
                        disabled={loading}
                      >
                        Apply Filters
                      </Button>
                    </Box>
                  </GridItem>
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
                      {reports.map((report) => {
                        const safeData = getSafeReportData(report);
                        return (
                          <TableRow key={report._id}>
                            <TableCell>{getSafeCentreName(report)}</TableCell>
                            <TableCell>
                              {report.week ? new Date(report.week).toLocaleDateString() : 'Unknown Date'}
                            </TableCell>
                            <TableCell>
                              {safeData.male + safeData.female + safeData.children}
                            </TableCell>
                            <TableCell>₦{safeData.offerings.toLocaleString()}</TableCell>
                            <TableCell>{safeData.numberOfFirstTimers}</TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusDisplayName(report.status)}
                                color={getStatusColor(report.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Visibility />}
                                  onClick={() => navigate(`/reports/${report._id}`)}
                                >
                                  View
                                </Button>
                              
                              {user?.role === 'admin' && (
                                <Button
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  startIcon={<Edit />}
                                  onClick={() => navigate(`/admin/reports/${report._id}/edit`)}
                                >
                                  Admin Edit
                                </Button>
                              )}

                                {/* Edit button for pending reports by original submitter */}
                                {user?.role === 'cith_centre' && 
                                 report.submittedBy?._id === user._id && 
                                 report.status === 'pending' && (
                                  <Button
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                    startIcon={<Edit />}
                                    onClick={() => navigate(`/reports/${report._id}/edit`)}
                                  >
                                    Edit
                                  </Button>
                                )}
                                
                                {/* Delete button */}
                                {canDeleteReport(report) && (
                                  <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    startIcon={<Delete />}
                                    onClick={() => openDeleteDialog(report)}
                                  >
                                    Delete
                                  </Button>
                                )}
                                
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
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {reports.length === 0 && !loading && (
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Report</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this report from "{getSafeCentreName(reportToDelete || {} as WeeklyReport)}"? 
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleDeleteReport} 
              color="error" 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportList;