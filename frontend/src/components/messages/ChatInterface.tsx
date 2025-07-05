// frontend/src/components/messages/ChatInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
  Badge,
  InputAdornment,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Autocomplete,
  Alert,
} from '@mui/material';
import {
  Send,
  Search,
  MoreVert,
  ArrowBack,
  Add,
  Close,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount?: number;
}

interface ChatMessage {
  _id: string;
  from: ChatUser;
  to: ChatUser;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface ChatConversation {
  user: ChatUser;
  messages: ChatMessage[];
}

const ChatInterface: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState<ChatUser[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUserList, setShowUserList] = useState(!isMobile);
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [selectedNewUser, setSelectedNewUser] = useState<ChatUser | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchAvailableUsers();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom();
      markMessagesAsRead();
    }
  }, [selectedConversation?.messages]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
      if (selectedConversation) {
        fetchMessages(selectedConversation.user._id);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

 const fetchAvailableUsers = async () => {
  try {
    const response = await api.get('/messages/users');
    setAvailableUsers(response.data);
  } catch (error: any) {
    console.error('Error fetching available users:', error);
    setError('Failed to load available users');
    // Fallback to users endpoint
    try {
      const fallbackResponse = await api.get('/users');
      const filteredUsers = fallbackResponse.data.filter((u: any) => u._id !== user?._id);
      setAvailableUsers(filteredUsers);
    } catch (fallbackError) {
      console.error('Fallback fetch also failed:', fallbackError);
      setError('Unable to load users for messaging');
    }
  }
};

  const fetchMessages = async (userId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/conversation/${userId}`);
      const conversation: ChatConversation = {
        user: conversations.find(c => c._id === userId) || response.data.user,
        messages: response.data.messages || []
      };
      setSelectedConversation(conversation);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedConversation?.user) return;
    
    try {
      await api.put('/messages/mark-read', { 
        userId: selectedConversation.user._id 
      });
      fetchConversations(); // Refresh conversations to update unread counts
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation?.user) return;

    try {
      const response = await api.post('/messages/send', {
        to: selectedConversation.user._id,
        content: newMessage.trim(),
        type: 'chat'
      });

      // Add message to current conversation
      setSelectedConversation(prev => ({
        ...prev!,
        messages: [...prev!.messages, response.data]
      }));

      setNewMessage('');
      fetchConversations(); // Refresh conversations list
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.message || 'Failed to send message');
    }
  };

  const startNewConversation = async () => {
    if (!selectedNewUser) return;

    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(c => c._id === selectedNewUser._id);
      
      if (existingConversation) {
        setSelectedConversation({
          user: existingConversation,
          messages: []
        });
        fetchMessages(existingConversation._id);
      } else {
        // Create new conversation
        setSelectedConversation({
          user: selectedNewUser,
          messages: []
        });
      }
      
      setNewChatDialogOpen(false);
      setSelectedNewUser(null);
      if (isMobile) setShowUserList(false);
    } catch (error) {
      console.error('Error starting new conversation:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
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

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ConversationsList = () => (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Messages</Typography>
          <IconButton 
            color="primary" 
            onClick={() => setNewChatDialogOpen(true)}
            size="small"
          >
            <Add />
          </IconButton>
        </Box>
        <TextField
          fullWidth
          placeholder="Search conversations..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        <AnimatePresence>
          {filteredConversations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </Typography>
              {!searchQuery && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setNewChatDialogOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Start New Chat
                </Button>
              )}
            </Box>
          ) : (
            filteredConversations.map((conversation, index) => (
              <motion.div
                key={conversation._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <ListItem
                  button
                  onClick={() => {
                    fetchMessages(conversation._id);
                    if (isMobile) setShowUserList(false);
                  }}
                  selected={selectedConversation?.user._id === conversation._id}
                  sx={{
                    py: 2,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={conversation.unreadCount || 0}
                      color="error"
                      overlap="circular"
                    >
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {conversation.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: conversation.unreadCount ? 600 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {conversation.name}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ display: 'block' }}
                        >
                          {getRoleDisplayName(conversation.role)}
                        </Typography>
                        {conversation.lastMessage && (
                          <>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: conversation.unreadCount ? 500 : 400,
                                mt: 0.5,
                              }}
                            >
                              {conversation.lastMessage.content}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {formatTime(conversation.lastMessage.createdAt)}
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </List>
    </Paper>
  );

  const ChatArea = () => {
    if (!selectedConversation) {
      return (
        <Paper sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          bgcolor: 'grey.50'
        }}>
          <Typography variant="h6" color="textSecondary">
            Select a conversation to start messaging
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setNewChatDialogOpen(true)}
          >
            Start New Chat
          </Button>
        </Paper>
      );
    }

    return (
      <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'primary.light',
          color: 'white'
        }}>
          {isMobile && (
            <IconButton onClick={() => setShowUserList(true)} sx={{ color: 'white' }}>
              <ArrowBack />
            </IconButton>
          )}
          <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
            {selectedConversation.user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {selectedConversation.user.name}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {getRoleDisplayName(selectedConversation.user.role)}
            </Typography>
          </Box>
          <IconButton sx={{ color: 'white' }}>
            <MoreVert />
          </IconButton>
        </Box>

        {/* Messages Area */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: '#f5f5f5'
        }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <AnimatePresence>
                {selectedConversation.messages.map((message, index) => {
                  const isFromMe = message.from._id === user?._id;
                  
                  return (
                    <motion.div
                      key={message._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: isFromMe ? 'flex-end' : 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Paper
                          elevation={1}
                          sx={{
                            p: 1.5,
                            maxWidth: '70%',
                            backgroundColor: isFromMe ? 'primary.main' : 'white',
                            color: isFromMe ? 'white' : 'text.primary',
                           borderRadius: isFromMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                           boxShadow: isFromMe 
                             ? '0 2px 8px rgba(25, 118, 210, 0.3)' 
                             : '0 2px 8px rgba(0, 0, 0, 0.1)',
                         }}
                       >
                         <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                           {message.content}
                         </Typography>
                         <Typography 
                           variant="caption" 
                           sx={{ 
                             opacity: 0.7,
                             display: 'block',
                             textAlign: 'right',
                             mt: 0.5,
                             fontSize: '0.65rem'
                           }}
                         >
                           {formatTime(message.createdAt)}
                         </Typography>
                       </Paper>
                     </Box>
                   </motion.div>
                 );
               })}
             </AnimatePresence>
             <div ref={messagesEndRef} />
           </>
         )}
       </Box>

       {/* Message Input */}
       <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'white' }}>
         <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
           <TextField
             fullWidth
             multiline
             maxRows={4}
             placeholder="Type a message..."
             value={newMessage}
             onChange={(e) => setNewMessage(e.target.value)}
             onKeyPress={handleKeyPress}
             variant="outlined"
             size="small"
             sx={{
               '& .MuiOutlinedInput-root': {
                 borderRadius: '20px',
                 bgcolor: 'grey.50',
               },
             }}
           />
           <Button
             variant="contained"
             onClick={sendMessage}
             disabled={!newMessage.trim()}
             sx={{ 
               minWidth: 'auto', 
               p: 1.5,
               borderRadius: '50%',
               width: 48,
               height: 48,
             }}
           >
             <Send />
           </Button>
         </Box>
       </Box>
     </Paper>
   );
 };

 return (
   <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', gap: 2 }}>
     {error && (
       <Alert 
         severity="error" 
         sx={{ 
           position: 'fixed', 
           top: 20, 
           right: 20, 
           zIndex: 1000 
         }}
         onClose={() => setError('')}
       >
         {error}
       </Alert>
     )}

     {/* Desktop Layout */}
     {!isMobile && (
       <>
         <Box sx={{ width: 350 }}>
           <ConversationsList />
         </Box>
         <Box sx={{ flex: 1 }}>
           <ChatArea />
         </Box>
       </>
     )}

     {/* Mobile Layout */}
     {isMobile && (
       <Box sx={{ width: '100%' }}>
         {showUserList ? <ConversationsList /> : <ChatArea />}
       </Box>
     )}

     {/* New Chat Dialog */}
     <Dialog 
       open={newChatDialogOpen} 
       onClose={() => setNewChatDialogOpen(false)}
       maxWidth="sm"
       fullWidth
     >
       <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         Start New Conversation
         <IconButton onClick={() => setNewChatDialogOpen(false)}>
           <Close />
         </IconButton>
       </DialogTitle>
       <DialogContent>
         <Box sx={{ pt: 1 }}>
           <Autocomplete
             value={selectedNewUser}
             onChange={(event, newValue) => setSelectedNewUser(newValue)}
             options={availableUsers.filter(u => !conversations.some(c => c._id === u._id))}
             getOptionLabel={(option) => `${option.name} (${getRoleDisplayName(option.role)})`}
             renderOption={(props, option) => (
               <Box component="li" {...props}>
                 <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                   {option.name.charAt(0).toUpperCase()}
                 </Avatar>
                 <Box>
                   <Typography variant="body2">{option.name}</Typography>
                   <Typography variant="caption" color="textSecondary">
                     {option.email} • {getRoleDisplayName(option.role)}
                   </Typography>
                 </Box>
               </Box>
             )}
             renderInput={(params) => (
               <TextField
                 {...params}
                 label="Select a person to message"
                 placeholder="Search by name or email..."
                 fullWidth
               />
             )}
             sx={{ mb: 2 }}
           />
           <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
             <Button onClick={() => setNewChatDialogOpen(false)}>
               Cancel
             </Button>
             <Button
               variant="contained"
               onClick={startNewConversation}
               disabled={!selectedNewUser}
             >
               Start Chat
             </Button>
           </Box>
         </Box>
       </DialogContent>
     </Dialog>
   </Box>
 );
};

export default ChatInterface;