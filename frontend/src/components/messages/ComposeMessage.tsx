// frontend/src/components/messages/ComposeMessage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Autocomplete,
  Chip,
  Grid,
} from '@mui/material';
import { Send, ArrowBack, AttachFile } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import GridItem from '../common/GridItem';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const ComposeMessage: React.FC = () => {
  const [recipient, setRecipient] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchAvailableUsers();
    
    // Check if recipient was passed from another component
    if (location.state?.recipient) {
      setRecipient(location.state.recipient);
    }
    
    // Check if it's a reply
    if (location.state?.replyTo) {
      const original = location.state.replyTo;
      setRecipient(original.from);
      setSubject(`Re: ${original.subject}`);
      setContent(`\n\n--- Original Message ---\nFrom: ${original.from.name}\nDate: ${new Date(original.createdAt).toLocaleString()}\nSubject: ${original.subject}\n\n${original.content}`);
    }
  }, [location.state]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/users/hierarchy');
      setAvailableUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSend = async () => {
    if (!recipient || !subject.trim() || !content.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await api.post('/messages', {
        to: recipient._id,
        subject: subject.trim(),
        content: content.trim(),
        priority,
        category,
        replyTo: location.state?.replyTo?._id,
      });
      
      setSuccess('Message sent successfully!');
      setTimeout(() => {
        navigate('/messages');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
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
        <Typography variant="h4">Compose Message</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <GridItem xs={12}>
              <Autocomplete
                value={recipient}
                onChange={(event, newValue) => setRecipient(newValue)}
                options={availableUsers}
                getOptionLabel={(option) => `${option.name} (${option.email})`}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
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
                    label="To"
                    required
                    placeholder="Select recipient..."
                  />
                )}
                disabled={!!location.state?.recipient || !!location.state?.replyTo}
              />
            </GridItem>

            <GridItem xs={12} md={8}>
              <TextField
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                fullWidth
                required
              />
            </GridItem>

            <GridItem xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </GridItem>

            <GridItem xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="report">Report Related</MenuItem>
                  <MenuItem value="announcement">Announcement</MenuItem>
                  <MenuItem value="prayer_request">Prayer Request</MenuItem>
                  <MenuItem value="administrative">Administrative</MenuItem>
                </Select>
              </FormControl>
            </GridItem>

            <GridItem xs={12}>
              <TextField
               label="Message"
               value={content}
               onChange={(e) => setContent(e.target.value)}
               multiline
               rows={12}
               fullWidth
               required
               placeholder="Enter your message here..."
             />
           </GridItem>

           <GridItem xs={12}>
             <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
               <Button
                 onClick={() => navigate('/messages')}
                 variant="outlined"
               >
                 Cancel
               </Button>
               <Button
                 onClick={handleSend}
                 variant="contained"
                 startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                 disabled={loading || !recipient || !subject.trim() || !content.trim()}
               >
                 {loading ? 'Sending...' : 'Send Message'}
               </Button>
             </Box>
           </GridItem>
         </Grid>
       </CardContent>
     </Card>
   </Box>
 );
};

export default ComposeMessage;