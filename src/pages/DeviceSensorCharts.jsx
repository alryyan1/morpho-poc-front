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
  TextField,
  MenuItem,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Thermostat as TemperatureIcon,
  WaterDrop as HumidityIcon,
  WbSunny as LightIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const DeviceSensorCharts = () => {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSensor, setSelectedSensor] = useState('temperature');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const sensors = [
    {
      key: 'temperature',
      label: 'Temperature',
      unit: '°C',
      icon: <TemperatureIcon />,
      color: '#e74c3c',
    },
    {
      key: 'humidity',
      label: 'Humidity',
      unit: '%',
      icon: <HumidityIcon />,
      color: '#3498db',
    },
    {
      key: 'light',
      label: 'Light',
      unit: '',
      icon: <LightIcon />,
      color: '#f39c12',
    },
  ];

  useEffect(() => {
    loadDevice();
  }, [id]);

  useEffect(() => {
    if (device?.serial_number) {
      loadStatuses();
    }
  }, [device, dateFrom, dateTo]);

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

    setLoading(true);
    setError('');

    try {
      const params = {
        limit: 1000,
        order_by: 'timestamp',
        order_direction: 'asc',
      };

      // Add date range parameters if provided
      if (dateFrom) {
        const timestampFrom = Math.floor(new Date(dateFrom).getTime() / 1000);
        params.start_timestamp = timestampFrom;
      }
      if (dateTo) {
        const dateToEnd = new Date(dateTo);
        dateToEnd.setHours(23, 59, 59, 999);
        const timestampTo = Math.floor(dateToEnd.getTime() / 1000);
        params.end_timestamp = timestampTo;
      }

      const response = await deviceStatusAPI.getByDeviceId(device.serial_number, params);

      if (response.data.success && response.data.data) {
        setStatuses(response.data.data);
      } else {
        setError('Failed to load device statuses');
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
        error.message ||
        'Failed to load device statuses'
      );
      console.error('Error loading statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transform data for charting
  const transformDataForChart = () => {
    if (!statuses.length) return [];

    const sensorKey = selectedSensor;
    const sensorConfig = sensors.find(s => s.key === sensorKey);

    return statuses
      .filter(status => {
        const value = status[sensorKey];
        return value !== null && value !== undefined && value !== '';
      })
      .map(status => ({
        timestamp: status.timestamp * 1000, // Convert to milliseconds for Recharts
        timestampDate: new Date(status.timestamp * 1000),
        value: parseFloat(status[sensorKey]),
        formattedTime: new Date(status.timestamp * 1000).toLocaleString(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  const chartData = transformDataForChart();
  const selectedSensorConfig = sensors.find(s => s.key === selectedSensor);

  // Format timestamp for X-axis
  const formatXAxis = (tickItem) => {
    if (!tickItem) return '';
    const date = new Date(tickItem);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 1.5, border: '1px solid #e0e0e0' }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {selectedSensorConfig.label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.formattedTime}
          </Typography>
          <Typography variant="h6" sx={{ color: selectedSensorConfig.color, mt: 0.5 }}>
            {data.value.toFixed(2)}{selectedSensorConfig.unit}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  if (loading && !device) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !device) {
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
            to={`/devices/${id}/statuses`}
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 1 }}
          >
            Back to Statuses
          </Button>
          <Typography variant="h4" gutterBottom>
            Sensor Charts: {device.serial_number}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {device.device_type} • Device ID: {device.device_id}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadStatuses}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Messages */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Select Sensor</InputLabel>
              <Select
                value={selectedSensor}
                label="Select Sensor"
                onChange={(e) => setSelectedSensor(e.target.value)}
              >
                {sensors.map((sensor) => (
                  <MenuItem key={sensor.key} value={sensor.key}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {sensor.icon}
                      <span>{sensor.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
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
          </Grid>
          <Grid item xs={12} md={4}>
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
          </Grid>
        </Grid>
      </Paper>

      {/* Chart */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : chartData.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No data available for {selectedSensorConfig.label}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {dateFrom || dateTo
              ? 'No data found for the selected date range.'
              : 'The device has not sent any status updates yet.'}
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            {selectedSensorConfig.icon} {selectedSensorConfig.label} Over Time
          </Typography>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatXAxis}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                label={{
                  value: `${selectedSensorConfig.label} (${selectedSensorConfig.unit})`,
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={selectedSensorConfig.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                name={selectedSensorConfig.label}
              />
            </LineChart>
          </ResponsiveContainer>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Total data points: {chartData.length}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default DeviceSensorCharts;

