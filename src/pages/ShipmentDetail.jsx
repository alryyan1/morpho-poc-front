import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { shipmentsAPI, devicesAPI } from '../services/api';

const ShipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingDevice, setEditingDevice] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  useEffect(() => {
    loadShipment();
    loadDevices();
  }, [id]);

  useEffect(() => {
    if (shipment) {
      setSelectedDeviceId(shipment.device_id || '');
    }
  }, [shipment]);

  const loadShipment = async () => {
    try {
      const response = await shipmentsAPI.getById(id);
      setShipment(response.data);
    } catch (error) {
      console.error('Error loading shipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      const response = await devicesAPI.getAll();
      setDevices(response.data || []);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;

    setUpdating(true);
    try {
      await shipmentsAPI.updateStatus(id, newStatus);
      await loadShipment();
    } catch (error) {
      alert('Failed to update status');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeviceUpdate = async () => {
    setUpdating(true);
    try {
      const deviceId = selectedDeviceId === '' ? null : selectedDeviceId;
      await shipmentsAPI.update(id, { device_id: deviceId });
      await loadShipment();
      setEditingDevice(false);
    } catch (error) {
      alert('Failed to update device');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading shipment details...</div>;
  }

  if (!shipment) {
    return <div className="text-center py-8">Shipment not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/shipments" className="text-blue-600 hover:text-blue-700 mb-2 inline-block">
          ← Back to Shipments
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Shipment: {shipment.shipment_number}
        </h1>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 capitalize">
              {shipment.status.replace('_', ' ')}
            </p>
          </div>
          <div className="space-x-2">
            {shipment.status === 'created' && (
              <button
                onClick={() => handleStatusUpdate('packed')}
                disabled={updating}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Mark as Packed
              </button>
            )}
            {shipment.status === 'packed' && (
              <button
                onClick={() => handleStatusUpdate('dispatched')}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Dispatch
              </button>
            )}
            {shipment.status === 'dispatched' && (
              <button
                onClick={() => handleStatusUpdate('in_transit')}
                disabled={updating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Mark In Transit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipment Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Shipment Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600">Shipment Number</dt>
              <dd className="text-gray-900 font-medium">{shipment.shipment_number}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Source Location</dt>
              <dd className="text-gray-900">{shipment.source_location?.name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Destination Location</dt>
              <dd className="text-gray-900">{shipment.destination_location?.name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">IoT Device</dt>
              <dd className="text-gray-900">
                {editingDevice ? (
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                      disabled={updating}
                    >
                      <option value="">None</option>
                      {devices.map((device) => (
                        <option key={device.device_id} value={device.device_id}>
                          {device.serial_number} ({device.device_type})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleDeviceUpdate}
                      disabled={updating}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingDevice(false);
                        setSelectedDeviceId(shipment.device_id || '');
                      }}
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{shipment.device ? `${shipment.device.serial_number} (${shipment.device.device_type})` : 'Not assigned'}</span>
                    <button
                      onClick={() => setEditingDevice(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Created At</dt>
              <dd className="text-gray-900">{new Date(shipment.created_at).toLocaleString()}</dd>
            </div>
            {shipment.dispatched_at && (
              <div>
                <dt className="text-sm text-gray-600">Dispatched At</dt>
                <dd className="text-gray-900">{new Date(shipment.dispatched_at).toLocaleString()}</dd>
              </div>
            )}
            {shipment.delivered_at && (
              <div>
                <dt className="text-sm text-gray-600">Delivered At</dt>
                <dd className="text-gray-900">{new Date(shipment.delivered_at).toLocaleString()}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Containers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Containers</h2>
          {shipment.containers && shipment.containers.length > 0 ? (
            <div className="space-y-3">
              {shipment.containers.map((container) => (
                <div key={container.container_id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{container.container_number}</p>
                      <p className="text-sm text-gray-600">
                        {container.packages?.length || 0} packages
                      </p>
                    </div>
                    {container.weight && (
                      <span className="text-sm text-gray-600">{container.weight} kg</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No containers added yet</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex space-x-4">
        <Link
          to={`/shipments/${id}/tracking`}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
        >
          View Tracking
        </Link>
        {shipment.status === 'in_transit' && (
          <Link
            to={`/shipments/${id}/pod`}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Submit POD
          </Link>
        )}
      </div>
    </div>
  );
};

export default ShipmentDetail;

