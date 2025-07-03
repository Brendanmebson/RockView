// src/components/common/Layout.tsx
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
  Button,
  useMediaQuery,
  useTheme,
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
import { notificationService } from '../../services/notificationService';
// Import the logos
import lightLogo from '../../assets/light-logo.png';
import darkLogo from '../../assets/dark-logo.png';

const drawerWidth = 280;
const collapsedDrawerWidth = 70;
const mobileDrawerWidth = 250;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(isMobile);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const { user, userCentre, userArea, userDistrict, logout } = useAuth();
  const { darkMode } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();

  const currentDrawerWidth = isMobile ? mobileDrawerWidth : (collapsed ? collapsedDrawerWidth : drawerWidth);

  useEffect(() => {
    const handleNotificationUpdate = (updatedNotifications: any[]) => {
      setNotifications(updatedNotifications);
    };
      notificationService.startPolling(30000); // Poll every 30 seconds

    notificationService.addListener(handleNotificationUpdate);
    
    return () => {
      notificationService.removeListener(handleNotificationUpdate);
    };
  }, []);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile && !collapsed) {
      setCollapsed(true);
    }
  }, [isMobile]);

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
    await notificationService.fetchNotifications();
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
};

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    if (!isMobile) {
      setCollapsed(!collapsed);
    }
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

  // Updated menu items with varied colors
  const menuItems = React.useMemo(() => {
    if (!user) return [];

    const common = [
      { 
        text: 'Dashboard', 
        icon: <Dashboard />, 
        path: '/dashboard', 
        color: darkMode ? '#64B5F6' : '#1976D2',
        badge: 0 
      },
      { 
        text: 'Reports', 
        icon: <BarChart />, 
        path: '/reports', 
        color: darkMode ? '#81C784' : '#388E3C',
        badge: 0 
      },
      { 
        text: 'Messages', 
        icon: <Message />, 
        path: '/messages', 
        color: darkMode ? '#FFB74D' : '#F57C00',
        badge: unreadCount 
      },
      { 
        text: 'Settings', 
        icon: <Settings />, 
        path: '/settings', 
        color: darkMode ? '#A1A1A1' : '#616161',
        badge: 0 
      },
    ];

    switch (user.role) {
      case 'admin':
        return [
          ...common,
          { 
            text: 'Districts', 
            icon: <Building size={20} />, 
            path: '/districts', 
            color: darkMode ? '#E57373' : '#D32F2F',
            badge: 0 
          },
          { 
            text: 'Zonal Supervisors', 
            icon: <Users size={20} />, 
            path: '/zonal-supervisors', 
            color: darkMode ? '#BA68C8' : '#7B1FA2',
            badge: 0 
          },
          { 
            text: 'Area Supervisors', 
            icon: <MapPin size={20} />, 
            path: '/area-supervisors', 
            color: darkMode ? '#4FC3F7' : '#0288D1',
            badge: 0 
          },
          { 
            text: 'CITH Centres', 
            icon: <Home size={20} />, 
            path: '/cith-centres', 
            color: darkMode ? '#FFD54F' : '#FFA000',
            badge: 0 
          },
          { 
            text: 'Users', 
            icon: <People />, 
            path: '/admin/users', 
            color: darkMode ? '#FF8A65' : '#E64A19',
            badge: 0 
          },
        ];
      case 'district_pastor':
        return [
          ...common,
          { 
            text: 'Zonal Supervisors', 
            icon: <Users size={20} />, 
            path: '/zonal-supervisors', 
            color: darkMode ? '#BA68C8' : '#7B1FA2',
            badge: 0 
          },
          { 
            text: 'Area Supervisors', 
            icon: <MapPin size={20} />, 
            path: '/area-supervisors', 
            color: darkMode ? '#4FC3F7' : '#0288D1',
            badge: 0 
          },
          { 
            text: 'CITH Centres', 
            icon: <Home size={20} />, 
            path: '/cith-centres', 
            color: darkMode ? '#FFD54F' : '#FFA000',
            badge: 0 
          },
        ];
      case 'zonal_supervisor':
        return [
          ...common,
          { 
            text: 'Area Supervisors', 
            icon: <MapPin size={20} />, 
            path: '/area-supervisors', 
            color: darkMode ? '#4FC3F7' : '#0288D1',
            badge: 0 
          },
          { 
            text: 'CITH Centres', 
            icon: <Home size={20} />, 
            path: '/cith-centres', 
            color: darkMode ? '#FFD54F' : '#FFA000',
            badge: 0 
          },
        ];
      case 'area_supervisor':
        return [
          ...common,
          { 
            text: 'CITH Centres', 
            icon: <Home size={20} />, 
            path: '/cith-centres', 
            color: darkMode ? '#FFD54F' : '#FFA000',
            badge: 0 
          },
        ];
      default:
        return common;
    }
  }, [user, unreadCount, darkMode]);

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
      case 'zonal_supervisor':
        return 'Zonal Supervisor';
      case 'district_pastor':
        return 'District Pastor';
      case 'admin':
        return 'Administrator';
      default:
        return role;
    }
  };

  const renderUserContext = () => {
    if (!user || (collapsed && !isMobile)) return null;

    const contextItemColor = darkMode ? '#A5D6A7' : '#2E7D32';

    return (
      <Box sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        background: 'rgba(0,0,0,0.03)', 
        borderRadius: 2, 
        m: { xs: 1, sm: 2 }, 
        mt: 0,
        display: collapsed && !isMobile ? 'none' : 'block'
      }}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          Your Church Information
        </Typography>
        
        {userCentre && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Home size={16} color={contextItemColor} />
            <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {userCentre.name}
            </Typography>
          </Box>
        )}
        
        {userArea && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <MapPin size={16} color={contextItemColor} />
            <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {userArea.name}
            </Typography>
          </Box>
        )}
        
        {userDistrict && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Building size={16} color={contextItemColor} />
            <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {userDistrict.name}
            </Typography>
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
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ 
        p: collapsed && !isMobile ? 1 : { xs: 2, sm: 3 }, 
        textAlign: 'center', 
        background: darkMode 
          ? 'linear-gradient(45deg, #1B5E20, #0F3C11)'
          : 'linear-gradient(45deg, #2E7D32, #1B5E20)',
        minHeight: collapsed && !isMobile ? 70 : 'auto'
      }}>
        <motion.div
          whileHover={{ scale: (!collapsed || isMobile) ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Box
            sx={{
              width: collapsed && !isMobile ? 40 : { xs: 50, sm: 60 },
              height: collapsed && !isMobile ? 40 : { xs: 50, sm: 60 },
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: collapsed && !isMobile ? 0 : { xs: 1.5, sm: 2 },
              overflow: 'hidden',
            }}
          >
            <img 
              src={darkMode ? darkLogo : lightLogo} 
              alt="House on the Rock" 
              style={{
                width: collapsed && !isMobile ? 30 : isMobile ? 40 : 50,
                height: collapsed && !isMobile ? 30 : isMobile ? 40 : 50,
                objectFit: 'contain'
              }}
            />
          </Box>
        </motion.div>
        {(!collapsed || isMobile) && (
          <>
            <Typography variant="h5" color="white" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              RockView
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.7)" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
              Church Attendance System
            </Typography>
          </>
        )}
      </Box>
      
      {(!collapsed || isMobile) && (
        <Box sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          background: darkMode ? 'rgba(255,255,255,0.05)' : '#f8f9fa' 
        }}>
          <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {getWelcomeMessage()}, {user?.name?.split(' ')[0]}!
          </Typography>
          <Typography variant="caption" color="textSecondary" textAlign="center" display="block" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
            {getRoleDisplayName(user?.role || '')}
          </Typography>
        </Box>
      )}

      {renderUserContext()}

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ px: collapsed && !isMobile ? 1 : { xs: 1, sm: 2 } }}>
          <AnimatePresence>
            {menuItems.map((item, index) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <Tooltip title={(collapsed && !isMobile) ? item.text : ''} placement="right">
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      selected={location.pathname === item.path}
                      sx={{
                        borderRadius: 3,
                        py: { xs: 1, sm: 1.5 },
                        justifyContent: (collapsed && !isMobile) ? 'center' : 'flex-start',
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
                        minWidth: (collapsed && !isMobile) ? 'auto' : { xs: 35, sm: 40 },
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
                      {(!collapsed || isMobile) && (
                        <ListItemText 
                          primary={item.text}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: location.pathname === item.path ? 600 : 400,
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
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
      </Box>
      
      <Box sx={{ mt: 'auto' }}>
        <Divider sx={{ mx: (collapsed && !isMobile) ? 1 : { xs: 1, sm: 2 }, my: 2 }} />
        
        {!isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
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
        )}
      </Box>
    </motion.div>
  );

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <Box sx={{ display: 'flex', width: '100%', overflow: 'hidden', height: '100vh' }}>
      <CssBaseline />
      
      {/* Sidebar/Drawer - Highest z-index */}
      <Box
        component="nav"
        sx={{ 
          width: { sm: currentDrawerWidth }, 
          flexShrink: { sm: 0 },
          transition: 'width 0.3s',
    zIndex: { xs: theme.zIndex.drawer + 20, sm: theme.zIndex.drawer + 10 }, // Higher on mobile
          position: 'relative',
          height: '100vh',
        }}
        aria-label="church navigation"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: mobileDrawerWidth,
              zIndex: theme.zIndex.drawer + 25,
              height: '100vh',
            },
            '& .MuiBackdrop-root': {
        zIndex: theme.zIndex.drawer + 24,
            }
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: currentDrawerWidth,
              transition: 'width 0.3s',
              overflowX: 'hidden',
              position: 'fixed',
              height: '100vh',
              zIndex: theme.zIndex.drawer + 10,
              top: 0,
              left: 0,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { 
            xs: '100%',
            sm: `calc(100% - ${currentDrawerWidth}px)` 
          },
          marginLeft: { xs: 0, sm: 0 }, // Remove margin since drawer is fixed
          transition: 'width 0.3s',
          overflow: 'hidden',
          maxWidth: '100%',
          height: '100vh',
        }}
      >
        {/* AppBar - Lower z-index */}
        <AppBar
          position="relative"
          sx={{
            width: '100%',
      zIndex: { xs: theme.zIndex.drawer - 1, sm: theme.zIndex.drawer + 1 }, // Lower on mobile
            boxShadow: 1,
          }}
        >
          <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              {location.pathname === '/dashboard' && '🏠 '}
              {location.pathname === '/reports' && '📊 '}
              {location.pathname === '/messages' && '💬 '}
              {location.pathname === '/districts' && '🏘️ '}
              {location.pathname === '/area-supervisors' && '👥 '}
              {location.pathname === '/cith-centres' && '⛪ '}
              {location.pathname === '/users' && '👤 '}
              {location.pathname.charAt(1).toUpperCase() + location.pathname.slice(2).replace('-', ' ')}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
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
                    width: { xs: 35, sm: 40 }, 
                    height: { xs: 35, sm: 40 },
                    background: darkMode 
                      ? 'linear-gradient(45deg, #1B5E20, #0F3C11)'
                      : 'linear-gradient(45deg, #2E7D32, #1B5E20)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: { xs: '0.9rem', sm: '1rem' }
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
                    minWidth: { xs: 200, sm: 250 }
                  },
                }}
              >
                <MenuItem onClick={() => handleMenuItemClick('/settings')} sx={{ py: 1.5, px: 2 }}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Profile Settings
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      {user?.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 2, color: 'error.main' }}>
                  <ListItemIcon>
                    <ExitToApp fontSize="small" sx={{ color: 'error.main' }} />
                  </ListItemIcon>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Sign Out
                  </Typography>
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
                    maxWidth: { xs: 280, sm: 350 },
                    minWidth: { xs: 250, sm: 300 },
                  },
                }}
              >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Notifications
                  </Typography>
                </Box>
               {notifications.length === 0 ? (
  <MenuItem>
    <Typography variant="body2" color="textSecondary">
      No notifications
    </Typography>
  </MenuItem>
) : (
  notifications.slice(0, 5).map((notification) => ( // Show only first 5
    <MenuItem 
      key={notification._id} 
      sx={{ 
        py: 1.5, 
        borderBottom: 1, 
        borderColor: 'divider',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover',
        }
      }}
      onClick={() => {
        if (notification.actionUrl) {
          navigate(notification.actionUrl);
        }
        notificationService.markAsRead(notification._id);
        handleNotificationClose();
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography 
            variant="body2" 
            fontWeight={notification.read ? 400 : 600} 
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            {notification.title}
          </Typography>
          {!notification.read && (
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: notification.type === 'report_rejected' ? 'error.main' : 
                        notification.type === 'report_approved' ? 'success.main' :
                        notification.type === 'report_submitted' ? 'warning.main' : 'primary.main',
              ml: 1 
            }} />
          )}
        </Box>
        <Typography 
          variant="caption" 
          color="textSecondary" 
          sx={{ mt: 0.5, display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        >
          {notification.message}
        </Typography>
        {notification.sender && (
          <Typography 
            variant="caption" 
            color="textSecondary" 
            sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}
          >
            From: {notification.sender.name}
          </Typography>
        )}
        <Typography 
          variant="caption" 
          color="textSecondary" 
          sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}
        >
          {new Date(notification.createdAt).toLocaleTimeString()}
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
        
         {/* Main Content */}
        <Box
          component="main"
          sx={{ 
            flexGrow: 1, 
            p: { xs: 1.5, sm: 2, md: 3 }, 
            overflow: 'auto',
            maxWidth: '100%',
            minHeight: 'calc(100vh - 64px)', // Subtract AppBar height
            // Better mobile responsiveness
            '& .MuiTable-root': {
              minWidth: { xs: '100%', sm: 'auto' },
            },
            '& .MuiTableContainer-root': {
              overflowX: 'auto',
            }
          }}
        >
          <PageContainer>
            {children}
          </PageContainer>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;