import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { devicesAPI } from '../services/api';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Sensors as SensorsIcon,
  ArrowForward as ArrowForwardIcon,
  Memory as MemoryIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';

const IoTDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    serial_number: '',
    device_type: '',
    supported_sensors: [],
    firmware_version: '',
  });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await devicesAPI.getAll();
      const data = response.data.data || response.data || [];
      setDevices(data);
    } catch (error) {
      console.error('Error loading devices:', error);
      setError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);
    
    try {
      await devicesAPI.create(formData);
      setShowModal(false);
      setFormData({
        serial_number: '',
        device_type: '',
        supported_sensors: [],
        firmware_version: '',
      });
      loadDevices();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create device');
      console.error(error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
    setFormData({
      serial_number: '',
      device_type: '',
      supported_sensors: [],
      firmware_version: '',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      maintenance: 'warning',
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            IoT Devices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage IoT sensors and devices
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowModal(true)}
        >
          Register Device
        </Button>
      </Stack>

      {/* Devices Grid */}
      <Grid container spacing={3}>
        {devices.map((device) => (
          <Grid item xs={12} sm={6} md={4} key={device.device_id}>
            <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" component="h3" fontWeight="bold">
                      {device.serial_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {device.device_type}
                    </Typography>
                  </Box>
                  <Chip
                    label={device.status}
                    color={getStatusColor(device.status)}
                    size="small"
                  />
                </Stack>

                {device.supported_sensors && device.supported_sensors.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      Supported Sensors:
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {device.supported_sensors.map((sensor, idx) => (
                        <Chip
                          key={idx}
                          label={sensor}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 0.5 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {device.firmware_version && (
                  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <MemoryIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Firmware: {device.firmware_version}
                    </Typography>
                  </Stack>
                )}

                {device.last_seen_at && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Last seen: {new Date(device.last_seen_at).toLocaleString()}
                    </Typography>
                  </Stack>
                )}
              </CardContent>
              <CardActions>
                <Button
                  component={Link}
                  to={`/devices/${device.device_id}/statuses`}
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                >
                  View Statuses
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {devices.length === 0 && (
        <Paper elevation={1} sx={{ p: 6, textAlign: 'center' }}>
          <SensorsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            No devices registered yet
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowModal(true)}
            sx={{ mt: 2 }}
          >
            Register Your First Device
          </Button>
        </Paper>
      )}

      {/* Register Device Dialog */}
      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <SensorsIcon color="primary" />
            <Typography variant="h6">Register New Device</Typography>
          </Stack>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error">{error}</Alert>
              )}

              <TextField
                label="Serial Number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                required
                fullWidth
                autoFocus
                placeholder="e.g., DEV-12345"
              />

              <TextField
                label="Device Type"
                value={formData.device_type}
                onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                required
                fullWidth
                placeholder="e.g., temperature, GPS, multi-sensor"
              />

              <TextField
                label="Firmware Version"
                value={formData.firmware_version}
                onChange={(e) => setFormData({ ...formData, firmware_version: e.target.value })}
                fullWidth
                placeholder="e.g., v1.2.3"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseModal} disabled={submitLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitLoading}
              startIcon={submitLoading ? <CircularProgress size={16} /> : <AddIcon />}
            >
              {submitLoading ? 'Registering...' : 'Register Device'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default IoTDevices;
