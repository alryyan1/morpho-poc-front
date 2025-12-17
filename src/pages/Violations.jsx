import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { violationsAPI } from '../services/api';

const Violations = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', severity: '' });

  useEffect(() => {
    loadViolations();
  }, [filters]);

  const loadViolations = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.severity) params.severity = filters.severity;

      const response = await violationsAPI.getAll(params);
      const data = response.data.data || response.data || [];
      setViolations(data);
    } catch (error) {
      console.error('Error loading violations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    if (!confirm('Mark this violation as resolved?')) return;

    try {
      await violationsAPI.resolve(id, {});
      loadViolations();
    } catch (error) {
      alert('Failed to resolve violation');
      console.error(error);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'yellow',
      medium: 'orange',
      high: 'red',
      critical: 'red',
    };
    return colors[severity] || 'gray';
  };

  if (loading) {
    return <div className="text-center py-8">Loading violations...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Violations</h1>
        <p className="text-gray-600 mt-1">Monitor and manage policy violations</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Violations List */}
      <div className="space-y-4">
        {violations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No violations found</p>
          </div>
        ) : (
          violations.map((violation) => (
            <div key={violation.violation_id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full bg-${getSeverityColor(violation.severity)}-100 text-${getSeverityColor(violation.severity)}-800`}
                    >
                      {violation.severity.toUpperCase()}
                    </span>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        violation.status === 'open'
                          ? 'bg-red-100 text-red-800'
                          : violation.status === 'resolved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {violation.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {violation.sensor_type} Violation
                  </h3>
                  {violation.description && (
                    <p className="text-sm text-gray-600 mt-1">{violation.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">{violation.value}</p>
                  {violation.limit_exceeded && (
                    <p className="text-xs text-gray-500">
                      Limit: {violation.limit_exceeded}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-600">Shipment</p>
                  <Link
                    to={`/shipments/${violation.shipment_id}`}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    View Shipment →
                  </Link>
                </div>
                {violation.device && (
                  <div>
                    <p className="text-gray-600">Device</p>
                    <p className="text-gray-900">{violation.device.serial_number}</p>
                  </div>
                )}
                {violation.policy && (
                  <div>
                    <p className="text-gray-600">Policy</p>
                    <p className="text-gray-900">{violation.policy.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Detected</p>
                  <p className="text-gray-900">
                    {new Date(violation.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {violation.status === 'open' && (
                <div className="flex justify-end">
                  <button
                    onClick={() => handleResolve(violation.violation_id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Mark as Resolved
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Violations;

