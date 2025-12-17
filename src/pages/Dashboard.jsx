import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shipmentsAPI, violationsAPI, devicesAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    shipments: { total: 0, inTransit: 0, delivered: 0 },
    violations: { open: 0, critical: 0 },
    devices: { total: 0, active: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [recentShipments, setRecentShipments] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load shipments
      const shipmentsRes = await shipmentsAPI.getAll({ per_page: 100 });
      const shipments = shipmentsRes.data.data || shipmentsRes.data || [];
      
      // Load violations
      const violationsRes = await violationsAPI.getAll({ per_page: 100 });
      const violations = violationsRes.data.data || violationsRes.data || [];
      
      // Load devices
      const devicesRes = await devicesAPI.getAll({ per_page: 100 });
      const devices = devicesRes.data.data || devicesRes.data || [];

      setStats({
        shipments: {
          total: shipments.length,
          inTransit: shipments.filter(s => s.status === 'in_transit').length,
          delivered: shipments.filter(s => s.status === 'delivered').length,
        },
        violations: {
          open: violations.filter(v => v.status === 'open').length,
          critical: violations.filter(v => v.severity === 'critical').length,
        },
        devices: {
          total: devices.length,
          active: devices.filter(d => d.status === 'active').length,
        },
      });

      setRecentShipments(shipments.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`text-4xl text-${color}-500`}>{icon}</div>
      </div>
    </div>
  );

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your transport management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Shipments"
          value={stats.shipments.total}
          subtitle={`${stats.shipments.inTransit} in transit`}
          icon="📦"
          color="blue"
        />
        <StatCard
          title="In Transit"
          value={stats.shipments.inTransit}
          subtitle="Active shipments"
          icon="🚚"
          color="indigo"
        />
        <StatCard
          title="Open Violations"
          value={stats.violations.open}
          subtitle={`${stats.violations.critical} critical`}
          icon="⚠️"
          color="red"
        />
        <StatCard
          title="Active Devices"
          value={stats.devices.active}
          subtitle={`${stats.devices.total} total devices`}
          icon="📡"
          color="green"
        />
      </div>

      {/* Recent Shipments */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Shipments</h2>
            <Link
              to="/shipments"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shipment #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentShipments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No shipments found
                  </td>
                </tr>
              ) : (
                recentShipments.map((shipment) => (
                  <tr key={shipment.shipment_id} className="hover:bg-gray-50">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

