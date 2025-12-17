import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { deviceStatusAPI } from '../services/api';

const TestDeviceStatus = () => {
  const [deviceId, setDeviceId] = useState('');
  const [endpointType, setEndpointType] = useState('list');
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [orderBy, setOrderBy] = useState('timestamp');
  const [orderDirection, setOrderDirection] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleTest = async () => {
    if (!deviceId) {
      setError('Please enter a device ID');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let response;
      if (endpointType === 'latest') {
        response = await deviceStatusAPI.getLatest(deviceId);
      } else {
        response = await deviceStatusAPI.getByDeviceId(deviceId, {
          limit,
          offset,
          order_by: orderBy,
          order_direction: orderDirection,
        });
      }

      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch device status'
      );
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Test Device Status API
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Test device status endpoints from the telnet-api service
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Device ID"
            type="number"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            fullWidth
            required
            placeholder="Enter device ID (e.g., 1, 2, 3)"
          />

          <TextField
            select
            label="Endpoint Type"
            value={endpointType}
            onChange={(e) => setEndpointType(e.target.value)}
            fullWidth
          >
            <MenuItem value="list">Get All Statuses (with pagination)</MenuItem>
            <MenuItem value="latest">Get Latest Status Only</MenuItem>
          </TextField>

          {endpointType === 'list' && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                  fullWidth
                  inputProps={{ min: 1, max: 1000 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Offset"
                  type="number"
                  value={offset}
                  onChange={(e) => setOffset(parseInt(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Order By"
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="timestamp">Timestamp</MenuItem>
                  <MenuItem value="created_at">Created At</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Order Direction"
                  value={orderDirection}
                  onChange={(e) => setOrderDirection(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="desc">Descending</MenuItem>
                  <MenuItem value="asc">Ascending</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          )}

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              onClick={handleTest}
              disabled={loading || !deviceId}
            >
              {loading ? 'Testing...' : 'Test Endpoint'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setResult(null);
                setError('');
              }}
              disabled={loading}
            >
              Clear
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Results
          </Typography>

          {result.success === false ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {result.message || 'Request failed'}
            </Alert>
          ) : (
            <>
              {result.meta && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Metadata
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                      <Chip label={`Device ID: ${result.meta.device_id}`} size="small" />
                      <Chip label={`Total: ${result.meta.total}`} size="small" />
                      <Chip label={`Count: ${result.meta.count}`} size="small" />
                      <Chip label={`Limit: ${result.meta.limit}`} size="small" />
                      <Chip label={`Offset: ${result.meta.offset}`} size="small" />
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {result.data && (
                <Paper sx={{ p: 2 }}>
                  {Array.isArray(result.data) ? (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        Status Records ({result.data.length})
                      </Typography>
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        {result.data.map((status, index) => (
                          <Card key={index} variant="outlined">
                            <CardContent>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    Device ID
                                  </Typography>
                                  <Typography variant="body2">
                                    {status.device_id}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    Timestamp
                                  </Typography>
                                  <Typography variant="body2">
                                    {formatTimestamp(status.timestamp)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    IP Address
                                  </Typography>
                                  <Typography variant="body2">
                                    {status.ip_address || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    Firmware
                                  </Typography>
                                  <Typography variant="body2">
                                    {status.firmware_version || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    GPS Location
                                  </Typography>
                                  <Typography variant="body2">
                                    {status.gps_latitude && status.gps_longitude
                                      ? `${status.gps_latitude}, ${status.gps_longitude}`
                                      : 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    Battery Level
                                  </Typography>
                                  <Typography variant="body2">
                                    {status.batterie_level !== null
                                      ? `${status.batterie_level}%`
                                      : 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    Temperature
                                  </Typography>
                                  <Typography variant="body2">
                                    {status.temperature !== null
                                      ? `${status.temperature}°C`
                                      : 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    Humidity
                                  </Typography>
                                  <Typography variant="body2">
                                    {status.humidity !== null
                                      ? `${status.humidity}%`
                                      : 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    Status
                                  </Typography>
                                  <Typography variant="body2">
                                    {status.status || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    Created At
                                  </Typography>
                                  <Typography variant="body2">
                                    {formatDate(status.created_at)}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </>
                  ) : (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        Latest Status
                      </Typography>
                      <Card variant="outlined" sx={{ mt: 2 }}>
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Device ID
                              </Typography>
                              <Typography variant="body2">
                                {result.data.device_id}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Timestamp
                              </Typography>
                              <Typography variant="body2">
                                {formatTimestamp(result.data.timestamp)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                IP Address
                              </Typography>
                              <Typography variant="body2">
                                {result.data.ip_address || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Firmware
                              </Typography>
                              <Typography variant="body2">
                                {result.data.firmware_version || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                GPS Location
                              </Typography>
                              <Typography variant="body2">
                                {result.data.gps_latitude && result.data.gps_longitude
                                  ? `${result.data.gps_latitude}, ${result.data.gps_longitude}`
                                  : 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Battery Level
                              </Typography>
                              <Typography variant="body2">
                                {result.data.batterie_level !== null
                                  ? `${result.data.batterie_level}%`
                                  : 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Temperature
                              </Typography>
                              <Typography variant="body2">
                                {result.data.temperature !== null
                                  ? `${result.data.temperature}°C`
                                  : 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Humidity
                              </Typography>
                              <Typography variant="body2">
                                {result.data.humidity !== null
                                  ? `${result.data.humidity}%`
                                  : 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Status
                              </Typography>
                              <Typography variant="body2">
                                {result.data.status || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Created At
                              </Typography>
                              <Typography variant="body2">
                                {formatDate(result.data.created_at)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </Paper>
              )}

              <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <InfoIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    Raw JSON Response
                  </Typography>
                </Stack>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    bgcolor: 'grey.900',
                    color: 'grey.100',
                    borderRadius: 1,
                    overflow: 'auto',
                    fontSize: '0.75rem',
                    maxHeight: '400px',
                  }}
                >
                  {JSON.stringify(result, null, 2)}
                </Box>
              </Paper>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TestDeviceStatus;

