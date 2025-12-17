import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  MenuItem, 
  Paper, 
  CircularProgress, 
  Alert, 
  Switch, 
  FormControlLabel, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { devicesAPI } from '../services/api';

const DeviceLocationMap = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [mapStyle, setMapStyle] = useState('navigation-day-v1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5); // in minutes
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const iframeRef = useRef(null);

  const mapStyles = [
    { value: 'navigation-day-v1', label: 'Navigation Day' },
    { value: 'navigation-night-v1', label: 'Navigation Night' },
    { value: 'streets-v12', label: 'Streets' },
    { value: 'outdoors-v12', label: 'Outdoors' },
    { value: 'light-v11', label: 'Light' },
    { value: 'dark-v11', label: 'Dark' },
    { value: 'satellite-v9', label: 'Satellite' },
    { value: 'satellite-streets-v12', label: 'Satellite Streets' },
  ];

  useEffect(() => {
    loadDevices();
  }, []);

  const buildIframeSrc = () => {
    const params = new URLSearchParams();

    if (selectedDeviceId) {
      params.set('deviceId', selectedDeviceId);
    }

    if (mapStyle) {
      params.set('mapStyle', mapStyle);
    }

    // Pass optional start/end timestamps (Unix seconds) to the HTML map,
    // which forwards them to the API as start_timestamp / end_timestamp
    if (startDate) {
      const ts = Math.floor(new Date(startDate).getTime() / 1000);
      if (!Number.isNaN(ts)) {
        params.set('startTimestamp', String(ts));
      }
    }

    if (endDate) {
      const ts = Math.floor(new Date(endDate).getTime() / 1000);
      if (!Number.isNaN(ts)) {
        params.set('endTimestamp', String(ts));
      }
    }

    const queryString = params.toString();
    return `/device-location-map.html${queryString ? `?${queryString}` : ''}`;
  };

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = buildIframeSrc();
    }
  }, [selectedDeviceId, mapStyle, startDate, endDate]);

  // Function to trigger manual refresh
  const triggerRefresh = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'refreshDeviceData' },
        window.location.origin
      );
    }
  };

  // Auto-refresh device status based on configured interval
  useEffect(() => {
    if (!selectedDeviceId || !iframeRef.current || !autoRefreshEnabled) return;

    const intervalMs = refreshInterval * 60 * 1000; // Convert minutes to milliseconds

    const interval = setInterval(() => {
      // Send refresh message to iframe
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'refreshDeviceData' },
          window.location.origin
        );
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [selectedDeviceId, autoRefreshEnabled, refreshInterval]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await devicesAPI.getAll();
      
      // Handle both paginated and non-paginated responses
      const devicesList = response.data?.data || response.data || [];
      
      if (Array.isArray(devicesList) && devicesList.length > 0) {
        setDevices(devicesList);
        // Auto-select first device if none selected
        if (!selectedDeviceId && devicesList.length > 0) {
          // Try to find device by serial_number that matches the default in HTML (2228268)
          const defaultDevice = devicesList.find(d => d.serial_number === '2228268') || devicesList[0];
          setSelectedDeviceId(defaultDevice.serial_number);
        }
      } else {
        setError('No devices available');
        setDevices([]);
      }
    } catch (error) {
      setError('Failed to load devices');
      console.error('Error loading devices:', error);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceChange = (event) => {
    setSelectedDeviceId(event.target.value);
  };

  const handleMapStyleChange = (event) => {
    setMapStyle(event.target.value);
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  const handleAutoRefreshToggle = (event) => {
    setAutoRefreshEnabled(event.target.checked);
  };

  const handleRefreshIntervalChange = (event) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value > 0) {
      setRefreshInterval(value);
    }
  };

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        '& iframe': {
          width: '100%',
          height: '100%',
          border: 'none'
        }
      }}
    >
      {/* Settings Button */}
      <IconButton
        onClick={handleSettingsOpen}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 1)',
          }
        }}
        size="large"
      >
        <SettingsIcon />
      </IconButton>

      {/* Settings Dialog */}
      <Dialog 
        open={settingsOpen} 
        onClose={handleSettingsClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Map Settings</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
              <CircularProgress size={20} />
              <span>Loading devices...</span>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                select
                label="Select Device"
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                fullWidth
                size="small"
              >
                {devices.length === 0 ? (
                  <MenuItem value="" disabled>
                    No devices available
                  </MenuItem>
                ) : (
                  devices.map((device) => (
                    <MenuItem key={device.device_id} value={device.serial_number}>
                      {device.serial_number} {device.device_type && `(${device.device_type})`}
                    </MenuItem>
                  ))
                )}
              </TextField>
              <TextField
                type="datetime-local"
                label="Start Date / Time"
                value={startDate}
                onChange={handleStartDateChange}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="datetime-local"
                label="End Date / Time"
                value={endDate}
                onChange={handleEndDateChange}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                label="Map Style"
                value={mapStyle}
                onChange={handleMapStyleChange}
                fullWidth
                size="small"
              >
                {mapStyles.map((style) => (
                  <MenuItem key={style.value} value={style.value}>
                    {style.label}
                  </MenuItem>
                ))}
              </TextField>
              <Box sx={{ borderTop: '1px solid #e0e0e0', pt: 2, mt: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefreshEnabled}
                      onChange={handleAutoRefreshToggle}
                      size="small"
                    />
                  }
                  label="Auto Refresh"
                  sx={{ mb: 1, display: 'block' }}
                />
                <TextField
                  type="number"
                  label="Refresh Interval (minutes)"
                  value={refreshInterval}
                  onChange={handleRefreshIntervalChange}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0.1, step: 0.1 }}
                  disabled={!autoRefreshEnabled}
                  sx={{ mb: 1 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={triggerRefresh}
                  sx={{ mt: 1 }}
                >
                  Refresh Now
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <iframe
        ref={iframeRef}
        src={buildIframeSrc()}
        title="Device Location Map"
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
      />
    </Box>
  );
};

export default DeviceLocationMap;
