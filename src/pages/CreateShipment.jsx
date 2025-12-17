import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shipmentsAPI, locationsAPI, devicesAPI } from '../services/api';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

const CreateShipment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    source_location_id: '',
    destination_location_id: '',
    device_id: '',
    notes: '',
  });

  // Location management state
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationFormData, setLocationFormData] = useState({
    name: '',
  });
  const [locationError, setLocationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  useEffect(() => {
    loadLocations();
    loadDevices();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await locationsAPI.getAll();
      setLocations(response.data);
    } catch (error) {
      console.error('Error loading locations:', error);
      setError('Failed to load locations');
    }
  };

  const loadDevices = async () => {
    try {
      const response = await devicesAPI.getAll();
      setDevices(response.data || []);
    } catch (error) {
      console.error('Error loading devices:', error);
      // Don't set error state for devices, just log it
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Convert empty device_id to null
      const submitData = {
        ...formData,
        device_id: formData.device_id || null,
      };
      const response = await shipmentsAPI.create(submitData);
      const shipmentId = response.data.shipment_id;
      
      if (shipmentId) {
        navigate(`/shipments/${shipmentId}`);
      } else {
        console.error('Shipment ID not found in response:', response.data);
        setError('Shipment created but ID not found. Redirecting to shipments list...');
        // Redirect to shipments list after a short delay
        setTimeout(() => {
          navigate('/shipments');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create shipment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLocationDialog = (location = null) => {
    if (location) {
      setEditingLocation(location);
      setLocationFormData({
        name: location.name || '',
      });
    } else {
      setEditingLocation(null);
      setLocationFormData({
        name: '',
      });
    }
    setLocationError('');
    setShowLocationDialog(true);
  };

  const handleCloseLocationDialog = () => {
    setShowLocationDialog(false);
    setEditingLocation(null);
    setLocationFormData({
      name: '',
    });
    setLocationError('');
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    setLocationError('');
    setLocationLoading(true);

    try {
      if (editingLocation) {
        await locationsAPI.update(editingLocation.location_id, locationFormData);
      } else {
        const response = await locationsAPI.create(locationFormData);
        // Auto-select the newly created location
        if (!formData.source_location_id) {
          setFormData({ ...formData, source_location_id: response.data.location_id });
        } else if (!formData.destination_location_id) {
          setFormData({ ...formData, destination_location_id: response.data.location_id });
        }
      }
      await loadLocations();
      handleCloseLocationDialog();
    } catch (error) {
      setLocationError(error.response?.data?.message || 'Failed to save location');
      console.error(error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;

    try {
      await locationsAPI.delete(id);
      await loadLocations();
      // Clear form if deleted location was selected
      if (formData.source_location_id == id) {
        setFormData({ ...formData, source_location_id: '' });
      }
      if (formData.destination_location_id == id) {
        setFormData({ ...formData, destination_location_id: '' });
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete location');
      console.error(error);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/shipments')}
        >
          Back to Shipments
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Create New Shipment
        </Typography>
      </Stack>

      <Paper elevation={1} sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {error && (
              <Alert severity="error">{error}</Alert>
            )}

            <Stack direction="row" spacing={2} alignItems="flex-start">
              <TextField
                select
                label="Source Location"
                value={formData.source_location_id}
                onChange={(e) => setFormData({ ...formData, source_location_id: e.target.value })}
                required
                fullWidth
              >
                {locations.length === 0 ? (
                  <MenuItem value="" disabled>
                    No locations available
                  </MenuItem>
                ) : (
                  locations.map((location) => (
                    <MenuItem key={location.location_id} value={location.location_id}>
                      {location.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenLocationDialog()}
                sx={{ mt: 1 }}
              >
                Add Location
              </Button>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="flex-start">
              <TextField
                select
                label="Destination Location"
                value={formData.destination_location_id}
                onChange={(e) => setFormData({ ...formData, destination_location_id: e.target.value })}
                required
                fullWidth
              >
                {locations.length === 0 ? (
                  <MenuItem value="" disabled>
                    No locations available
                  </MenuItem>
                ) : (
                  locations.map((location) => (
                    <MenuItem key={location.location_id} value={location.location_id}>
                      {location.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenLocationDialog()}
                sx={{ mt: 1 }}
              >
                Add Location
              </Button>
            </Stack>

            <TextField
              select
              label="IoT Device (Optional)"
              value={formData.device_id}
              onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
              fullWidth
              sx={{ mt: 2 }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {devices.length === 0 ? (
                <MenuItem value="" disabled>
                  No devices available
                </MenuItem>
              ) : (
                devices.map((device) => (
                  <MenuItem key={device.device_id} value={device.device_id}>
                    {device.serial_number} ({device.device_type})
                  </MenuItem>
                ))
              )}
            </TextField>

            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={4}
              fullWidth
              sx={{ mt: 2 }}
              placeholder="Additional notes about this shipment..."
            />

            {locations.length === 0 && (
              <Alert severity="info">
                No locations available. Click "Add Location" to create one.
              </Alert>
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                onClick={() => navigate('/shipments')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
                disabled={loading || locations.length === 0}
              >
                {loading ? 'Creating...' : 'Create Shipment'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>

      {/* Location Management Dialog */}
      <Dialog
        open={showLocationDialog}
        onClose={handleCloseLocationDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocationIcon color="primary" />
            <Typography variant="h6">
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </Typography>
          </Stack>
        </DialogTitle>
        <form onSubmit={handleLocationSubmit}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {locationError && (
                <Alert severity="error">{locationError}</Alert>
              )}

              <TextField
                label="Location Name"
                value={locationFormData.name}
                onChange={(e) => setLocationFormData({ ...locationFormData, name: e.target.value })}
                required
                fullWidth
                autoFocus
                placeholder="e.g., Warehouse A, Customer Site B, Distribution Center"
              />

              {/* Existing Locations List */}
              {locations.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                    Existing Locations
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {locations.map((location) => (
                          <TableRow key={location.location_id}>
                            <TableCell>{location.name}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenLocationDialog(location)}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteLocation(location.location_id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseLocationDialog} disabled={locationLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={locationLoading}
              startIcon={locationLoading ? <CircularProgress size={16} /> : <SaveIcon />}
            >
              {locationLoading ? 'Saving...' : editingLocation ? 'Update Location' : 'Create Location'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CreateShipment;
