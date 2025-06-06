// frontend/src/components/messages/MessageList.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Button,
  Tabs,
  Tab,
  IconButton,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Badge,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Inbox,
  Send,
  Delete,
  MarkEmailRead,
  MarkEmailUnread,
  Add,
  Reply,
  Forward,
  Star,
  StarBorder,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Message {
  _id: string;
  from: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null; // Allow null
  to: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null; // Allow null
  subject: string;
  content: string;
  isRead: boolean;
  priority: string;
  category: string;
  createdAt: string;
  readAt?: string;
}

const MessageList: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, [currentTab]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const type = currentTab === 0 ? 'inbox' : 'sent';
      const response = await api.get(`/messages?type=${type}`);
      setMessages(response.data.messages);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/messages/unread/count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setSelectedMessages([]);
  };

  const handleMessageClick = (messageId: string) => {
    navigate(`/messages/${messageId}`);
  };

  const handleSelectMessage = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleMarkAsRead = async () => {
    try {
      await api.put('/messages/mark-read', { messageIds: selectedMessages });
      fetchMessages();
      fetchUnreadCount();
      setSelectedMessages([]);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to mark messages as read');
    }
  };

  const handleDeleteMessages = async () => {
    try {
      await Promise.all(
        selectedMessages.map(id => api.delete(`/messages/${id}`))
      );
      fetchMessages();
      setSelectedMessages([]);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete messages');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Helper functions to safely get user names
  const getFromName = (message: Message) => {
    return message.from?.name || 'Unknown Sender';
  };

  const getToName = (message: Message) => {
    return message.to?.name || 'Unknown Recipient';
  };

  const getFromInitial = (message: Message) => {
    const name = getFromName(message);
    return name.charAt(0).toUpperCase();
  };

  const getToInitial = (message: Message) => {
    const name = getToName(message);
    return name.charAt(0).toUpperCase();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Messages</Typography>
        <Fab
          color="primary"
          onClick={() => navigate('/messages/compose')}
          sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
        >
          <Add />
        </Fab>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={currentTab} onChange={handleTabChange}>
              <Tab 
                icon={
                  <Badge badgeContent={unreadCount} color="error">
                    <Inbox />
                  </Badge>
                } 
                label="Inbox" 
              />
              <Tab icon={<Send />} label="Sent" />
            </Tabs>
          </Box>

          {selectedMessages.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ flexGrow: 1, alignSelf: 'center' }}>
                {selectedMessages.length} message(s) selected
              </Typography>
              {currentTab === 0 && (
                <Button size="small" startIcon={<MarkEmailRead />} onClick={handleMarkAsRead}>
                  Mark as Read
                </Button>
              )}
              <Button 
                size="small" 
                color="error" 
                startIcon={<Delete />} 
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            </Box>
          )}

          <List>
            {messages.map((message) => (
              <ListItem
                key={message._id}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: message.isRead || currentTab === 1 ? 'transparent' : 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                }}
              >
                <Checkbox
                  checked={selectedMessages.includes(message._id)}
                  onChange={() => handleSelectMessage(message._id)}
                  sx={{ mr: 1 }}
                />
                <ListItemAvatar>
                  <Avatar>
                    {currentTab === 0 
                      ? getFromInitial(message)
                      : getToInitial(message)
                    }
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="body2" 
                        fontWeight={message.isRead || currentTab === 1 ? 'normal' : 'bold'}
                        sx={{ minWidth: 150 }}
                      >
                        {currentTab === 0 ? getFromName(message) : getToName(message)}
                      </Typography>
                      {message.priority !== 'normal' && (
                        <Chip 
                          label={message.priority.toUpperCase()} 
                          size="small" 
                          color={getPriorityColor(message.priority)}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography 
                        variant="body2" 
                        fontWeight={message.isRead || currentTab === 1 ? 'normal' : 'bold'}
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '60ch'
                        }}
                      >
                        {message.subject}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="textSecondary"
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '80ch',
                          display: 'block'
                        }}
                      >
                        {message.content}
                      </Typography>
                    </Box>
                  }
                  onClick={() => handleMessageClick(message._id)}
                />
                <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
                  {formatDate(message.createdAt)}
                </Typography>
              </ListItem>
            ))}
          </List>

          {messages.length === 0 && !loading && (
            <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
              {currentTab === 0 ? 'No messages in inbox' : 'No sent messages'}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Messages</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to Delete {selectedMessages.length} message(s)? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteMessages} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageList;