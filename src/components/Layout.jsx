import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { devicesAPI } from '../services/api';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Button,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  LocalShipping as ShipmentsIcon,
  Sensors as DevicesIcon,
  Settings as PoliciesIcon,
  Warning as ViolationsIcon,
  People as UsersIcon,
  Logout as LogoutIcon,
  BugReport as TestIcon,
  Map as MapIcon,
  ShowChart as ChartsIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [chartsDialogOpen, setChartsDialogOpen] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [devicesError, setDevicesError] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleChartsClick = (e) => {
    e.preventDefault();
    setChartsDialogOpen(true);
    loadDevices();
  };

  const loadDevices = async () => {
    setLoadingDevices(true);
    setDevicesError('');
    try {
      const response = await devicesAPI.getAll();
      const data = response.data.data || response.data || [];
      setDevices(Array.isArray(data) ? data : []);
    } catch (error) {
      setDevicesError('Failed to load devices');
      console.error('Error loading devices:', error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleOpenCharts = () => {
    if (selectedDeviceId) {
      navigate(`/devices/${selectedDeviceId}/charts`);
      setChartsDialogOpen(false);
      setSelectedDeviceId('');
    }
  };

  const handleCloseChartsDialog = () => {
    setChartsDialogOpen(false);
    setSelectedDeviceId('');
    setDevicesError('');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/shipments', label: 'Shipments', icon: <ShipmentsIcon /> },
    { path: '/devices', label: 'IoT Devices', icon: <DevicesIcon /> },
    { path: '/devices', label: 'Sensor Charts', icon: <ChartsIcon />, highlight: true },
    { path: '/device-location-map', label: 'Device Location Map', icon: <MapIcon /> },
    { path: '/policies', label: 'Policies', icon: <PoliciesIcon /> },
    { path: '/violations', label: 'Violations', icon: <ViolationsIcon /> },
    { path: '/users', label: 'Users', icon: <UsersIcon /> },
    { path: '/test-device-status', label: 'Test Device Status', icon: <TestIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 0, fontWeight: 'bold', mr: 2 }}>
            TMS
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            Transport Management System
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.primary">
              {user?.name || user?.username}
            </Typography>
            <Chip
              label={user?.role?.role_name || 'User'}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Button
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              size="small"
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item, index) => {
              // Check if active - handle charts route specially
              let isActive = location.pathname === item.path;
              if (item.label === 'Sensor Charts') {
                isActive = location.pathname.includes('/devices/') && location.pathname.includes('/charts');
              }
              
              // Special handling for Sensor Charts - open dialog instead of navigating
              if (item.label === 'Sensor Charts') {
                return (
                  <ListItem key={`${item.path}-${index}`} disablePadding>
                    <ListItemButton
                      onClick={handleChartsClick}
                      selected={isActive}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.main',
                          },
                        '& .MuiListItemIcon-root': {
                            color: 'white',
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive ? 'white' : 'text.secondary',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                );
              }
              
              return (
                <ListItem key={`${item.path}-${index}`} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={isActive}
                    sx={{
                      '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.main',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'white',
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive ? 'white' : 'text.secondary',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>

      {/* Device Selection Dialog for Charts */}
      <Dialog open={chartsDialogOpen} onClose={handleCloseChartsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Select Device for Sensor Charts</DialogTitle>
        <DialogContent>
          {loadingDevices ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : devicesError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {devicesError}
            </Alert>
          ) : (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Device</InputLabel>
              <Select
                value={selectedDeviceId}
                label="Select Device"
                onChange={(e) => setSelectedDeviceId(e.target.value)}
              >
                {devices.map((device) => (
                  <MenuItem key={device.device_id} value={device.device_id}>
                    {device.serial_number} - {device.device_type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseChartsDialog}>Cancel</Button>
          <Button
            onClick={handleOpenCharts}
            variant="contained"
            disabled={!selectedDeviceId || loadingDevices}
          >
            View Charts
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Layout;
