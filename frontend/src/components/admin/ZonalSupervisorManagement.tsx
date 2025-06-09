// frontend/src/components/admin/ZonalSupervisorManagement.tsx
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
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import { Add, Edit, Delete, Business, Person, Phone, Email } from '@mui/icons-material';
import api from '../../services/api';
import { ZonalSupervisor, District, AreaSupervisor } from '../../types';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const ZonalSupervisorManagement: React.FC = () => {
  const [zonalSupervisors, setZonalSupervisors] = useState<ZonalSupervisor[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [areaSupervisors, setAreaSupervisors] = useState<AreaSupervisor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingZonalSupervisor, setEditingZonalSupervisor] = useState<ZonalSupervisor | null>(null);
  const [zonalSupervisorToDelete, setZonalSupervisorToDelete] = useState<ZonalSupervisor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    districtId: '',
    areaSupervisorIds: [] as string[],
  });

  useEffect(() => {
    fetchZonalSupervisors();
    fetchDistricts();
    fetchAreaSupervisors();
  }, []);

  const fetchZonalSupervisors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/zonal-supervisors');
      setZonalSupervisors(response.data || []);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch zonal supervisors');
    } finally {
      setLoading(false);
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

  const fetchAreaSupervisors = async () => {
    try {
      const response = await api.get('/area-supervisors');
      setAreaSupervisors(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch area supervisors:', error);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (editingZonalSupervisor) {
        await api.put(`/zonal-supervisors/${editingZonalSupervisor._id}`, formData);
        setSuccess('Zonal supervisor updated successfully');
      } else {
        await api.post('/zonal-supervisors', formData);
        setSuccess('Zonal supervisor created successfully');
      }
      
      setDialogOpen(false);
      setEditingZonalSupervisor(null);
      resetForm();
      fetchZonalSupervisors();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (zonalSupervisor: ZonalSupervisor) => {
    setEditingZonalSupervisor(zonalSupervisor);
    setFormData({
      name: zonalSupervisor.name || '',
      districtId: typeof zonalSupervisor.districtId === 'string' 
        ? zonalSupervisor.districtId 
        : zonalSupervisor.districtId?._id || '',
      areaSupervisorIds: zonalSupervisor.areaSupervisorIds?.map(area => 
        typeof area === 'string' ? area : area._id
      ) || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!zonalSupervisorToDelete) return;

    setLoading(true);
    try {
      await api.delete(`/zonal-supervisors/${zonalSupervisorToDelete._id}`);
      setSuccess('Zonal supervisor deleted successfully');
      setDeleteDialogOpen(false);
      setZonalSupervisorToDelete(null);
      fetchZonalSupervisors();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete zonal supervisor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      districtId: '',
      areaSupervisorIds: [],
    });
  };

  const openCreateDialog = () => {
    setEditingZonalSupervisor(null);
    resetForm();
    setDialogOpen(true);
  };

  const openDeleteDialog = (zonalSupervisor: ZonalSupervisor) => {
    setZonalSupervisorToDelete(zonalSupervisor);
    setDeleteDialogOpen(true);
  };

  const getDistrictName = (zonalSupervisor: ZonalSupervisor) => {
    if (typeof zonalSupervisor.districtId === 'object' && zonalSupervisor.districtId?.name) {
      return zonalSupervisor.districtId.name;
    }
    return 'Unknown District';
  };

  const getDistrictNumber = (zonalSupervisor: ZonalSupervisor) => {
    if (typeof zonalSupervisor.districtId === 'object' && zonalSupervisor.districtId?.districtNumber) {
      return zonalSupervisor.districtId.districtNumber;
    }
    return 'N/A';
  };

  const getAreaNames = (zonalSupervisor: ZonalSupervisor) => {
    if (!zonalSupervisor.areaSupervisorIds || zonalSupervisor.areaSupervisorIds.length === 0) {
      return 'No areas assigned';
    }
    
    return zonalSupervisor.areaSupervisorIds.map(area => {
      if (typeof area === 'object' && area.name) {
        return area.name;
      }
      return 'Unknown Area';
    }).join(', ');
  };

  const handleAreaChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      areaSupervisorIds: typeof value === 'string' ? value.split(',') : value,
    });
  };

  // Filter area supervisors based on selected district
  const filteredAreaSupervisors = formData.districtId
    ? areaSupervisors.filter(area => {
        const areaDistrictId = typeof area.districtId === 'string' 
          ? area.districtId 
          : area.districtId?._id;
        return areaDistrictId === formData.districtId;
      })
    : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Zonal Supervisors</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Add Zonal Supervisor
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Card>
        <CardContent>
          {loading && zonalSupervisors.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Zone Name</TableCell>
                    <TableCell>District</TableCell>
                    <TableCell>Areas Supervised</TableCell>
                    <TableCell>Supervisor</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {zonalSupervisors.map((zonalSupervisor) => (
                    <TableRow key={zonalSupervisor._id}>
                      <TableCell>{zonalSupervisor.name || 'Unknown'}</TableCell>
                      <TableCell>
                        {getDistrictName(zonalSupervisor)} (District {getDistrictNumber(zonalSupervisor)})
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {getAreaNames(zonalSupervisor)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {zonalSupervisor.areaSupervisorIds?.length || 0} area(s)
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person fontSize="small" />
                          {(zonalSupervisor as any).supervisorName || 'Unassigned'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Email fontSize="small" />
                            <Typography variant="caption">
                              {(zonalSupervisor as any).contactEmail || 'Not assigned'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Phone fontSize="small" />
                            <Typography variant="caption">
                              {(zonalSupervisor as any).contactPhone || 'Not assigned'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={(zonalSupervisor as any).isAssigned ? 'Assigned' : 'Unassigned'}
                          color={(zonalSupervisor as any).isAssigned ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(zonalSupervisor)} color="primary">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => openDeleteDialog(zonalSupervisor)} color="error">
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

          {zonalSupervisors.length === 0 && !loading && (
            <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
              No zonal supervisors found. Create your first zonal supervisor to get started.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingZonalSupervisor ? 'Edit Zonal Supervisor' : 'Create New Zonal Supervisor'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Zone Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>District</InputLabel>
              <Select
                value={formData.districtId}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  districtId: e.target.value,
                  areaSupervisorIds: [] // Reset areas when district changes
                })}
                label="District"
              >
                {districts.map((district) => (
                  <MenuItem key={district._id} value={district._id}>
                    {district.name} (District {district.districtNumber})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {formData.districtId && (
              <FormControl fullWidth required>
                <InputLabel>Area Supervisors</InputLabel>
                <Select
                  multiple
                  value={formData.areaSupervisorIds}
                  onChange={handleAreaChange}
                  input={<OutlinedInput label="Area Supervisors" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const area = filteredAreaSupervisors.find(a => a._id === value);
                        return (
                          <Chip key={value} label={area?.name || value} size="small" />
                        );
                      })}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {filteredAreaSupervisors.map((area) => (
                    <MenuItem key={area._id} value={area._id}>
                      {area.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Supervisor contact information will be automatically filled when a user registers and assigns themselves to this zone.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.name || !formData.districtId || formData.areaSupervisorIds.length === 0}
          >
            {loading ? <CircularProgress size={24} /> : editingZonalSupervisor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Zonal Supervisor</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{zonalSupervisorToDelete?.name}"? This action cannot be undone.
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

export default ZonalSupervisorManagement;