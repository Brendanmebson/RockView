// src/components/messages/MessageList.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Badge,
  Alert,
  CircularProgress,
  Paper,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Inbox,
  Send,
  Delete,
  MarkEmailRead,
  Add,
  Reply,
  Message,
  MoreVert,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ChatMessage from './ChatMessage';

interface MessageUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Message {
  _id: string;
  from: MessageUser | null;
  to: MessageUser | null;
  subject: string;
  content: string;
  isRead: boolean;
  priority: string;
  category: string;
  createdAt: string;
  readAt?: string;
}

// Props interface for ChatMessage component to ensure type safety
interface ChatMessageProps {
  message: {
    _id: string;
    from: MessageUser;
    to: MessageUser;
    subject: string;
    content: string;
    isRead: boolean;
    priority: string;
    category: string;
    createdAt: string;
    readAt?: string;
  };
  onReply: () => void;
  onSelect: (selected: boolean) => void;
  isSelected: boolean;
  showDetails: boolean;
  currentTab: number;
}

const MessageList: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
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

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMessages();
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [currentTab]);

  const fetchMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const type = currentTab === 0 ? 'inbox' : 'sent';
      const response = await api.get(`/messages?type=${type}&limit=50`);
      setMessages(response.data.messages || []);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch messages');
      console.error('Error fetching messages:', error);
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

  const handleReply = (message: Message) => {
    navigate('/messages/compose', { state: { replyTo: message } });
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

  const getFromName = (message: Message) => {
    return message.from?.name || 'Unknown Sender';
  };

  const getToName = (message: Message) => {
    return message.to?.name || 'Unknown Recipient';
  };

  // Helper function to create a safe message for ChatMessage component
  const createSafeMessage = (message: Message): ChatMessageProps['message'] => {
  const defaultUser = {
    _id: 'unknown',
    name: 'Unknown User',
    email: 'unknown@example.com',
    role: 'unknown'
  };

  return {
    _id: message._id,
    from: message.from || defaultUser,
    to: message.to || defaultUser,
    subject: message.subject || 'No Subject',
    content: message.content || '',
    isRead: message.isRead,
    priority: message.priority || 'normal',
    category: message.category || 'general',
    createdAt: message.createdAt,
    readAt: message.readAt
  };
};

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Messages
        </Typography>
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/messages/compose')}
          >
            New Message
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Chat Interface */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
        {/* Tabs Header */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1
        }}>
          <Tabs value={currentTab} onChange={handleTabChange} variant="fullWidth">
            <Tab 
              icon={
                <Badge badgeContent={unreadCount} color="error">
                  <Inbox />
                </Badge>
              } 
              label={isMobile ? '' : 'Inbox'}
              sx={{ minWidth: isMobile ? 'auto' : 120 }}
            />
            <Tab 
              icon={<Send />} 
              label={isMobile ? '' : 'Sent'} 
              sx={{ minWidth: isMobile ? 'auto' : 120 }}
            />
          </Tabs>
          
          {isMobile && (
            <IconButton
              color="primary"
              onClick={() => navigate('/messages/compose')}
              sx={{ ml: 1 }}
            >
              <Add />
            </IconButton>
          )}
        </Box>

        {/* Action Bar */}
        {selectedMessages.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            p: 2, 
            bgcolor: 'action.hover',
            borderBottom: 1,
            borderColor: 'divider'
          }}>
            <Typography variant="body2" sx={{ flexGrow: 1, alignSelf: 'center' }}>
              {selectedMessages.length} message(s) selected
            </Typography>
            {currentTab === 0 && (
              <Button size="small" startIcon={<MarkEmailRead />} onClick={handleMarkAsRead}>
                Mark Read
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

        {/* Messages Container */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
          position: 'relative'
        }}>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%' 
            }}>
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              p: 4
            }}>
              <Message sx={{ fontSize: 64, mb: 2, opacity: 0.3, color: 'text.secondary' }} />
              <Typography variant="h6" gutterBottom color="text.secondary">
                {currentTab === 0 ? 'No messages in inbox' : 'No sent messages'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                {currentTab === 0 
                  ? 'When you receive messages, they\'ll appear here' 
                  : 'Messages you send will appear here'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/messages/compose')}
              >
                Send Your First Message
              </Button>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ChatMessage
                      message={createSafeMessage(message)}
                      onReply={() => handleReply(message)}
                      onSelect={(selected: boolean) => {
                        if (selected) {
                          setSelectedMessages(prev => [...prev, message._id]);
                        } else {
                          setSelectedMessages(prev => prev.filter(id => id !== message._id));
                        }
                      }}
                      isSelected={selectedMessages.includes(message._id)}
                      showDetails={true}
                      currentTab={currentTab}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </Box>
          )}
        </Box>
      </Card>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={() => navigate('/messages/compose')}
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16, 
            zIndex: 1000 
          }}
        >
          <Add />
        </Fab>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Messages</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedMessages.length} message(s)? 
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