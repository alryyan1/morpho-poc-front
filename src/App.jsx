import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Shipments from './pages/Shipments';
import ShipmentDetail from './pages/ShipmentDetail';
import ShipmentTracking from './pages/ShipmentTracking';
import CreateShipment from './pages/CreateShipment';
import IoTDevices from './pages/IoTDevices';
import DeviceStatuses from './pages/DeviceStatuses';
import Policies from './pages/Policies';
import Violations from './pages/Violations';
import Users from './pages/Users';
import TestDeviceStatus from './pages/TestDeviceStatus';
import DeviceLocationMap from './pages/DeviceLocationMap';
import DeviceLocationMapGoogle from './pages/DeviceLocationMapGoogle';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipments"
          element={
            <ProtectedRoute>
              <Layout>
                <Shipments />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipments/new"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateShipment />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipments/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ShipmentDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipments/:id/tracking"
          element={
            <ProtectedRoute>
              <Layout>
                <ShipmentTracking />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/devices"
          element={
            <ProtectedRoute>
              <Layout>
                <IoTDevices />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/devices/:id/statuses"
          element={
            <ProtectedRoute>
              <Layout>
                <DeviceStatuses />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/policies"
          element={
            <ProtectedRoute>
              <Layout>
                <Policies />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/violations"
          element={
            <ProtectedRoute>
              <Layout>
                <Violations />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-device-status"
          element={
            <ProtectedRoute>
              <Layout>
                <TestDeviceStatus />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/device-location-map"
          element={
            <ProtectedRoute>
              <DeviceLocationMap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/device-location-map-google"
          element={
            <ProtectedRoute>
              <DeviceLocationMapGoogle />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
