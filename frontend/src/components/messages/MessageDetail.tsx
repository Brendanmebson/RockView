// frontend/src/components/messages/MessageDetail.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  Reply,
  Forward,
  Delete,
  Person,
  Schedule,
  Subject,
  Category,
  Flag,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Message {
  _id: string;
  from: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  to: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  subject: string;
  content: string;
  isRead: boolean;
  priority: string;
  category: string;
  createdAt: string;
  readAt?: string;
  replyTo?: {
    _id: string;
    subject: string;
    content: string;
    from: {
      name: string;
    };
  };
}

const MessageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchMessage();
    }
  }, [id]);

  const fetchMessage = async () => {
    try {
      const response = await api.get(`/messages/${id}`);
      setMessage(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch message');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = () => {
    if (message) {
      navigate('/messages/compose', { state: { replyTo: message } });
    }
  };

  const handleDelete = async () => {
    if (!message) return;
    
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await api.delete(`/messages/${message._id}`);
        navigate('/messages');
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete message');
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
        return 'primary';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'report':
        return 'info';
      case 'announcement':
        return 'success';
      case 'prayer_request':
        return 'secondary';
      case 'administrative':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoleDisplayName = (role: string) => {
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/messages')}
          variant="outlined"
        >
          Back to Messages
        </Button>
      </Box>
    );
  }

  if (!message) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3 }}>Message not found</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/messages')}
          variant="outlined"
        >
          Back to Messages
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/messages')}
          variant="outlined"
        >
          Back to Messages
        </Button>
        <Typography variant="h4">Message Detail</Typography>
      </Box>

      <Card>
        <CardContent>
          {/* Message Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 56, height: 56 }}>
                {message.from.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">{message.from.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {message.from.email} • {getRoleDisplayName(message.from.role)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {new Date(message.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {message.priority !== 'normal' && (
                <Chip
                  icon={<Flag />}
                  label={message.priority.toUpperCase()}
                  color={getPriorityColor(message.priority)}
                  size="small"
                />
              )}
              <Chip
                icon={<Category />}
                label={message.category.replace('_', ' ').toUpperCase()}
                color={getCategoryColor(message.category)}
                size="small"
              />
            </Box>
          </Box>

          {/* Recipient Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="body2" color="textSecondary">To:</Typography>
            <Typography variant="body2">
              {message.to.name} ({message.to.email})
            </Typography>
          </Box>

          {/* Subject */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Subject color="action" />
            <Typography variant="h6">{message.subject}</Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Reply To (if applicable) */}
          {message.replyTo && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                In reply to:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {message.replyTo.subject}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                From: {message.replyTo.from.name}
              </Typography>
            </Paper>
          )}

          {/* Message Content */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                lineHeight: 1.7,
              }}
            >
              {message.content}
            </Typography>
          </Paper>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              startIcon={<Reply />}
              onClick={handleReply}
              variant="contained"
            >
              Reply
            </Button>
            <Button
              startIcon={<Delete />}
              onClick={handleDelete}
              color="error"
              variant="outlined"
            >
              Delete
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MessageDetail;