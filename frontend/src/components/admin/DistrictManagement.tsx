// frontend/src/components/admin/DistrictManagement.tsx
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
} from '@mui/material';
import { Add, Edit, Delete, Business } from '@mui/icons-material';
import api from '../../services/api';
import { District } from '../../types';

const DistrictManagement: React.FC = () => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
  const [districtToDelete, setDistrictToDelete] = useState<District | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    districtNumber: 1,
    pastorName: '',
    description: '',
  });

  useEffect(() => {
    fetchDistricts();
  }, []);

  const fetchDistricts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/districts');
      setDistricts(response.data || []);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch districts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (editingDistrict) {
        await api.put(`/districts/${editingDistrict._id}`, formData);
        setSuccess('District updated successfully');
      } else {
        await api.post('/districts', formData);
        setSuccess('District created successfully');
      }
      
      setDialogOpen(false);
      setEditingDistrict(null);
      resetForm();
      fetchDistricts();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (district: District) => {
    setEditingDistrict(district);
    setFormData({
      name: district.name || '',
      districtNumber: district.districtNumber || 1,
      pastorName: district.pastorName || '',
      description: district.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!districtToDelete) return;

    setLoading(true);
    try {
      await api.delete(`/districts/${districtToDelete._id}`);
      setSuccess('District deleted successfully');
      setDeleteDialogOpen(false);
      setDistrictToDelete(null);
      fetchDistricts();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete district');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      districtNumber: 1,
      pastorName: '',
      description: '',
    });
  };

  const openCreateDialog = () => {
    setEditingDistrict(null);
    resetForm();
    setDialogOpen(true);
  };

  const openDeleteDialog = (district: District) => {
    setDistrictToDelete(district);
    setDeleteDialogOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Districts</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Add District
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Card>
        <CardContent>
          {loading && districts.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>District Number</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Pastor</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {districts.map((district) => (
                    <TableRow key={district._id}>
                      <TableCell>{district.districtNumber}</TableCell>
                      <TableCell>{district.name || 'Unknown'}</TableCell>
                      <TableCell>{district.pastorName || 'TBD'}</TableCell>
                      <TableCell>{district.description || 'No description'}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(district)} color="primary">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => openDeleteDialog(district)} color="error">
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

          {districts.length === 0 && !loading && (
            <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
              No districts found. Create your first district to get started.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDistrict ? 'Edit District' : 'Create New District'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="District Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="District Number"
              type="number"
              value={formData.districtNumber}
              onChange={(e) => setFormData({ ...formData, districtNumber: parseInt(e.target.value) || 1 })}
              fullWidth
              required
              inputProps={{ min: 1, max: 99 }}
            />
            <TextField
              label="Pastor Name"
              value={formData.pastorName}
              onChange={(e) => setFormData({ ...formData, pastorName: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.name || !formData.pastorName}
          >
            {loading ? <CircularProgress size={24} /> : editingDistrict ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete District</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{districtToDelete?.name}"? This action cannot be undone.
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

export default DistrictManagement;