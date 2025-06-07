// frontend/src/components/admin/CithCentreManagement.tsx
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  Pagination,
  Paper,
  Divider,
  Grid,
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  Home, 
  Person, 
  Phone, 
  Email, 
  CheckCircle, 
  Cancel,
  Search,
  FilterList,
  Refresh,
  Clear,
  LocationOn,
  Business,
} from '@mui/icons-material';
import api from '../../services/api';
import { CithCentre, AreaSupervisor, District } from '../../types';
import GridItem from '../common/GridItem';

const CithCentreManagement: React.FC = () => {
  const [cithCentres, setCithCentres] = useState<CithCentre[]>([]);
  const [filteredCentres, setFilteredCentres] = useState<CithCentre[]>([]);
  const [areaSupervisors, setAreaSupervisors] = useState<AreaSupervisor[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCithCentre, setEditingCithCentre] = useState<CithCentre | null>(null);
  const [cithCentreToDelete, setCithCentreToDelete] = useState<CithCentre | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    areaSupervisorId: '',
    location: '',
  });
  const [selectedDistrictId, setSelectedDistrictId] = useState('');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchCithCentres();
    fetchAreaSupervisors();
    fetchDistricts();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [cithCentres, searchQuery, districtFilter, areaFilter, statusFilter, sortBy, sortOrder]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Clear error message after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchCithCentres = async () => {
    setLoading(true);
    try {
      const response = await api.get('/cith-centres');
      setCithCentres(response.data || []);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch CITH centres');
    } finally {
      setLoading(false);
    }
  };

  const fetchAreaSupervisors = async () => {
    try {
      const response = await api.get('/area-supervisors');
      setAreaSupervisors(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch area supervisors:', error);
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await api.get('/districts');
      setDistricts(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch districts:', error);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...cithCentres];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(centre => 
        centre.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        centre.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (centre as any).areaSupervisorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (centre as any).districtName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply district filter
    if (districtFilter) {
      filtered = filtered.filter(centre => {
        const areaId = typeof centre.areaSupervisorId === 'string' 
          ? centre.areaSupervisorId 
          : centre.areaSupervisorId?._id;
        const area = areaSupervisors.find(a => a._id === areaId);
        const districtId = typeof area?.districtId === 'string' 
          ? area.districtId 
          : area?.districtId?._id;
        return districtId === districtFilter;
      });
    }

    // Apply area filter
    if (areaFilter) {
      filtered = filtered.filter(centre => {
        const areaId = typeof centre.areaSupervisorId === 'string' 
          ? centre.areaSupervisorId 
          : centre.areaSupervisorId?._id;
        return areaId === areaFilter;
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(centre => {
        const isAssigned = (centre as any).isAssigned;
        return statusFilter === 'assigned' ? isAssigned : !isAssigned;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'location':
          aValue = a.location.toLowerCase();
          bValue = b.location.toLowerCase();
          break;
        case 'area':
          aValue = getAreaSupervisorName(a).toLowerCase();
          bValue = getAreaSupervisorName(b).toLowerCase();
          break;
        case 'district':
          aValue = getDistrictName(a).toLowerCase();
          bValue = getDistrictName(b).toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredCentres(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDistrictFilter('');
    setAreaFilter('');
    setStatusFilter('');
    setSortBy('name');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (editingCithCentre) {
        await api.put(`/cith-centres/${editingCithCentre._id}`, formData);
        setSuccess('CITH centre updated successfully');
      } else {
        await api.post('/cith-centres', formData);
        setSuccess('CITH centre created successfully');
      }
      
      setDialogOpen(false);
      setEditingCithCentre(null);
      resetForm();
      fetchCithCentres();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cithCentre: CithCentre) => {
    setEditingCithCentre(cithCentre);
    
    const areaSupervisorId = typeof cithCentre.areaSupervisorId === 'string' 
      ? cithCentre.areaSupervisorId 
      : cithCentre.areaSupervisorId?._id || '';
    
    setFormData({
      name: cithCentre.name || '',
      areaSupervisorId,
      location: cithCentre.location || '',
    });

    // Set the district for filtering
    if (typeof cithCentre.areaSupervisorId === 'object' && cithCentre.areaSupervisorId?.districtId) {
      const districtId = typeof cithCentre.areaSupervisorId.districtId === 'string'
        ? cithCentre.areaSupervisorId.districtId
        : cithCentre.areaSupervisorId.districtId._id;
      setSelectedDistrictId(districtId);
    }

    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!cithCentreToDelete) return;

    setLoading(true);
    try {
      await api.delete(`/cith-centres/${cithCentreToDelete._id}`);
      setSuccess('CITH centre deleted successfully');
      setDeleteDialogOpen(false);
      setCithCentreToDelete(null);
      fetchCithCentres();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete CITH centre');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      areaSupervisorId: '',
      location: '',
    });
    setSelectedDistrictId('');
  };

  const openCreateDialog = () => {
    setEditingCithCentre(null);
    resetForm();
    setDialogOpen(true);
  };

  const openDeleteDialog = (cithCentre: CithCentre) => {
    setCithCentreToDelete(cithCentre);
    setDeleteDialogOpen(true);
  };

  const getAreaSupervisorName = (cithCentre: CithCentre) => {
    // Check if we have the populated areaSupervisorName from the backend
    if ((cithCentre as any).areaSupervisorName) {
      return (cithCentre as any).areaSupervisorName;
    }
    
    // Fallback to checking the populated object
    if (typeof cithCentre.areaSupervisorId === 'object' && cithCentre.areaSupervisorId?.name) {
      return cithCentre.areaSupervisorId.name;
    }
    return 'Unknown Area';
  };

  const getDistrictName = (cithCentre: CithCentre) => {
    // Check if we have the populated districtName from the backend
    if ((cithCentre as any).districtName) {
      return (cithCentre as any).districtName;
    }
    
    // Fallback to checking the populated object
    if (typeof cithCentre.areaSupervisorId === 'object' && 
        cithCentre.areaSupervisorId?.districtId &&
        typeof cithCentre.areaSupervisorId.districtId === 'object') {
      return cithCentre.areaSupervisorId.districtId.name || 'Unknown District';
    }
    return 'Unknown District';
  };

  // Filter area supervisors based on selected district
  const filteredAreaSupervisors = selectedDistrictId
    ? areaSupervisors.filter(area => {
        const areaDistrictId = typeof area.districtId === 'string' 
          ? area.districtId 
          : area.districtId?._id;
        return areaDistrictId === selectedDistrictId;
      })
    : areaSupervisors;

  // Get unique districts for filter dropdown
  const getDistrictsForFilter = () => {
    const districtIds = new Set();
    return areaSupervisors.map(area => {
      const districtId = typeof area.districtId === 'string' 
        ? area.districtId 
        : area.districtId?._id;
      if (districtId && !districtIds.has(districtId)) {
        districtIds.add(districtId);
        const district = districts.find(d => d._id === districtId);
        return district;
      }
      return null;
    }).filter(Boolean);
  };

  // Get areas for filter dropdown based on district filter
  const getAreasForFilter = () => {
    if (!districtFilter) return areaSupervisors;
    return areaSupervisors.filter(area => {
      const districtId = typeof area.districtId === 'string' 
        ? area.districtId 
        : area.districtId?._id;
      return districtId === districtFilter;
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredCentres.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCentres = filteredCentres.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">CITH Centres</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Add CITH Centre
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Search and Filter Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search & Filter
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <GridItem xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search centres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery('')} size="small">
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </GridItem>
          
          <GridItem xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>District</InputLabel>
              <Select
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setAreaFilter(''); // Reset area filter when district changes
                }}
              >
                <MenuItem value="">All Districts</MenuItem>
                {getDistrictsForFilter().map((district: any) => (
                  <MenuItem key={district._id} value={district._id}>
                    {district.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </GridItem>
          
          <GridItem xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Area</InputLabel>
              <Select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                disabled={!districtFilter}
              >
                <MenuItem value="">All Areas</MenuItem>
                {getAreasForFilter().map((area) => (
                  <MenuItem key={area._id} value={area._id}>
                    {area.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </GridItem>
          
          <GridItem xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="unassigned">Unassigned</MenuItem>
              </Select>
            </FormControl>
          </GridItem>
          
          <GridItem xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="location">Location</MenuItem>
                <MenuItem value="area">Area</MenuItem>
                <MenuItem value="district">District</MenuItem>
              </Select>
            </FormControl>
          </GridItem>
          
          <GridItem xs={12} md={1}>
            <Tooltip title="Clear all filters">
              <IconButton onClick={clearFilters} color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
          </GridItem>
        </Grid>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Showing {paginatedCentres.length} of {filteredCentres.length} centres
            {searchQuery && ` matching "${searchQuery}"`}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small">
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                size="small"
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      <Card>
        <CardContent>
          {loading && cithCentres.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Centre Name</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Area</TableCell>
                      <TableCell>District</TableCell>
                      <TableCell>Leader(s)</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCentres.map((cithCentre) => (
                      <TableRow key={cithCentre._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Home fontSize="small" />
                            {cithCentre.name || 'Unknown'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOn fontSize="small" />
                            {cithCentre.location || 'Unknown'}
                          </Box>
                        </TableCell>
                        <TableCell>{getAreaSupervisorName(cithCentre)}</TableCell>
                        <TableCell>{getDistrictName(cithCentre)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person fontSize="small" />
                            <Box>
                              {(cithCentre as any).assignedLeaders && (cithCentre as any).assignedLeaders.length > 0 ? (
                                <Box>
                                  {(cithCentre as any).assignedLeaders.map((leader: any, index: number) => (
                                    <Typography key={index} variant="body2">
                                      {leader.name}
                                    </Typography>
                                  ))}
                                  {(cithCentre as any).hasVacancy && (
                                    <Chip 
                                      label="Has Vacancy" 
                                      size="small" 
                                      color="warning" 
                                      sx={{ mt: 0.5 }}
                                    />
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  Unassigned
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {(cithCentre as any).assignedLeaders && (cithCentre as any).assignedLeaders.length > 0 ? (
                              (cithCentre as any).assignedLeaders.map((leader: any, index: number) => (
                                <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Email fontSize="small" />
                                    <Typography variant="caption">
                                      {leader.email || 'Not provided'}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Phone fontSize="small" />
                                    <Typography variant="caption">
                                      {leader.phone || 'Not provided'}
                                    </Typography>
                                  </Box>
                                  {index < (cithCentre as any).assignedLeaders.length - 1 && <Divider sx={{ my: 0.5 }} />}
                                </Box>
                              ))
                            ) : (
                              <Typography variant="caption" color="textSecondary">
                                No contact information available
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip
                              label={(cithCentre as any).isAssigned ? 'Assigned' : 'Unassigned'}
                              color={(cithCentre as any).isAssigned ? 'success' : 'default'}
                              size="small"
                              icon={(cithCentre as any).isAssigned ? <CheckCircle /> : <Cancel />}
                            />
                            {(cithCentre as any).leaderCount !== undefined && (
                              <Typography variant="caption">
                                {(cithCentre as any).leaderCount}/2 Leaders
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit">
                            <IconButton onClick={() => handleEdit(cithCentre)} color="primary">
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton onClick={() => openDeleteDialog(cithCentre)} color="error">
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(_, page) => setCurrentPage(page)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}

          {filteredCentres.length === 0 && !loading && (
            <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
            {searchQuery || districtFilter || areaFilter || statusFilter 
                ? 'No centres found matching your search criteria' 
                : 'No CITH centres found. Create your first CITH centre to get started.'}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCithCentre ? 'Edit CITH Centre' : 'Create New CITH Centre'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Centre Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Home />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth>
              <InputLabel>District (for filtering)</InputLabel>
              <Select
                value={selectedDistrictId}
                onChange={(e) => {
                  setSelectedDistrictId(e.target.value);
                  setFormData({ ...formData, areaSupervisorId: '' }); // Reset area selection
                }}
                label="District (for filtering)"
                startAdornment={
                  <InputAdornment position="start">
                    <Business />
                  </InputAdornment>
                }
              >
                <MenuItem value="">All Districts</MenuItem>
                {districts.map((district) => (
                  <MenuItem key={district._id} value={district._id}>
                    {district.name} (District {district.districtNumber})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Area Supervisor</InputLabel>
              <Select
                value={formData.areaSupervisorId}
                onChange={(e) => setFormData({ ...formData, areaSupervisorId: e.target.value })}
                label="Area Supervisor"
                startAdornment={
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                }
              >
                {filteredAreaSupervisors.map((areaSupervisor) => (
                  <MenuItem key={areaSupervisor._id} value={areaSupervisor._id}>
                    <Box>
                      <Typography variant="body2">{areaSupervisor.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {typeof areaSupervisor.districtId === 'object' 
                          ? areaSupervisor.districtId.name 
                          : 'District Assignment'}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Leader contact information will be automatically filled when users register and assign themselves to this centre. 
                Each centre can have up to 2 leaders.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.name || !formData.location || !formData.areaSupervisorId}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Processing...' : (editingCithCentre ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete CITH Centre</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{cithCentreToDelete?.name}"? This action cannot be undone.
          </Typography>
          {(cithCentreToDelete as any)?.assignedLeaders?.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This centre has assigned leaders:
              <ul>
                {(cithCentreToDelete as any).assignedLeaders.map((leader: any, index: number) => (
                  <li key={index}>{leader.name}</li>
                ))}
              </ul>
              Deleting this centre will remove their assignments.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Fab
        color="primary"
        onClick={openCreateDialog}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default CithCentreManagement;