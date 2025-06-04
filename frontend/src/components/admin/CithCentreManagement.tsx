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
} from '@mui/material';
import { Add, Edit, Delete, Home, Person, Phone, Email, CheckCircle, Cancel } from '@mui/icons-material';
import api from '../../services/api';
import { CithCentre, AreaSupervisor, District } from '../../types';

const CithCentreManagement: React.FC = () => {
  const [cithCentres, setCithCentres] = useState<CithCentre[]>([]);
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

  useEffect(() => {
    fetchCithCentres();
    fetchAreaSupervisors();
    fetchDistricts();
  }, []);

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">CITH Centres</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Add CITH Centre
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Card>
        <CardContent>
          {loading && cithCentres.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
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
                  {cithCentres.map((cithCentre) => (
                    <TableRow key={cithCentre._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Home fontSize="small" />
                          {cithCentre.name || 'Unknown'}
                        </Box>
                      </TableCell>
                      <TableCell>{cithCentre.location || 'Unknown'}</TableCell>
                      <TableCell>{getAreaSupervisorName(cithCentre)}</TableCell>
                      <TableCell>{getDistrictName(cithCentre)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person fontSize="small" />
                          {(cithCentre as any).leaderName || 'Unassigned'}
                          {(cithCentre as any).hasVacancy && (cithCentre as any).assignedLeaders?.length > 0 && (
                            <Chip 
                              label="Has Vacancy" 
                              size="small" 
                              color="warning" 
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Email fontSize="small" />
                            <Typography variant="caption">
                              {(cithCentre as any).contactEmail || 'Not assigned'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Phone fontSize="small" />
                            <Typography variant="caption">
                              {(cithCentre as any).contactPhone || 'Not assigned'}
                            </Typography>
                          </Box>
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
          )}

          {cithCentres.length === 0 && !loading && (
            <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
              No CITH centres found. Create your first CITH centre to get started.
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
            />
            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              fullWidth
              required
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
              >
                {filteredAreaSupervisors.map((areaSupervisor) => (
                  <MenuItem key={areaSupervisor._id} value={areaSupervisor._id}>
                    {areaSupervisor.name}
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
          >
            {loading ? <CircularProgress size={24} /> : editingCithCentre ? 'Update' : 'Create'}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Delete'}
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