// frontend/src/components/admin/AdminPositionRequests.tsx
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
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { CheckCircle, Cancel, Person, Assignment } from '@mui/icons-material';
import api from '../../services/api';

interface PositionRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  currentRole: string;
  newRole: string;
  targetId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  rejectionReason?: string;
  targetEntityName?: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewedAt?: string;
}

const AdminPositionRequests: React.FC = () => {
  const [requests, setRequests] = useState<PositionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<PositionRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/position-change-requests');
      const requestsWithEntityNames = await Promise.all(
        response.data.map(async (request: PositionRequest) => {
          let targetEntityName = 'Unknown';
          try {
            if (request.newRole === 'district_pastor') {
              const districtResponse = await api.get(`/districts/${request.targetId}`);
              targetEntityName = districtResponse.data.name;
            } else if (request.newRole === 'area_supervisor') {
              const areaResponse = await api.get(`/area-supervisors/${request.targetId}`);
              targetEntityName = areaResponse.data.name;
            } else if (request.newRole === 'cith_centre') {
              const centreResponse = await api.get(`/cith-centres/${request.targetId}`);
              targetEntityName = centreResponse.data.name;
            }
          } catch {
            // Keep default 'Unknown' if fetch fails
          }
          return { ...request, targetEntityName };
        })
      );
      setRequests(requestsWithEntityNames);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch position change requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setLoading(true);
    try {
      await api.put(`/auth/position-change-requests/${requestId}/approve`);
      setSuccess('Position change request approved successfully');
      fetchRequests();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const openRejectDialog = (request: PositionRequest) => {
    setCurrentRequest(request);
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!currentRequest) return;
    
    setLoading(true);
    try {
      await api.put(`/auth/position-change-requests/${currentRequest._id}/reject`, {
        reason: rejectionReason
      });
      
      setSuccess('Position change request rejected');
      setRejectDialogOpen(false);
      setRejectionReason('');
      fetchRequests();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'approved':
        return <Chip label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'cith_centre':
        return 'CITH Centre Leader';
      case 'area_supervisor':
        return 'Area Supervisor';
      case 'district_pastor':
        return 'District Pastor';
      case 'admin':
        return 'Administrator';
      default:
        return role;
    }
  };

  const filteredRequests = requests.filter(request => {
    if (tabValue === 0) return request.status === 'pending';
    if (tabValue === 1) return request.status === 'approved';
    if (tabValue === 2) return request.status === 'rejected';
    return true;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Assignment color="primary" />
        <Typography variant="h4">Position Change Requests</Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`Pending (${requests.filter(r => r.status === 'pending').length})`} />
          <Tab label={`Approved (${requests.filter(r => r.status === 'approved').length})`} />
          <Tab label={`Rejected (${requests.filter(r => r.status === 'rejected').length})`} />
        </Tabs>
      </Paper>
      
      <Card>
        <CardContent>
          {loading && requests.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredRequests.length === 0 ? (
            <Typography variant="body1" textAlign="center" sx={{ py: 3 }}>
              No {tabValue === 0 ? 'pending' : tabValue === 1 ? 'approved' : 'rejected'} requests found
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Current Role</TableCell>
                    <TableCell>Requested Role</TableCell>
                    <TableCell>Target Position</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date Requested</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{request.userId.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {request.userId.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{getRoleName(request.currentRole)}</TableCell>
                      <TableCell>{getRoleName(request.newRole)}</TableCell>
                      <TableCell>{request.targetEntityName || 'Loading...'}</TableCell>
                      <TableCell>{getStatusChip(request.status)}</TableCell>
                      <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              color="success"
                              size="small"
                              startIcon={<CheckCircle />}
                              onClick={() => handleApprove(request._id)}
                              disabled={loading}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<Cancel />}
                              onClick={() => openRejectDialog(request)}
                              disabled={loading}
                            >
                              Reject
                            </Button>
                          </Box>
                        )}
                        {request.status === 'rejected' && request.rejectionReason && (
                          <Typography variant="caption" color="error">
                            Reason: {request.rejectionReason}
                          </Typography>
                        )}
                        {request.status === 'approved' && request.reviewedBy && (
                          <Typography variant="caption" color="success.main">
                            Approved by: {request.reviewedBy.name}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      
      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Position Change Request</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a reason for rejecting this position change request:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Rejection"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleReject} 
            color="error"
            disabled={loading || !rejectionReason.trim()}
          >
            {loading ? <CircularProgress size={24} /> : "Reject Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPositionRequests;