import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nova-suits.com/morpho-poc/public/api/v1/tms';
const Tel_NET_API_BASE_URL = import.meta.env.VITE_TELNET_API_BASE_URL || 'https://nova-suits.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Shipments API
export const shipmentsAPI = {
  getAll: (params) => api.get('/shipments', { params }),
  getById: (id) => api.get(`/shipments/${id}`),
  create: (data) => api.post('/shipments', data),
  update: (id, data) => api.patch(`/shipments/${id}`, data),
  delete: (id) => api.delete(`/shipments/${id}`),
  updateStatus: (id, status) => api.patch(`/shipments/${id}/status`, { status }),
  addContainer: (id, data) => api.post(`/shipments/${id}/containers`, data),
  addPackage: (shipmentId, containerId, data) => 
    api.post(`/shipments/${shipmentId}/containers/${containerId}/packages`, data),
};

// IoT Devices API
export const devicesAPI = {
  getAll: (params) => api.get('/iot/devices', { params }),
  getById: (id) => api.get(`/iot/devices/${id}`),
  create: (data) => api.post('/iot/devices', data),
  update: (id, data) => api.patch(`/iot/devices/${id}`, data),
  assign: (data) => api.post('/iot/devices/assign', data),
  unassign: (id) => api.post(`/iot/devices/${id}/unassign`),
};

// Telemetry API
export const telemetryAPI = {
  submit: (data) => api.post('/iot/telemetry', data),
  getByShipment: (shipmentId, params) => 
    api.get(`/shipments/${shipmentId}/telemetry`, { params }),
};

// Policies API
export const policiesAPI = {
  getAll: (params) => api.get('/policies', { params }),
  getById: (id) => api.get(`/policies/${id}`),
  create: (data) => api.post('/policies', data),
  update: (id, data) => api.patch(`/policies/${id}`, data),
  addRule: (id, data) => api.post(`/policies/${id}/rules`, data),
};

// Tracking API
export const trackingAPI = {
  getTracking: (shipmentId) => api.get(`/shipments/${shipmentId}/tracking`),
  getTimeline: (shipmentId) => api.get(`/shipments/${shipmentId}/timeline`),
  addEvent: (shipmentId, data) => api.post(`/shipments/${shipmentId}/events`, data),
};

// POD API
export const podAPI = {
  submit: (shipmentId, data) => api.post(`/shipments/${shipmentId}/pod`, data),
  get: (shipmentId) => api.get(`/shipments/${shipmentId}/pod`),
};

// Violations API
export const violationsAPI = {
  getAll: (params) => api.get('/violations', { params }),
  getById: (id) => api.get(`/violations/${id}`),
  resolve: (id, data) => api.post(`/violations/${id}/resolve`, data),
  close: (id) => api.post(`/violations/${id}/close`),
};

// Users API (to be implemented in backend)
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Roles API (to be implemented in backend)
export const rolesAPI = {
  getAll: () => api.get('/roles'),
};

// Tenants API (to be implemented in backend)
export const tenantsAPI = {
  getAll: () => api.get('/tenants'),
};

// Locations API
export const locationsAPI = {
  getAll: () => api.get('/locations'),
  getById: (id) => api.get(`/locations/${id}`),
  create: (data) => api.post('/locations', data),
  update: (id, data) => api.patch(`/locations/${id}`, data),
  delete: (id) => api.delete(`/locations/${id}`),
};

// Device Status API (telnet-api service)
const telnetApi = axios.create({
  baseURL: Tel_NET_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const deviceStatusAPI = {
  getByDeviceId: (deviceId, params) => 
    telnetApi.get(`/device-statuses/${deviceId}`, { params }),
  getLatest: (deviceId) => 
    telnetApi.get(`/device-statuses/${deviceId}/latest`),
};

export default api;

