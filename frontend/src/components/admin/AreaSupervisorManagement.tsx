// frontend/src/components/admin/AreaSupervisorManagement.tsx
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
} from '@mui/material';
import { Add, Edit, Delete, Business } from '@mui/icons-material';
import api from '../../services/api';
import { AreaSupervisor, District } from '../../types';

const AreaSupervisorManagement: React.FC = () => {
  const [areaSupervisors, setAreaSupervisors] = useState<AreaSupervisor[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAreaSupervisor, setEditingAreaSupervisor] = useState<AreaSupervisor | null>(null);
  const [areaSupervisorToDelete, setAreaSupervisorToDelete] = useState<AreaSupervisor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    districtId: '',
    supervisorName: '',
  });

  useEffect(() => {
    fetchAreaSupervisors();
    fetchDistricts();
  }, []);

  const fetchAreaSupervisors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/area-supervisors');
      setAreaSupervisors(response.data || []);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch area supervisors');
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

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (editingAreaSupervisor) {
        await api.put(`/area-supervisors/${editingAreaSupervisor._id}`, formData);
        setSuccess('Area supervisor updated successfully');
      } else {
        await api.post('/area-supervisors', formData);
        setSuccess('Area supervisor created successfully');
      }
      
      setDialogOpen(false);
      setEditingAreaSupervisor(null);
      resetForm();
      fetchAreaSupervisors();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (areaSupervisor: AreaSupervisor) => {
    setEditingAreaSupervisor(areaSupervisor);
    setFormData({
      name: areaSupervisor.name || '',
      districtId: typeof areaSupervisor.districtId === 'string' 
        ? areaSupervisor.districtId 
        : areaSupervisor.districtId?._id || '',
      supervisorName: areaSupervisor.supervisorName || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!areaSupervisorToDelete) return;

    setLoading(true);
    try {
      await api.delete(`/area-supervisors/${areaSupervisorToDelete._id}`);
      setSuccess('Area supervisor deleted successfully');
      setDeleteDialogOpen(false);
      setAreaSupervisorToDelete(null);
      fetchAreaSupervisors();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete area supervisor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      districtId: '',
      supervisorName: '',
    });
  };

  const openCreateDialog = () => {
    setEditingAreaSupervisor(null);
    resetForm();
    setDialogOpen(true);
  };

  const openDeleteDialog = (areaSupervisor: AreaSupervisor) => {
    setAreaSupervisorToDelete(areaSupervisor);
    setDeleteDialogOpen(true);
  };

  const getDistrictName = (areaSupervisor: AreaSupervisor) => {
    if (typeof areaSupervisor.districtId === 'object' && areaSupervisor.districtId?.name) {
      return areaSupervisor.districtId.name;
    }
    return 'Unknown District';
  };

  const getDistrictNumber = (areaSupervisor: AreaSupervisor) => {
    if (typeof areaSupervisor.districtId === 'object' && areaSupervisor.districtId?.districtNumber) {
      return areaSupervisor.districtId.districtNumber;
    }
    return 'N/A';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Area Supervisors</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Add Area Supervisor
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Card>
        <CardContent>
          {loading && areaSupervisors.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Area Name</TableCell>
                    <TableCell>District</TableCell>
                    <TableCell>Supervisor</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {areaSupervisors.map((areaSupervisor) => (
                    <TableRow key={areaSupervisor._id}>
                      <TableCell>{areaSupervisor.name || 'Unknown'}</TableCell>
                      <TableCell>
                        {getDistrictName(areaSupervisor)} (District {getDistrictNumber(areaSupervisor)})
                      </TableCell>
                      <TableCell>{areaSupervisor.supervisorName || 'TBD'}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(areaSupervisor)} color="primary">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => openDeleteDialog(areaSupervisor)} color="error">
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

          {areaSupervisors.length === 0 && !loading && (
            <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
              No area supervisors found. Create your first area supervisor to get started.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAreaSupervisor ? 'Edit Area Supervisor' : 'Create New Area Supervisor'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Area Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>District</InputLabel>
              <Select
                value={formData.districtId}
                onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                label="District"
              >
                {districts.map((district) => (
                  <MenuItem key={district._id} value={district._id}>
                    {district.name} (District {district.districtNumber})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Supervisor Name"
              value={formData.supervisorName}
              onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.name || !formData.supervisorName || !formData.districtId}
          >
            {loading ? <CircularProgress size={24} /> : editingAreaSupervisor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Area Supervisor</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{areaSupervisorToDelete?.name}"? This action cannot be undone.
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

export default AreaSupervisorManagement;