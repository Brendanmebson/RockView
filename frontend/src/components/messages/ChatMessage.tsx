// frontend/src/components/messages/ChatMessage.tsx
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Checkbox,
} from '@mui/material';
import { Reply, MoreVert } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

interface ChatMessageProps {
  message: {
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
  };
  onReply: () => void;
  onSelect: (selected: boolean) => void;
  isSelected: boolean;
  showDetails?: boolean;
  currentTab: number;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onReply,
  onSelect,
  isSelected,
  showDetails = true,
  currentTab
}) => {
  const { user } = useAuth();
  const isFromMe = message.from._id === user?._id;
  const isInbox = currentTab === 0;
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#f44336';
      case 'high': return '#ff9800';
      case 'normal': return '#2196f3';
      case 'low': return '#9e9e9e';
      default: return '#2196f3';
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
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSelect(event.target.checked);
  };

  // For inbox view, show messages from others. For sent view, show messages to others.
  const displayUser = isInbox ? message.from : message.to;
  const displayText = isInbox ? `From: ${displayUser.name}` : `To: ${displayUser.name}`;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        mb: 2,
        alignItems: 'flex-start',
        gap: 1,
        p: 1,
        borderRadius: 2,
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: isSelected ? 'action.selected' : 'action.hover',
        },
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
    >
      {/* Selection Checkbox */}
      <Checkbox
        checked={isSelected}
        onChange={handleSelectChange}
        size="small"
        sx={{ mt: 0.5 }}
      />

      {/* Avatar */}
      <Avatar
        sx={{
          width: 40,
          height: 40,
          bgcolor: getPriorityColor(message.priority),
          fontSize: '0.875rem',
          mt: 0.5,
        }}
      >
        {displayUser.name.charAt(0).toUpperCase()}
      </Avatar>

      {/* Message Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 0.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: message.isRead ? 400 : 600,
                color: message.isRead ? 'text.secondary' : 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayText}
            </Typography>
            {message.priority !== 'normal' && (
              <Chip
                label={message.priority.toUpperCase()}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.6rem',
                  bgcolor: getPriorityColor(message.priority),
                  color: 'white',
                }}
              />
            )}
            {!message.isRead && isInbox && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                }}
              />
            )}
          </Box>
          
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}
          >
            {formatTime(message.createdAt)}
          </Typography>
        </Box>

        {/* Subject */}
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: message.isRead ? 400 : 600,
            color: message.isRead ? 'text.secondary' : 'text.primary',
            mb: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {message.subject}
        </Typography>

        {/* Content Preview */}
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.875rem',
            mb: 1,
          }}
        >
          {message.content}
        </Typography>

        {/* Actions */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 0.5,
          }}
        >
          <Tooltip title="Reply">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onReply();
              }}
              sx={{ p: 0.5 }}
            >
              <Reply fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="More options">
            <IconButton
              size="small"
              sx={{ p: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatMessage;