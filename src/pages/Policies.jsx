import { useState, useEffect } from 'react';
import { policiesAPI } from '../services/api';

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rules: [{ sensor_type: '', min_value: '', max_value: '', operator: 'between' }],
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const response = await policiesAPI.getAll();
      const data = response.data.data || response.data || [];
      setPolicies(data);
    } catch (error) {
      console.error('Error loading policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = () => {
    setFormData({
      ...formData,
      rules: [...formData.rules, { sensor_type: '', min_value: '', max_value: '', operator: 'between' }],
    });
  };

  const handleRuleChange = (index, field, value) => {
    const newRules = [...formData.rules];
    newRules[index][field] = value;
    setFormData({ ...formData, rules: newRules });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await policiesAPI.create(formData);
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        rules: [{ sensor_type: '', min_value: '', max_value: '', operator: 'between' }],
      });
      loadPolicies();
    } catch (error) {
      alert('Failed to create policy');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading policies...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Policies</h1>
          <p className="text-gray-600 mt-1">Manage compliance policies and rules</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Create Policy
        </button>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {policies.map((policy) => (
          <div key={policy.policy_id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{policy.name}</h3>
                {policy.description && (
                  <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
                )}
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  policy.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {policy.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {policy.rules && policy.rules.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Rules:</p>
                <div className="space-y-2">
                  {policy.rules.map((rule, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded text-sm">
                      <span className="font-medium">{rule.sensor_type}</span>
                      {' '}
                      {rule.operator === 'between' && (
                        <span>
                          between {rule.min_value} and {rule.max_value}
                        </span>
                      )}
                      {rule.operator === 'less_than' && (
                        <span>less than {rule.max_value}</span>
                      )}
                      {rule.operator === 'greater_than' && (
                        <span>greater than {rule.min_value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {policies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No policies created yet</p>
        </div>
      )}

      {/* Create Policy Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold mb-4">Create New Policy</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Policy Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows="3"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Rules</label>
                    <button
                      type="button"
                      onClick={handleAddRule}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Rule
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.rules.map((rule, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Sensor Type</label>
                            <input
                              type="text"
                              value={rule.sensor_type}
                              onChange={(e) => handleRuleChange(index, 'sensor_type', e.target.value)}
                              required
                              placeholder="temperature, humidity, etc."
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Operator</label>
                            <select
                              value={rule.operator}
                              onChange={(e) => handleRuleChange(index, 'operator', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            >
                              <option value="between">Between</option>
                              <option value="less_than">Less Than</option>
                              <option value="greater_than">Greater Than</option>
                              <option value="equals">Equals</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Min Value</label>
                            <input
                              type="number"
                              step="0.01"
                              value={rule.min_value}
                              onChange={(e) => handleRuleChange(index, 'min_value', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Max Value</label>
                            <input
                              type="number"
                              step="0.01"
                              value={rule.max_value}
                              onChange={(e) => handleRuleChange(index, 'max_value', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Policies;

