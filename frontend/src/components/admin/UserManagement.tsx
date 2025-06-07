// frontend/src/components/admin/UserManagement.tsx
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
  DialogContentText,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  IconButton,
  Tooltip,
  Avatar,
  Box as MuiBox,
  InputAdornment,
  Pagination,
  Paper,
} from '@mui/material';
import { 
  Delete, 
  Edit, 
  Message, 
  Person, 
  Business, 
  Home, 
  AdminPanelSettings,
  Check,
  Close,
  Phone,
  Search,
  FilterList,
  Refresh,
  Clear,
} from '@mui/icons-material';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import GridItem from '../common/GridItem';
import { UserWithDetails } from '../../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [districts, setDistricts] = useState<any[]>([]);
  const [areaSupervisors, setAreaSupervisors] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    role: '',
    targetId: '',
    districtId: '',
    areaId: '',
    phone: '',
  });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchHierarchyData();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [users, searchQuery, roleFilter, statusFilter, sortBy, sortOrder]);

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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchHierarchyData = async () => {
    try {
      const [districtsRes, areasRes, centresRes] = await Promise.all([
        api.get('/districts'),
        api.get('/area-supervisors'),
        api.get('/cith-centres')
      ]);
      
      setDistricts(districtsRes.data);
      setAreaSupervisors(areasRes.data);
      setCentres(centresRes.data);
    } catch (error) {
      console.error('Error fetching hierarchy data:', error);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone && user.phone.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setStatusFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      await api.delete(`/users/${selectedUser._id}`);
      setSuccess('User deleted successfully');
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    let targetId = '';
    if (editForm.role === 'district_pastor') {
      targetId = editForm.districtId;
    } else if (editForm.role === 'area_supervisor') {
      targetId = editForm.areaId;
    } else if (editForm.role === 'cith_centre') {
      targetId = editForm.targetId;
    }
    
    if (!targetId && editForm.role !== 'admin') {
      setError('Please select all required fields');
      return;
    }
    
    if (!editForm.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    
    setLoading(true);
    try {
      await api.put(`/users/${selectedUser._id}/role`, {
        role: editForm.role,
        targetId,
        phone: editForm.phone,
      });
      
      setSuccess('User role updated successfully');
      setEditDialogOpen(false);
      setEditForm({ role: '', targetId: '', districtId: '', areaId: '', phone: '' });
      fetchUsers();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (user: UserWithDetails) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (user: UserWithDetails) => {
    setSelectedUser(user);
    
    let targetId = '';
    let districtId = '';
    let areaId = '';
    
    // Handle both string and object references
    if (user.cithCentreId) {
      if (typeof user.cithCentreId === 'object') {
        targetId = user.cithCentreId._id;
      } else {
        targetId = user.cithCentreId;
      }
    }
    
    if (user.areaSupervisorId) {
      if (typeof user.areaSupervisorId === 'object') {
        targetId = user.areaSupervisorId._id;
        areaId = user.areaSupervisorId._id;
      } else {
        targetId = user.areaSupervisorId;
        areaId = user.areaSupervisorId;
      }
    }
    
    if (user.districtId) {
      if (typeof user.districtId === 'object') {
        targetId = user.districtId._id;
        districtId = user.districtId._id;
      } else {
        targetId = user.districtId;
        districtId = user.districtId;
      }
    }
    
    // Get phone from user data - check multiple possible locations
    const userPhone = user.phone || (user as any).phone || '';
    
    setEditForm({
      role: user.role,
      targetId,
      districtId,
      areaId,
      phone: userPhone,
    });
    setEditDialogOpen(true);
  };

  const handleMessageUser = (user: UserWithDetails) => {
    navigate('/messages/compose', { state: { recipient: user } });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettings color="error" />;
      case 'district_pastor':
        return <Business color="primary" />;
      case 'area_supervisor':
        return <Person color="secondary" />;
      case 'cith_centre':
        return <Home color="success" />;
      default:
        return <Person />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'district_pastor':
        return 'District Pastor';
      case 'area_supervisor':
        return 'Area Supervisor';
      case 'cith_centre':
        return 'CITH Centre Leader';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'district_pastor':
        return 'primary';
      case 'area_supervisor':
        return 'secondary';
      case 'cith_centre':
        return 'success';
      default:
        return 'default';
    }
  };

  const getAssignmentText = (user: UserWithDetails) => {
    if (user.districtId) {
      if (typeof user.districtId === 'object') {
        return `${user.districtId.name} (District ${user.districtId.districtNumber})`;
      } else {
        return 'District Assignment';
      }
    }
    
    if (user.areaSupervisorId) {
      if (typeof user.areaSupervisorId === 'object') {
        return user.areaSupervisorId.name;
      } else {
        return 'Area Assignment';
      }
    }
    
    if (user.cithCentreId) {
      if (typeof user.cithCentreId === 'object') {
        return `${user.cithCentreId.name} - ${user.cithCentreId.location}`;
      } else {
        return 'Centre Assignment';
      }
    }
    
    return 'No assignment';
  };

  const filteredAreas = areaSupervisors.filter(
    (area: any) => !editForm.districtId || area.districtId._id === editForm.districtId
  );

  const filteredCentres = centres.filter(
    (centre: any) => !editForm.areaId || centre.areaSupervisorId._id === editForm.areaId
  );

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>

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
              placeholder="Search users..."
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
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
                <MenuItem value="district_pastor">District Pastor</MenuItem>
                <MenuItem value="area_supervisor">Area Supervisor</MenuItem>
                <MenuItem value="cith_centre">CITH Centre Leader</MenuItem>
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
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
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
                <MenuItem value="createdAt">Date Created</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="role">Role</MenuItem>
              </Select>
            </FormControl>
          </GridItem>
          
          <GridItem xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              >
                <MenuItem value="desc">Descending</MenuItem>
                <MenuItem value="asc">Ascending</MenuItem>
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
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Showing {paginatedUsers.length} of {filteredUsers.length} users
            {searchQuery && ` matching "${searchQuery}"`}
            {roleFilter && ` with role "${getRoleName(roleFilter)}"`}
            {statusFilter && ` that are ${statusFilter}`}
          </Typography>
        </Box>
      </Paper>

      <Card>
        <CardContent>
          {loading && users.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Assignment</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Joined</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar>
                              {user.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {user.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getRoleIcon(user.role)}
                            <Chip
                              label={getRoleName(user.role)}
                              color={getRoleColor(user.role) as any}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {getAssignmentText(user)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.phone || 'Not provided'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive ? 'Active' : 'Inactive'}
                            color={user.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Send Message">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleMessageUser(user)}
                              >
                                <Message fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Role">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => openEditDialog(user)}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete User">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDeleteDialog(user)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
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

          {filteredUsers.length === 0 && !loading && (
            <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
              {searchQuery || roleFilter || statusFilter 
                ? 'No users found matching your search criteria' 
                : 'No users found'}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Role Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit User Role - {selectedUser?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <GridItem xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    role: e.target.value, 
                    targetId: '', 
                    districtId: '', 
                    areaId: '' 
                  })}
                  label="Role"
                >
                  <MenuItem value="admin">Administrator</MenuItem>
                  <MenuItem value="district_pastor">District Pastor</MenuItem>
                  <MenuItem value="area_supervisor">Area Supervisor</MenuItem>
                  <MenuItem value="cith_centre">CITH Centre Leader</MenuItem>
                </Select>
              </FormControl>
            </GridItem>

            <GridItem xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                required
                placeholder="+234 800 123 4567"
                helperText="Enter phone number with country code"
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </GridItem>

            {editForm.role === 'district_pastor' && (
              <GridItem xs={12}>
                <FormControl fullWidth>
                  <InputLabel>District</InputLabel>
                  <Select
                    value={editForm.districtId}
                    onChange={(e) => setEditForm({ ...editForm, districtId: e.target.value })}
                    label="District"
                  >
                    {districts.map((district: any) => (
                      <MenuItem key={district._id} value={district._id}>
                        {district.name} (District {district.districtNumber})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
            )}

            {editForm.role === 'area_supervisor' && (
              <>
                <GridItem xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>District</InputLabel>
                    <Select
                      value={editForm.districtId}
                      onChange={(e) => setEditForm({ ...editForm, districtId: e.target.value, areaId: '' })}
                      label="District"
                    >
                      {districts.map((district: any) => (
                        <MenuItem key={district._id} value={district._id}>
                          {district.name} (District {district.districtNumber})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>
                <GridItem xs={12} md={6}>
                  <FormControl fullWidth disabled={!editForm.districtId}>
                    <InputLabel>Area</InputLabel>
                    <Select
                      value={editForm.areaId}
                      onChange={(e) => setEditForm({ ...editForm, areaId: e.target.value })}
                      label="Area"
                    >
                      {filteredAreas.map((area: any) => (
                        <MenuItem key={area._id} value={area._id}>
                          {area.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>
              </>
            )}

            {editForm.role === 'cith_centre' && (
              <>
                <GridItem xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>District</InputLabel>
                    <Select
                      value={editForm.districtId}
                      onChange={(e) => setEditForm({ ...editForm, districtId: e.target.value, areaId: '', targetId: '' })}
                      label="District"
                    >
                      {districts.map((district: any) => (
                        <MenuItem key={district._id} value={district._id}>
                          {district.name} (District {district.districtNumber})
                        </MenuItem>
                      ))}
                      </Select>
                  </FormControl>
                </GridItem>
                <GridItem xs={12} md={4}>
                  <FormControl fullWidth disabled={!editForm.districtId}>
                    <InputLabel>Area</InputLabel>
                    <Select
                      value={editForm.areaId}
                      onChange={(e) => setEditForm({ ...editForm, areaId: e.target.value, targetId: '' })}
                      label="Area"
                    >
                      {filteredAreas.map((area: any) => (
                        <MenuItem key={area._id} value={area._id}>
                          {area.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>
                <GridItem xs={12} md={4}>
                  <FormControl fullWidth disabled={!editForm.areaId}>
                    <InputLabel>CITH Centre</InputLabel>
                    <Select
                      value={editForm.targetId}
                      onChange={(e) => setEditForm({ ...editForm, targetId: e.target.value })}
                      label="CITH Centre"
                    >
                      {filteredCentres.map((centre: any) => (
                        <MenuItem key={centre._id} value={centre._id}>
                          {centre.name} - {centre.location}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleEditUser} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Check />}
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;