// frontend/src/components/common/Layout.tsx
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
  Collapse,
  Button,
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
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { Building, Home, Users, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageContainer } from './AnimatedComponents';
import { useEffect, useState } from 'react';
import { useThemeContext } from '../../context/ThemeContext';
import api from '../../services/api';

// Import the logos
import lightLogo from '../../assets/light-logo.png';
import darkLogo from '../../assets/dark-logo.png';

const drawerWidth = 280;
const collapsedDrawerWidth = 70;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const { user, userCentre, userArea, userDistrict, logout } = useAuth();
  const { darkMode } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();

  const currentDrawerWidth = collapsed ? collapsedDrawerWidth : drawerWidth;

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchNotifications();
    }, 30000);
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

  const fetchNotifications = async () => {
    try {
      // Mock notifications for now - you can implement actual notifications endpoint
      setNotifications([
        {
          id: 1,
          title: 'New Report Submitted',
          message: 'A new weekly report needs your approval',
          time: new Date(),
          read: false,
        },
        {
          id: 2,
          title: 'System Update',
          message: 'The system will be updated tonight',
          time: new Date(Date.now() - 3600000),
          read: true,
        },
      ]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
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
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', color: '#2E7D32' },
      { text: 'Reports', icon: <BarChart />, path: '/reports', color: '#4CAF50' },
      { text: 'Messages', icon: <Message />, path: '/messages', color: '#66BB6A', badge: unreadCount },
      { text: 'Settings', icon: <Settings />, path: '/settings', color: '#388E3C' },
    ];

    switch (user.role) {
      case 'admin':
        return [
          ...common,
          { text: 'Districts', icon: <Building size={20} />, path: '/districts', color: '#1B5E20' },
          { text: 'Zonal Supervisors', icon: <Users size={20} />, path: '/zonal-supervisors', color: '#2E7D32' },
          { text: 'Area Supervisors', icon: <MapPin size={20} />, path: '/area-supervisors', color: '#4CAF50' },
          { text: 'CITH Centres', icon: <Home size={20} />, path: '/cith-centres', color: '#66BB6A' },
          { text: 'Users', icon: <People />, path: '/admin/users', color: '#388E3C' },
        ];
      case 'district_pastor':
        return [
          ...common,
          { text: 'Zonal Supervisors', icon: <Users size={20} />, path: '/zonal-supervisors', color: '#2E7D32' },
          { text: 'Area Supervisors', icon: <MapPin size={20} />, path: '/area-supervisors', color: '#4CAF50' },
          { text: 'CITH Centres', icon: <Home size={20} />, path: '/cith-centres', color: '#66BB6A' },
        ];
      case 'zonal_supervisor':
        return [
          ...common,
          { text: 'Area Supervisors', icon: <MapPin size={20} />, path: '/area-supervisors', color: '#4CAF50' },
          { text: 'CITH Centres', icon: <Home size={20} />, path: '/cith-centres', color: '#66BB6A' },
        ];
      case 'area_supervisor':
        return [
          ...common,
          { text: 'CITH Centres', icon: <Home size={20} />, path: '/cith-centres', color: '#66BB6A' },
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

  const renderUserContext = () => {
    if (!user || collapsed) return null;

    return (
      <Box sx={{ p: 2, background: 'rgba(0,0,0,0.03)', borderRadius: 2, m: 2, mt: 0 }}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Your Church Information
        </Typography>
        
        {userCentre && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Home size={16} color={darkMode ? '#66BB6A' : '#2E7D32'} />
            <Typography variant="body2">{userCentre.name}</Typography>
          </Box>
        )}
        
        {userArea && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <MapPin size={16} color={darkMode ? '#66BB6A' : '#2E7D32'} />
            <Typography variant="body2">{userArea.name}</Typography>
          </Box>
        )}
        
        {userDistrict && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Building size={16} color={darkMode ? '#66BB6A' : '#2E7D32'} />
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
      <Box sx={{ 
        p: collapsed ? 1 : 3, 
        textAlign: 'center', 
        background: darkMode 
          ? 'linear-gradient(45deg, #1B5E20, #0F3C11)'
          : 'linear-gradient(45deg, #2E7D32, #1B5E20)',
        minHeight: collapsed ? 70 : 'auto'
      }}>
        <motion.div
          whileHover={{ scale: collapsed ? 1 : 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Box
            sx={{
              width: collapsed ? 40 : 60,
              height: collapsed ? 40 : 60,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: collapsed ? 0 : 2,
              overflow: 'hidden',
            }}
          >
            <img 
              src={darkMode ? darkLogo : lightLogo} 
              alt="House on the Rock" 
              style={{
                width: collapsed ? 30 : 50,
                height: collapsed ? 30 : 50,
                objectFit: 'contain'
              }}
            />
          </Box>
        </motion.div>
        {!collapsed && (
          <>
            <Typography variant="h5" color="white" fontWeight="bold">
              RockView
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.7)">
              Church Attendance System
            </Typography>
          </>
        )}
      </Box>
      
      {!collapsed && (
        <Box sx={{ p: 2, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f8f9fa' }}>
          <Typography variant="body2" color="textSecondary" textAlign="center">
            {getWelcomeMessage()}, {user?.name?.split(' ')[0]}!
          </Typography>
          <Typography variant="caption" color="textSecondary" textAlign="center" display="block">
            {getRoleDisplayName(user?.role || '')}
          </Typography>
        </Box>
      )}

      {renderUserContext()}

      <List sx={{ px: collapsed ? 1 : 2 }}>
        <AnimatePresence>
          {menuItems.map((item, index) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ListItem disablePadding sx={{ mb: 1 }}>
                <Tooltip title={collapsed ? item.text : ''} placement="right">
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={location.pathname === item.path}
                    sx={{
                      borderRadius: 3,
                      py: 1.5,
                      justifyContent: collapsed ? 'center' : 'flex-start',
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
                    <ListItemIcon sx={{ 
                      color: item.color, 
                      minWidth: collapsed ? 'auto' : 40,
                      justifyContent: 'center'
                    }}>
                      {item.badge && item.badge > 0 ? (
                        <Badge badgeContent={item.badge} color="error">
                          {item.icon}
                        </Badge>
                      ) : (
                        item.icon
                      )}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText 
                        primary={item.text}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: location.pathname === item.path ? 600 : 400,
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </List>
      
      <Divider sx={{ mx: collapsed ? 1 : 2, my: 2 }} />
      
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'center', p: 1 }}>
        <IconButton 
          onClick={handleDrawerCollapse}
          sx={{ 
            bgcolor: 'action.hover',
            '&:hover': {
              bgcolor: 'action.selected',
            }
          }}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>
    </motion.div>
  );

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
          transition: 'width 0.3s, margin-left 0.3s',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
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
              <IconButton color="inherit" onClick={() => navigate('/messages')}>
                <Badge badgeContent={unreadCount} color="error">
                  <Message />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notifications">
              <IconButton color="inherit" onClick={handleNotificationClick}>
                <Badge badgeContent={unreadNotifications} color="secondary">
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
                  background: darkMode 
                    ? 'linear-gradient(45deg, #1B5E20, #0F3C11)'
                    : 'linear-gradient(45deg, #2E7D32, #1B5E20)',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                {user?.name?.charAt(0)}
              </Avatar>
            </IconButton>
            
            {/* User Menu */}
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

            {/* Notifications Menu */}
            <Menu
              anchorEl={notificationAnchorEl}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(notificationAnchorEl)}
              onClose={handleNotificationClose}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  mt: 1,
                  maxWidth: 350,
                  minWidth: 300,
                },
              }}
            >
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Notifications</Typography>
              </Box>
              {notifications.length === 0 ? (
                <MenuItem>
                  <Typography variant="body2" color="textSecondary">
                    No notifications
                  </Typography>
                </MenuItem>
              ) : (
                notifications.map((notification) => (
                  <MenuItem key={notification.id} sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="body2" fontWeight={notification.read ? 400 : 600}>
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', ml: 1 }} />
                        )}
                      </Box>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {notification.time.toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
              <Box sx={{ p: 1, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
                <Button size="small" onClick={() => navigate('/notifications')}>
                  View All
                </Button>
              </Box>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ 
          width: { sm: currentDrawerWidth }, 
          flexShrink: { sm: 0 },
          transition: 'width 0.3s',
        }}
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
              width: currentDrawerWidth,
              transition: 'width 0.3s',
              overflowX: 'hidden',
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
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          minHeight: '100vh',
          transition: 'width 0.3s',
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