import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  MenuItem, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress, 
  Alert,
  Stack,
  IconButton,
  Fab
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { devicesAPI } from '../services/api';

const DeviceLocationMap = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [mapStyle, setMapStyle] = useState('navigation-day-v1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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

  useEffect(() => {
    if (selectedDeviceId && iframeRef.current) {
      // Build URL parameters
      const params = new URLSearchParams({
        deviceId: selectedDeviceId,
        mapStyle: mapStyle,
      });
      
      // Add date range parameters if provided
      if (dateFrom) {
        // Convert date to Unix timestamp (seconds)
        const timestampFrom = Math.floor(new Date(dateFrom).getTime() / 1000);
        params.append('start_timestamp', timestampFrom.toString());
      }
      if (dateTo) {
        // Convert date to Unix timestamp (seconds) and set to end of day
        const dateToEnd = new Date(dateTo);
        dateToEnd.setHours(23, 59, 59, 999);
        const timestampTo = Math.floor(dateToEnd.getTime() / 1000);
        params.append('end_timestamp', timestampTo.toString());
      }
      
      // Update iframe src with device ID, map style, and date range parameters
      const newSrc = `/device-location-map.html?${params.toString()}`;
      iframeRef.current.src = newSrc;
    }
  }, [selectedDeviceId, mapStyle, dateFrom, dateTo]);

  // Auto-refresh device status every 5 seconds
  useEffect(() => {
    if (!selectedDeviceId || !iframeRef.current || dialogOpen) return;

    const interval = setInterval(() => {
      // Send refresh message to iframe with current date range
      if (iframeRef.current?.contentWindow) {
        const dateToEnd = dateTo ? new Date(dateTo) : null;
        if (dateToEnd) {
          dateToEnd.setHours(23, 59, 59, 999);
        }
        iframeRef.current.contentWindow.postMessage(
          { 
            type: 'refreshDeviceData',
            startTimestamp: dateFrom ? Math.floor(new Date(dateFrom).getTime() / 1000) : null,
            endTimestamp: dateToEnd ? Math.floor(dateToEnd.getTime() / 1000) : null,
          },
          window.location.origin
        );
      }
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [selectedDeviceId, dateFrom, dateTo, dialogOpen]);

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

  const handleDialogClose = () => {
    if (selectedDeviceId) {
      setDialogOpen(false);
    }
  };

  const handleApply = () => {
    if (selectedDeviceId) {
      setDialogOpen(false);
    }
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
      {/* Settings Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={(event, reason) => {
          // Prevent closing on backdrop click if no device selected
          if (reason === 'backdropClick' && !selectedDeviceId) {
            return;
          }
          handleDialogClose();
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle>Device Location Map Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', py: 2 }}>
                <CircularProgress size={20} />
                <span>Loading devices...</span>
              </Box>
            ) : error ? (
              <Alert severity="error">
                {error}
              </Alert>
            ) : (
              <>
                <TextField
                  select
                  label="Select Device"
                  value={selectedDeviceId}
                  onChange={handleDeviceChange}
                  fullWidth
                  required
                  error={!selectedDeviceId}
                  helperText={!selectedDeviceId ? 'Please select a device' : ''}
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
                  select
                  label="Map Style"
                  value={mapStyle}
                  onChange={handleMapStyleChange}
                  fullWidth
                >
                  {mapStyles.map((style) => (
                    <MenuItem key={style.value} value={style.value}>
                      {style.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Date From"
                  type="datetime-local"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  label="Date To"
                  type="datetime-local"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={dateFrom && dateTo && new Date(dateTo) < new Date(dateFrom)}
                  helperText={dateFrom && dateTo && new Date(dateTo) < new Date(dateFrom) ? 'End date must be after start date' : ''}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply} 
            variant="contained"
            disabled={!selectedDeviceId || loading}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Settings Button */}
      {!dialogOpen && (
        <Fab
          color="primary"
          aria-label="settings"
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 1000,
          }}
          onClick={() => setDialogOpen(true)}
        >
          <SettingsIcon />
        </Fab>
      )}

      <iframe
        ref={iframeRef}
        src={selectedDeviceId ? `/device-location-map.html?deviceId=${selectedDeviceId}&mapStyle=${mapStyle}` : `/device-location-map.html?mapStyle=${mapStyle}`}
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
