import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shipmentsAPI, devicesAPI } from '../services/api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [assigningDevice, setAssigningDevice] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deletingShipment, setDeletingShipment] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadShipments();
    loadDevices();
  }, [filters]);

  const loadShipments = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      
      const response = await shipmentsAPI.getAll(params);
      const data = response.data.data || response.data || [];
      
      // Apply search filter
      let filtered = data;
      if (filters.search) {
        filtered = data.filter(s => 
          s.shipment_number.toLowerCase().includes(filters.search.toLowerCase()) ||
          s.source_location?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          s.destination_location?.name?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      // Sort by ID descending
      filtered.sort((a, b) => (b.shipment_id || 0) - (a.shipment_id || 0));
      
      setShipments(filtered);
    } catch (error) {
      console.error('Error loading shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      const response = await devicesAPI.getAll();
      // Handle both paginated and non-paginated responses
      const data = response.data?.data || response.data || [];
      setDevices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading devices:', error);
      // Don't show error to user, just log it
    }
  };

  const handleAssignDevice = (shipment) => {
    setAssigningDevice(shipment);
    setSelectedDeviceId(shipment.device_id || '');
  };

  const handleSaveDeviceAssignment = async () => {
    if (!assigningDevice) return;

    setUpdating(true);
    try {
      const deviceId = selectedDeviceId === '' ? null : selectedDeviceId;
      await shipmentsAPI.update(assigningDevice.shipment_id, { device_id: deviceId });
      await loadShipments();
      setAssigningDevice(null);
      setSelectedDeviceId('');
    } catch (error) {
      alert('Failed to assign device');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteShipment = async () => {
    if (!deletingShipment) return;

    setDeleting(true);
    try {
      await shipmentsAPI.delete(deletingShipment.shipment_id);
      await loadShipments();
      setDeletingShipment(null);
    } catch (error) {
      alert('Failed to delete shipment');
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };


  const getStatusColor = (status) => {
    const colors = {
      created: 'gray',
      packed: 'yellow',
      dispatched: 'blue',
      in_transit: 'indigo',
      delivered: 'green',
      cancelled: 'red',
    };
    return colors[status] || 'gray';
  };

  if (loading) {
    return <div className="text-center py-8">Loading shipments...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
          <p className="text-gray-600 mt-1">Manage and track all shipments</p>
        </div>
        <Link
          to="/shipments/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New Shipment
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by shipment number, location..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Statuses</option>
              <option value="created">Created</option>
              <option value="packed">Packed</option>
              <option value="dispatched">Dispatched</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shipment #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {shipments.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  No shipments found
                </td>
              </tr>
            ) : (
              shipments.map((shipment) => (
                <tr key={shipment.shipment_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {shipment.shipment_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/shipments/${shipment.shipment_id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {shipment.shipment_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {shipment.source_location?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {shipment.destination_location?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">
                        {shipment.device 
                          ? `${shipment.device.serial_number} (${shipment.device.device_type})`
                          : 'Not assigned'}
                      </span>
                      <button
                        onClick={() => handleAssignDevice(shipment)}
                        className="text-blue-600 hover:text-blue-700 text-xs underline"
                        title="Assign Device"
                      >
                        {shipment.device ? 'Change' : 'Assign'}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full bg-${getStatusColor(shipment.status)}-100 text-${getStatusColor(shipment.status)}-800`}
                    >
                      {shipment.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(shipment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/shipments/${shipment.shipment_id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View
                      </Link>
                      {shipment.device_id ? (
                        <Link
                          to={`/shipments/${shipment.shipment_id}/tracking`}
                          className="text-indigo-600 hover:text-indigo-700"
                          title="Track shipment"
                        >
                          Track
                        </Link>
                      ) : (
                        <span className="text-gray-400 cursor-not-allowed" title="No device assigned">
                          Track
                        </span>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeletingShipment(shipment)}
                        title="Delete shipment"
                        sx={{ padding: '4px' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Device Assignment Dialog */}
      <Dialog
        open={!!assigningDevice}
        onClose={() => {
          if (!updating) {
            setAssigningDevice(null);
            setSelectedDeviceId('');
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign Device to {assigningDevice?.shipment_number}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              label="Select Device"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              fullWidth
              disabled={updating}
              sx={{ mb: 2 }}
            >
              <MenuItem value="">
                <em>None (Unassign)</em>
              </MenuItem>
              {devices.length === 0 ? (
                <MenuItem value="" disabled>
                  No devices available
                </MenuItem>
              ) : (
                devices.map((device) => (
                  <MenuItem key={device.device_id} value={device.device_id}>
                    {device.serial_number} ({device.device_type})
                    {device.status && (
                      <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#666' }}>
                        - {device.status}
                      </span>
                    )}
                  </MenuItem>
                ))
              )}
            </TextField>
            {updating && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAssigningDevice(null);
              setSelectedDeviceId('');
            }}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveDeviceAssignment}
            variant="contained"
            disabled={updating}
          >
            {updating ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingShipment}
        onClose={() => {
          if (!deleting) {
            setDeletingShipment(null);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Delete Shipment
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography>
              Are you sure you want to delete shipment <strong>{deletingShipment?.shipment_number}</strong>?
              <br />
              This action cannot be undone.
            </Typography>
            {deleting && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeletingShipment(null)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteShipment}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Shipments;

