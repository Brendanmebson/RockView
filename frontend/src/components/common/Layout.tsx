// frontend/src/components/common/Layout.tsx (Updated messaging integration)
import React from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  ListItemButton,
  Divider,
  Badge,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  BarChart,
  People,
  Settings,
  ExitToApp,
  Notifications,
  Message,
} from '@mui/icons-material';
import { Church, Building, Home, Users, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageContainer } from './AnimatedComponents';
import { useEffect, useState } from 'react';
import api from '../../services/api';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, userCentre, userArea, userDistrict, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchUnreadCount();
    // Fetch unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/messages/unread/count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path: string) => {
    handleClose();
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

const menuItems = React.useMemo(() => {
  if (!user) return [];

  const common = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', color: '#4A5568' },
    { text: 'Reports', icon: <BarChart />, path: '/reports', color: '#48BB78' },
    { text: 'Messages', icon: <Message />, path: '/messages', color: '#9F7AEA', badge: unreadCount },
    { text: 'Settings', icon: <Settings />, path: '/settings', color: '#805AD5' },
  ];

  switch (user.role) {
    case 'admin':
      return [
        ...common,
        { text: 'Districts', icon: <Building size={20} />, path: '/districts', color: '#E53E3E' },
        { text: 'Area Supervisors', icon: <MapPin size={20} />, path: '/area-supervisors', color: '#ED8936' },
        { text: 'CITH Centres', icon: <Home size={20} />, path: '/cith-centres', color: '#D69E2E' },
        { text: 'Users', icon: <People />, path: '/admin/users', color: '#805AD5' },
        { text: 'Position Requests', icon: <People />, path: '/admin/position-requests', color: '#DD6B20' },
      ];
    case 'district_pastor':
      return [
        ...common,
        { text: 'Area Supervisors', icon: <MapPin size={20} />, path: '/area-supervisors', color: '#ED8936' },
        { text: 'CITH Centres', icon: <Home size={20} />, path: '/cith-centres', color: '#D69E2E' },
      ];
    case 'area_supervisor':
      return [
        ...common,
        { text: 'CITH Centres', icon: <Home size={20} />, path: '/cith-centres', color: '#D69E2E' },
      ];
    default:
      return common;
  }
}, [user, unreadCount]);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleDisplayName = (role: string) => {
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

  // Add this function to render user context
  const renderUserContext = () => {
    if (!user) return null;

    return (
      <Box sx={{ p: 2, background: 'rgba(0,0,0,0.03)', borderRadius: 2, m: 2, mt: 0 }}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Your Church Information
        </Typography>
        
        {userCentre && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Home size={16} color="#D69E2E" />
            <Typography variant="body2">{userCentre.name}</Typography>
          </Box>
        )}
        
        {userArea && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <MapPin size={16} color="#ED8936" />
            <Typography variant="body2">{userArea.name}</Typography>
          </Box>
        )}
        
        {userDistrict && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Building size={16} color="#4A5568" />
            <Typography variant="body2">{userDistrict.name}</Typography>
          </Box>
        )}
      </Box>
    );
  };

  const drawer = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(45deg, #4A5568, #2D3748)' }}>
        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #D69E2E, #ED8936)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 4px 20px rgba(214, 158, 46, 0.3)',
            }}
          >
            <Church size={30} color="white" />
          </Box>
        </motion.div>
        <Typography variant="h5" color="white" fontWeight="bold">
          ClearView
        </Typography>
        <Typography variant="caption" color="rgba(255,255,255,0.7)">
          Church Management System
        </Typography>
      </Box>
      
      <Box sx={{ p: 2, background: '#f8f9fa' }}>
        <Typography variant="body2" color="textSecondary" textAlign="center">
          {getWelcomeMessage()}, {user?.name?.split(' ')[0]}!
        </Typography>
        <Typography variant="caption" color="textSecondary" textAlign="center" display="block">
          {getRoleDisplayName(user?.role || '')}
        </Typography>
      </Box>

      {/* Add User Context Information */}
      {renderUserContext()}

      <List sx={{ px: 2 }}>
        <AnimatePresence>
          {menuItems.map((item, index) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    borderRadius: 3,
                    py: 1.5,
                    '&.Mui-selected': {
                      background: `${item.color}20`,
                      '&:hover': {
                        background: `${item.color}30`,
                      },
                    },
                    '&:hover': {
                      background: `${item.color}10`,
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: item.color, minWidth: 40 }}>
                    {item.badge && item.badge > 0 ? (
                      <Badge badgeContent={item.badge} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: location.pathname === item.path ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </List>
      
      <Divider sx={{ mx: 2, my: 2 }} />
      
      <Box sx={{ p: 2, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', m: 2, borderRadius: 3 }}>
        <Typography variant="caption" color="textSecondary" gutterBottom>
          📊 This Month's Activity
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Box textAlign="center">
            <Typography variant="h6" color="primary">24</Typography>
            <Typography variant="caption">Reports</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" color="success.main">890</Typography>
            <Typography variant="caption">Members</Typography>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(247,250,252,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar>
          <IconButton
            color="primary"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
            {location.pathname === '/dashboard' && '🏠 '}
            {location.pathname === '/reports' && '📊 '}
            {location.pathname === '/messages' && '💬 '}
            {location.pathname === '/districts' && '🏘️ '}
            {location.pathname === '/area-supervisors' && '👥 '}
            {location.pathname === '/cith-centres' && '⛪ '}
            {location.pathname === '/users' && '👤 '}
            {location.pathname.charAt(1).toUpperCase() + location.pathname.slice(2).replace('-', ' ')}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Messages">
              <IconButton color="primary" onClick={() => navigate('/messages')}>
                <Badge badgeContent={unreadCount} color="error">
                  <Message />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notifications">
              <IconButton color="primary">
                <Badge badgeContent={3} color="secondary">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <IconButton
              onClick={handleMenu}
              sx={{ p: 0 }}
            >
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40,
                  background: 'linear-gradient(45deg, #D69E2E, #ED8936)',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                {user?.name?.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  mt: 1,
                },
              }}
            >
              <MenuItem onClick={() => handleMenuItemClick('/settings')} sx={{ py: 1.5, px: 2 }}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                <Box>
                  <Typography variant="body2">Profile Settings</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {user?.email}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 2, color: 'error.main' }}>
                <ListItemIcon>
                  <ExitToApp fontSize="small" sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <Typography variant="body2">Sign Out</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="church navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
             boxSizing: 'border-box', 
             width: drawerWidth,
             background: '#fff',
           },
         }}
       >
         {drawer}
       </Drawer>
       <Drawer
         variant="permanent"
         sx={{
           display: { xs: 'none', sm: 'block' },
           '& .MuiDrawer-paper': { 
             boxSizing: 'border-box', 
             width: drawerWidth,
             background: '#fff',
             borderRight: '1px solid rgba(0,0,0,0.1)',
           },
         }}
         open
       >
         {drawer}
       </Drawer>
     </Box>
     
     <Box
       component="main"
       sx={{ 
         flexGrow: 1, 
         p: 3, 
         width: { sm: `calc(100% - ${drawerWidth}px)` },
         minHeight: '100vh',
         background: '#f8f9fa',
       }}
     >
       <Toolbar />
       <PageContainer>
         {children}
       </PageContainer>
     </Box>
   </Box>
 );
};

export default Layout;