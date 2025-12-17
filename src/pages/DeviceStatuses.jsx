import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { devicesAPI, deviceStatusAPI } from '../services/api';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Thermostat as TemperatureIcon,
  WaterDrop as HumidityIcon,
  Vibration as VibrationIcon,
  WbSunny as LightIcon,
  LocationOn as LocationIcon,
  BatteryStd as BatteryIcon,
  SignalWifi4Bar as SignalIcon,
  Router as RouterIcon,
  Memory as MemoryIcon,
  AccessTime as TimeIcon,
  CheckCircle as ConnectedIcon,
} from '@mui/icons-material';

const DeviceStatuses = () => {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [error, setError] = useState('');
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    loadDevice();
  }, [id]);

  useEffect(() => {
    if (device?.serial_number) {
      loadStatuses();
    }
  }, [device]);

  const loadDevice = async () => {
    try {
      setLoading(true);
      const response = await devicesAPI.getById(id);
      setDevice(response.data);
    } catch (error) {
      setError('Failed to load device details');
      console.error('Error loading device:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatuses = async () => {
    if (!device?.serial_number) return;

    setLoadingStatuses(true);
    setStatusError('');

    try {
      const response = await deviceStatusAPI.getByDeviceId(device.serial_number, {
        limit: 1000,
        order_by: 'id',
        order_direction: 'desc',
      });

      if (response.data.success && response.data.data) {
        // Sort by ID descending to ensure correct order
        const sortedData = [...response.data.data].sort((a, b) => b.id - a.id);
        setStatuses(sortedData);
      } else {
        setStatusError('Failed to load device statuses');
      }
    } catch (error) {
      setStatusError(
        error.response?.data?.message || 
        error.message || 
        'Failed to load device statuses'
      );
      console.error('Error loading statuses:', error);
    } finally {
      setLoadingStatuses(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const openGoogleMaps = (latitude, longitude) => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getLatestStatus = () => {
    return statuses.length > 0 ? statuses[0] : null;
  };

  const latestStatus = getLatestStatus();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          component={Link}
          to="/devices"
          startIcon={<ArrowBackIcon />}
        >
          Back to Devices
        </Button>
      </Box>
    );
  }

  if (!device) {
    return (
      <Box>
        <Alert severity="warning">Device not found</Alert>
        <Button
          component={Link}
          to="/devices"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Devices
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button
            component={Link}
            to="/devices"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 1 }}
          >
            Back to Devices
          </Button>
          <Typography variant="h4" gutterBottom>
            Device Statuses: {device.serial_number}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {device.device_type} • Device ID: {device.device_id}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadStatuses}
          disabled={loadingStatuses}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Messages */}
      {statusError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {statusError}
        </Alert>
      )}

      {/* Latest Status Summary */}
      {latestStatus && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <TemperatureIcon color="error" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Temperature
                  </Typography>
                </Stack>
                <Typography variant="h5">
                  {latestStatus.temperature !== null 
                    ? `${parseFloat(latestStatus.temperature).toFixed(2)}°C`
                    : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <HumidityIcon color="primary" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Humidity
                  </Typography>
                </Stack>
                <Typography variant="h5">
                  {latestStatus.humidity !== null 
                    ? `${parseFloat(latestStatus.humidity).toFixed(2)}%`
                    : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <VibrationIcon color="secondary" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Vibration
                  </Typography>
                </Stack>
                <Typography variant="h5">
                  {latestStatus.mean_vibration !== null 
                    ? `${parseFloat(latestStatus.mean_vibration).toFixed(2)}`
                    : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <LightIcon color="warning" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Light
                  </Typography>
                </Stack>
                <Typography variant="h5">
                  {latestStatus.light !== null 
                    ? `${parseFloat(latestStatus.light).toFixed(2)}`
                    : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <BatteryIcon color="success" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Battery
                  </Typography>
                </Stack>
                <Typography variant="h5">
                  {latestStatus.batterie_level !== null 
                    ? `${latestStatus.batterie_level}%`
                    : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <SignalIcon color="info" />
                  <Typography variant="subtitle2" color="text.secondary">
                    RSSI
                  </Typography>
                </Stack>
                <Typography variant="h5">
                  {latestStatus.rssi !== null 
                    ? `${latestStatus.rssi} dBm`
                    : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <LocationIcon color="error" />
                  <Typography variant="subtitle2" color="text.secondary">
                    GPS Location
                  </Typography>
                </Stack>
                <Typography 
                  variant="body2"
                  onClick={() => latestStatus.gps_latitude && latestStatus.gps_longitude && openGoogleMaps(latestStatus.gps_latitude, latestStatus.gps_longitude)}
                  sx={{
                    cursor: latestStatus.gps_latitude && latestStatus.gps_longitude ? 'pointer' : 'default',
                    color: latestStatus.gps_latitude && latestStatus.gps_longitude ? 'primary.main' : 'text.primary',
                    textDecoration: latestStatus.gps_latitude && latestStatus.gps_longitude ? 'underline' : 'none',
                    '&:hover': latestStatus.gps_latitude && latestStatus.gps_longitude ? {
                      color: 'primary.dark',
                      textDecoration: 'underline'
                    } : {}
                  }}
                >
                  {latestStatus.gps_latitude && latestStatus.gps_longitude
                    ? `${parseFloat(latestStatus.gps_latitude).toFixed(6)}, ${parseFloat(latestStatus.gps_longitude).toFixed(6)}`
                    : 'N/A'}
                </Typography>
                {latestStatus.gps_accuracy && (
                  <Typography variant="caption" color="text.secondary">
                    Accuracy: {parseFloat(latestStatus.gps_accuracy).toFixed(2)}m
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <ConnectedIcon color={latestStatus.status === 'Connected' ? 'success' : 'default'} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                </Stack>
                <Chip 
                  label={latestStatus.status || 'Unknown'} 
                  color={latestStatus.status === 'Connected' ? 'success' : 'default'}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Device Info */}
      {latestStatus && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <RouterIcon color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body2">
                    {latestStatus.ip_address || 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <MemoryIcon color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Firmware
                  </Typography>
                  <Typography variant="body2">
                    {latestStatus.firmware_version || 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TimeIcon color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last Update
                  </Typography>
                  <Typography variant="body2">
                    {formatTimestamp(latestStatus.timestamp)}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocationIcon color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    GPS Altitude
                  </Typography>
                  <Typography variant="body2">
                    {latestStatus.gps_altitude 
                      ? `${parseFloat(latestStatus.gps_altitude).toFixed(2)}m`
                      : 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Statuses Table */}
      {loadingStatuses ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : statuses.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No status data available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            The device has not sent any status updates yet.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">ID</Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TimeIcon fontSize="small" />
                    <Typography variant="subtitle2">Timestamp</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TemperatureIcon fontSize="small" />
                    <Typography variant="subtitle2">Temp</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <HumidityIcon fontSize="small" />
                    <Typography variant="subtitle2">Humidity</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <VibrationIcon fontSize="small" />
                    <Typography variant="subtitle2">Vibration</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LightIcon fontSize="small" />
                    <Typography variant="subtitle2">Light</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BatteryIcon fontSize="small" />
                    <Typography variant="subtitle2">Battery</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SignalIcon fontSize="small" />
                    <Typography variant="subtitle2">RSSI</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationIcon fontSize="small" />
                    <Typography variant="subtitle2">GPS</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ConnectedIcon fontSize="small" />
                    <Typography variant="subtitle2">Status</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {statuses.map((status) => (
                <TableRow key={status.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {status.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatTimestamp(status.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {status.temperature !== null ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <TemperatureIcon fontSize="small" color="error" />
                        <Typography variant="body2">
                          {parseFloat(status.temperature).toFixed(2)}°C
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {status.humidity !== null ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <HumidityIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          {parseFloat(status.humidity).toFixed(2)}%
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {status.mean_vibration !== null ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <VibrationIcon fontSize="small" color="secondary" />
                        <Typography variant="body2">
                          {parseFloat(status.mean_vibration).toFixed(2)}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {status.light !== null ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <LightIcon fontSize="small" color="warning" />
                        <Typography variant="body2">
                          {parseFloat(status.light).toFixed(2)}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {status.batterie_level !== null ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <BatteryIcon fontSize="small" color="success" />
                        <Typography variant="body2">
                          {status.batterie_level}%
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {status.rssi !== null ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <SignalIcon fontSize="small" color="info" />
                        <Typography variant="body2">
                          {status.rssi} dBm
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {status.gps_latitude && status.gps_longitude ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <LocationIcon fontSize="small" color="error" />
                        <Typography 
                          variant="body2"
                          onClick={() => openGoogleMaps(status.gps_latitude, status.gps_longitude)}
                          sx={{
                            cursor: 'pointer',
                            color: 'primary.main',
                            textDecoration: 'underline',
                            '&:hover': {
                              color: 'primary.dark',
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {parseFloat(status.gps_latitude).toFixed(4)}, {parseFloat(status.gps_longitude).toFixed(4)}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={status.status || 'Unknown'} 
                      color={status.status === 'Connected' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Summary */}
      {statuses.length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Status Records: {statuses.length} • 
            Latest Update: {latestStatus ? formatTimestamp(latestStatus.timestamp) : 'N/A'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default DeviceStatuses;

