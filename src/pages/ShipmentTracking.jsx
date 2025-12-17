import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shipmentsAPI, deviceStatusAPI } from '../services/api';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  Map as MapIcon,
  LocalShipping as TruckIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  ViewInAr as View3DIcon,
  ViewInArOutlined as View2DIcon,
  MyLocation as FollowCarIcon,
  LocationSearching as FollowCarOffIcon,
  CameraAlt as FirstPersonIcon,
  CameraAltOutlined as FirstPersonOffIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Map, { Marker as MapboxMarker, Popup as MapboxPopup, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to fit map bounds to markers (Leaflet)
const FitBounds = ({ positions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  
  return null;
};

// Component to fit map bounds to markers (Mapbox)
const FitBoundsMapbox = ({ mapRef, positions, shouldFit, followCar, carPosition, firstPersonView }) => {
  useEffect(() => {
    // Skip if first-person view is active (it handles its own camera)
    if (firstPersonView || !shouldFit || !mapRef) return;
    
    if (followCar && carPosition) {
      // Follow car position smoothly
      const map = mapRef.getMap();
      if (map) {
        map.easeTo({
          center: [carPosition.longitude, carPosition.latitude],
          duration: 500,
          zoom: map.getZoom(), // Keep current zoom level
        });
      }
    } else if (positions && positions.length > 0) {
      // Fit bounds to all markers
      const lats = positions.map(p => p[0]);
      const lons = positions.map(p => p[1]);
      
      const bounds = [
        [Math.min(...lons), Math.min(...lats)], // Southwest
        [Math.max(...lons), Math.max(...lats)]  // Northeast
      ];
      
      const map = mapRef.getMap();
      if (map) {
        map.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000
        });
      }
    }
  }, [mapRef, positions, shouldFit, followCar, carPosition, firstPersonView]);
  
  return null;
};

// Animated Car Marker Component for Mapbox - Using car.svg from public folder
const AnimatedCarMarker = ({ longitude, latitude, onClick, isAnimating }) => {
  const handleClick = (e) => {
    e.originalEvent?.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <MapboxMarker
      longitude={longitude}
      latitude={latitude}
      anchor="center"
      onClick={handleClick}
    >
      <Box
        sx={{
          position: 'relative',
          cursor: 'pointer',
          transition: 'transform 0.1s linear',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
          transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
          animation: isAnimating ? 'carMove 0.3s ease-in-out infinite alternate' : 'none',
          '&:hover': {
            transform: 'scale(1.2)',
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))',
          },
          '@keyframes carMove': {
            '0%': { transform: 'scale(1.05) translateY(0px)' },
            '100%': { transform: 'scale(1.1) translateY(-2px)' },
          },
        }}
      >
        <Box
          component="img"
          src="/mapbox/sprite_images/car.svg"
          alt="Car"
          sx={{
            width: '40px',
            height: '40px',
            filter: isAnimating ? 'brightness(1.1)' : 'brightness(1)',
            transition: 'filter 0.2s ease',
          }}
        />
      </Box>
    </MapboxMarker>
  );
};

// Custom 3D Truck Marker Component for Mapbox
const TruckMarker3D = ({ longitude, latitude, onClick }) => {
  const handleClick = (e) => {
    e.originalEvent?.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <MapboxMarker
      longitude={longitude}
      latitude={latitude}
      anchor="center"
      onClick={handleClick}
    >
      <Box
        sx={{
          position: 'relative',
          transform: 'perspective(600px) rotateX(-25deg) rotateY(-5deg)',
          transformStyle: 'preserve-3d',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
          '&:hover': {
            transform: 'perspective(600px) rotateX(-25deg) rotateY(-5deg) scale(1.15) translateY(-5px)',
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))',
          },
        }}
      >
        {/* Main truck body */}
        <Box
          sx={{
            width: '60px',
            height: '35px',
            backgroundColor: '#1976d2',
            borderRadius: '6px 10px 6px 6px',
            position: 'relative',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.3)',
            border: '2px solid #1565c0',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-10px',
              left: '10px',
              width: '22px',
              height: '22px',
              backgroundColor: '#1565c0',
              borderRadius: '3px',
              border: '2px solid #0d47a1',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)',
            },
          }}
        >
          {/* Truck cabin window */}
          <Box
            sx={{
              position: 'absolute',
              top: '6px',
              left: '6px',
              width: '14px',
              height: '12px',
              backgroundColor: '#64b5f6',
              borderRadius: '2px',
              border: '1px solid #1976d6',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)',
            }}
          />
          {/* Window divider */}
          <Box
            sx={{
              position: 'absolute',
              top: '6px',
              left: '13px',
              width: '1px',
              height: '12px',
              backgroundColor: '#1976d6',
            }}
          />
          {/* Truck cargo area */}
          <Box
            sx={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '24px',
              height: '25px',
              backgroundColor: '#1565c0',
              borderRadius: '3px',
              border: '2px solid #0d47a1',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)',
            }}
          />
          {/* Cargo area lines */}
          <Box
            sx={{
              position: 'absolute',
              top: '12px',
              right: '8px',
              width: '20px',
              height: '1px',
              backgroundColor: '#0d47a1',
              opacity: 0.5,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '18px',
              right: '8px',
              width: '20px',
              height: '1px',
              backgroundColor: '#0d47a1',
              opacity: 0.5,
            }}
          />
        </Box>
        
        {/* Wheels */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '-14px',
            left: '8px',
            width: '14px',
            height: '14px',
            backgroundColor: '#1a1a1a',
            borderRadius: '50%',
            border: '2px solid #333',
            boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-14px',
            right: '8px',
            width: '14px',
            height: '14px',
            backgroundColor: '#1a1a1a',
            borderRadius: '50%',
            border: '2px solid #333',
            boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1)',
          }}
        />
        
        {/* Shadow underneath */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '-18px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '50px',
            height: '10px',
            backgroundColor: 'rgba(0,0,0,0.25)',
            borderRadius: '50%',
            filter: 'blur(6px)',
          }}
        />
      </Box>
    </MapboxMarker>
  );
};

const ShipmentTracking = () => {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [deviceStatuses, setDeviceStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [error, setError] = useState('');
  const [trackingError, setTrackingError] = useState('');
  const [mapStyle, setMapStyle] = useState('leaflet'); // 'leaflet' or 'mapbox'
  const [selectedMarker, setSelectedMarker] = useState(null); // For Mapbox popup
  const [mapboxMapRef, setMapboxMapRef] = useState(null);
  const [animatedPosition, setAnimatedPosition] = useState(null); // For animated car marker
  const [isPolling, setIsPolling] = useState(true); // Control polling
  const [isSimulating, setIsSimulating] = useState(false); // Control simulation mode
  const [simulationBasePosition, setSimulationBasePosition] = useState(null); // Base position for simulation
  const [routeWaypoints, setRouteWaypoints] = useState([]); // Route waypoints for smooth movement
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0); // Current position in route
  const [routeDestination, setRouteDestination] = useState(null); // Destination for route
  const [is3D, setIs3D] = useState(false); // 3D view mode
  const [followCar, setFollowCar] = useState(true); // Auto-follow car position
  const [userInteracting, setUserInteracting] = useState(false); // Track if user is manually interacting
  const [firstPersonView, setFirstPersonView] = useState(false); // First-person view mode
  
  // Mapbox access token
  const MAPBOX_TOKEN = 'pk.eyJ1IjoibW9ycGhvLXRlY2giLCJhIjoiY21pZTJ3bXg5MDU0NDJxcjFleDEydWdwNyJ9.sUlct9NbMDjFW4v8bCUPWg';

  useEffect(() => {
    loadShipment();
  }, [id]);

  useEffect(() => {
    if (shipment?.device?.serial_number) {
      loadTrackingData();
    } else if (shipment && !shipment.device_id) {
      setTrackingError('No device assigned to this shipment');
      setLoading(false);
    } else if (shipment && shipment.device_id && !shipment.device?.serial_number) {
      setTrackingError('Device information is incomplete');
      setLoading(false);
    }
  }, [shipment]);

  // Reset selected marker when switching map styles
  useEffect(() => {
    setSelectedMarker(null);
  }, [mapStyle]);

  // Update map view when toggling 3D mode
  useEffect(() => {
    if (mapboxMapRef && mapStyle === 'mapbox') {
      const map = mapboxMapRef.getMap();
      if (map) {
        map.easeTo({
          pitch: is3D ? 60 : 0,
          bearing: is3D ? -17.6 : 0,
          duration: 1000,
        });
      }
    }
  }, [is3D, mapboxMapRef, mapStyle]);

  // Poll for new tracking data every 5 seconds (only when not simulating)
  useEffect(() => {
    if (!isPolling || !shipment?.device?.serial_number || isSimulating) return;

    const pollInterval = setInterval(() => {
      loadTrackingData(true); // Silent update (no loading spinner)
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [isPolling, shipment?.device?.serial_number, isSimulating]);

  // Calculate bearing (direction) between two points in degrees
  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360; // Normalize to 0-360
    
    return bearing;
  };

  // Generate a random destination in Muscat area for route simulation
  const generateRandomDestination = (startLat, startLon) => {
    // Generate destination 2-5km away from start
    const distance = 0.02 + Math.random() * 0.03; // ~2-5km
    const angle = Math.random() * 2 * Math.PI; // Random direction
    
    const latOffset = distance * Math.cos(angle);
    const lonOffset = distance * Math.sin(angle);
    
    const destLat = parseFloat(startLat) + latOffset;
    const destLon = parseFloat(startLon) + lonOffset;
    
    // Keep within Muscat area bounds
    return {
      latitude: Math.max(23.5, Math.min(24.0, destLat)).toFixed(6),
      longitude: Math.max(58.0, Math.min(58.6, destLon)).toFixed(6),
    };
  };

  // Fetch route from Mapbox Directions API (or create straight line)
  const fetchRoute = async (startLat, startLon, endLat, endLon) => {
    // For straight line movement, just use start and end points
    // Create intermediate points for smooth animation
    const numPoints = 50; // Number of intermediate points for smooth straight line
    const waypoints = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const ratio = i / numPoints;
      const lat = parseFloat(startLat) + (parseFloat(endLat) - parseFloat(startLat)) * ratio;
      const lon = parseFloat(startLon) + (parseFloat(endLon) - parseFloat(startLon)) * ratio;
      waypoints.push({
        latitude: lat,
        longitude: lon,
      });
    }
    
    return waypoints;
  };

  // Initialize route when simulation starts
  useEffect(() => {
    if (!isSimulating) {
      setRouteWaypoints([]);
      setCurrentWaypointIndex(0);
      return;
    }

    const initializeRoute = async () => {
      // Get starting position
      const startLat = animatedPosition?.latitude || simulationBasePosition?.latitude || '23.5880';
      const startLon = animatedPosition?.longitude || simulationBasePosition?.longitude || '58.3829';
      
      // Generate random destination
      const destination = generateRandomDestination(startLat, startLon);
      setRouteDestination(destination);
      
      // Fetch route from Mapbox
      const waypoints = await fetchRoute(startLat, startLon, destination.latitude, destination.longitude);
      
      if (waypoints && waypoints.length > 0) {
        setRouteWaypoints(waypoints);
        setCurrentWaypointIndex(0);
      } else {
        // Fallback: create simple waypoints if route fetch fails
        const fallbackWaypoints = [
          { latitude: parseFloat(startLat), longitude: parseFloat(startLon) },
          { latitude: parseFloat(destination.latitude), longitude: parseFloat(destination.longitude) },
        ];
        setRouteWaypoints(fallbackWaypoints);
        setCurrentWaypointIndex(0);
      }
    };

    initializeRoute();
  }, [isSimulating]);

  // Smooth animation along route waypoints
  useEffect(() => {
    if (!isSimulating || routeWaypoints.length === 0) return;

    let animationFrameId;
    let currentIndex = currentWaypointIndex;
    let progress = 0; // Progress between current and next waypoint (0 to 1)
    const speed = 0.0002; // Speed of movement (very slow for realistic car speed)
    let lastStatusUpdate = 0;
    const STATUS_UPDATE_INTERVAL = 500; // Update status every 500ms

    const animate = () => {
      if (currentIndex >= routeWaypoints.length - 1) {
        // Reached destination, generate new route
        const startLat = routeWaypoints[routeWaypoints.length - 1].latitude;
        const startLon = routeWaypoints[routeWaypoints.length - 1].longitude;
        const destination = generateRandomDestination(startLat.toString(), startLon.toString());
        
        fetchRoute(startLat.toString(), startLon.toString(), destination.latitude, destination.longitude)
          .then(waypoints => {
            if (waypoints && waypoints.length > 0) {
              setRouteWaypoints(waypoints);
              setCurrentWaypointIndex(0);
            }
          });
        return;
      }

      const currentWaypoint = routeWaypoints[currentIndex];
      const nextWaypoint = routeWaypoints[currentIndex + 1];

      // Interpolate between current and next waypoint
      const currentLat = currentWaypoint.latitude + (nextWaypoint.latitude - currentWaypoint.latitude) * progress;
      const currentLon = currentWaypoint.longitude + (nextWaypoint.longitude - currentWaypoint.longitude) * progress;

      // Update animated position smoothly (every frame for smooth movement)
      setAnimatedPosition({
        latitude: currentLat,
        longitude: currentLon,
        timestamp: Math.floor(Date.now() / 1000),
      });

      // Don't create pins/markers during simulation - only update position
      // The route line will show the path, and we don't want pins cluttering the map

      // Update progress
      progress += speed;
      
      // Move to next waypoint when progress reaches 1
      if (progress >= 1) {
        progress = 0;
        currentIndex++;
        setCurrentWaypointIndex(currentIndex);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isSimulating, routeWaypoints, currentWaypointIndex]);

  // Update animated position to always use the latest coordinate from response
  useEffect(() => {
    if (deviceStatuses.length > 0) {
      // Always use the first item (index 0) as it's the latest coordinate
      // Response is ordered by timestamp desc, so [0] is the most recent
      const latestStatus = deviceStatuses[0];
      const newLat = parseFloat(latestStatus.gps_latitude);
      const newLon = parseFloat(latestStatus.gps_longitude);
      
      // Validate coordinates
      if (!isNaN(newLat) && !isNaN(newLon)) {
        // Always update to the latest position, even if it's the same
        // This ensures the car marker is always at the most recent coordinate
        setAnimatedPosition({
          latitude: newLat,
          longitude: newLon,
          timestamp: latestStatus.timestamp,
        });
      }
    } else if (deviceStatuses.length === 0 && animatedPosition) {
      // Clear position if no data
      setAnimatedPosition(null);
    }
  }, [deviceStatuses]);

  // First-person view camera update during simulation
  useEffect(() => {
    if (!firstPersonView || !isSimulating || !animatedPosition || !mapboxMapRef || mapStyle !== 'mapbox') {
      return;
    }

    const map = mapboxMapRef.getMap();
    if (!map) return;

    // Calculate bearing based on current position and next waypoint
    let bearing = 0;
    if (routeWaypoints.length > 0) {
      // Find the next waypoint in the route
      if (currentWaypointIndex < routeWaypoints.length - 1) {
        const nextWaypoint = routeWaypoints[currentWaypointIndex + 1];
        bearing = calculateBearing(
          animatedPosition.latitude,
          animatedPosition.longitude,
          nextWaypoint.latitude,
          nextWaypoint.longitude
        );
      } else if (currentWaypointIndex > 0) {
        // At the end, use direction from previous waypoint to current
        const prevWaypoint = routeWaypoints[currentWaypointIndex - 1];
        bearing = calculateBearing(
          prevWaypoint.latitude,
          prevWaypoint.longitude,
          animatedPosition.latitude,
          animatedPosition.longitude
        );
      } else if (routeWaypoints.length > 1) {
        // At the start, use direction to next waypoint
        const nextWaypoint = routeWaypoints[1];
        bearing = calculateBearing(
          animatedPosition.latitude,
          animatedPosition.longitude,
          nextWaypoint.latitude,
          nextWaypoint.longitude
        );
      }
    }

    // Calculate camera offset - position behind the car (like Google Maps navigation)
    // Offset in meters behind the car (negative means behind)
    const offsetDistance = 25; // 25 meters behind for better road visibility
    const bearingRad = (bearing * Math.PI) / 180;
    
    // Convert offset to lat/lon (approximate: 1 degree lat ≈ 111km, 1 degree lon ≈ 111km * cos(lat))
    // Negative offset to position camera behind the car
    const latOffset = -(offsetDistance / 111000) * Math.cos(bearingRad);
    const lonOffset = -(offsetDistance / (111000 * Math.cos(animatedPosition.latitude * Math.PI / 180))) * Math.sin(bearingRad);
    
    const cameraLat = animatedPosition.latitude + latOffset;
    const cameraLon = animatedPosition.longitude + lonOffset;

    // Update camera for Google Maps-style driving mode
    map.easeTo({
      center: [cameraLon, cameraLat],
      bearing: bearing,
      pitch: 50, // Moderate pitch like Google Maps driving mode (looking ahead at the road)
      zoom: 18, // Zoom level similar to Google Maps navigation view
      duration: 200, // Smooth transition
    });
  }, [animatedPosition, firstPersonView, isSimulating, routeWaypoints, currentWaypointIndex, mapboxMapRef, mapStyle]);

  const loadShipment = async () => {
    try {
      setLoading(true);
      const response = await shipmentsAPI.getById(id);
      setShipment(response.data);
    } catch (error) {
      setError('Failed to load shipment details');
      console.error('Error loading shipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrackingData = async (silent = false) => {
    if (!shipment?.device?.serial_number) return;

    if (!silent) {
      setLoadingTracking(true);
    }
    setTrackingError('');

    try {
      const response = await deviceStatusAPI.getByDeviceId(shipment.device.serial_number, {
        limit: 1000,
        order_by: 'timestamp',
        order_direction: 'desc',
      });

      if (response.data.success && response.data.data) {
        // Filter out entries without valid GPS coordinates
        const validStatuses = response.data.data.filter(
          (status) => status.gps_latitude && status.gps_longitude
        );
        
        // Sort by timestamp desc to ensure latest is always at index 0
        // This ensures the car marker always uses the most recent coordinate
        validStatuses.sort((a, b) => {
          const timeA = parseFloat(a.timestamp) || 0;
          const timeB = parseFloat(b.timestamp) || 0;
          return timeB - timeA; // Descending order (newest first)
        });
        
        setDeviceStatuses(validStatuses);
        
        if (validStatuses.length === 0) {
          setTrackingError('No GPS tracking data available for this device');
        }
      } else {
        setTrackingError('Failed to load tracking data');
      }
    } catch (error) {
      setTrackingError(
        error.response?.data?.message || 
        error.message || 
        'Failed to load tracking data'
      );
      console.error('Error loading tracking data:', error);
    } finally {
      if (!silent) {
        setLoadingTracking(false);
        setLoading(false);
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // Calculate bounds for Mapbox
  const getMapBounds = () => {
    if (deviceStatuses.length === 0) {
      return {
        latitude: 23.6,
        longitude: 58.0,
        zoom: 13,
      };
    }
    
    const lats = deviceStatuses.map(s => parseFloat(s.gps_latitude));
    const lons = deviceStatuses.map(s => parseFloat(s.gps_longitude));
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;
    
    // Calculate zoom level based on bounds
    const latDiff = maxLat - minLat;
    const lonDiff = maxLon - minLon;
    const maxDiff = Math.max(latDiff, lonDiff);
    let zoom = 13;
    
    if (maxDiff > 0) {
      if (maxDiff > 10) zoom = 5;
      else if (maxDiff > 5) zoom = 6;
      else if (maxDiff > 2) zoom = 7;
      else if (maxDiff > 1) zoom = 8;
      else if (maxDiff > 0.5) zoom = 9;
      else if (maxDiff > 0.2) zoom = 10;
      else if (maxDiff > 0.1) zoom = 11;
      else if (maxDiff > 0.05) zoom = 12;
      else zoom = 13;
    }
    
    return {
      latitude: centerLat,
      longitude: centerLon,
      zoom: zoom,
    };
  };

  // Create GeoJSON line for Mapbox polyline
  const getRouteGeoJSON = () => {
    // If simulating and we have route waypoints, use the actual route path
    if (isSimulating && routeWaypoints.length > 0) {
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: routeWaypoints.map(waypoint => [
            waypoint.longitude,
            waypoint.latitude,
          ]),
        },
      };
    }
    
    // Otherwise, use device statuses
    if (deviceStatuses.length < 2) return null;
    
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: deviceStatuses.map(status => [
          parseFloat(status.gps_longitude),
          parseFloat(status.gps_latitude),
        ]),
      },
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          component={Link}
          to="/shipments"
          startIcon={<ArrowBackIcon />}
        >
          Back to Shipments
        </Button>
      </Box>
    );
  }

  if (!shipment) {
    return (
      <Box>
        <Alert severity="warning">Shipment not found</Alert>
        <Button
          component={Link}
          to="/shipments"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Shipments
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
            to={`/shipments/${id}`}
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 1 }}
          >
            Back to Shipment Details
          </Button>
          <Typography variant="h4" gutterBottom>
            Track Shipment: {shipment.shipment_number}
          </Typography>
          {shipment.device && (
            <Typography variant="body2" color="text.secondary">
              Device: {shipment.device.serial_number} ({shipment.device.device_type})
            </Typography>
          )}
        </Box>
         <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
           <ToggleButtonGroup
             value={mapStyle}
             exclusive
             onChange={(e, newStyle) => {
               if (newStyle !== null) {
                 setMapStyle(newStyle);
               }
             }}
             aria-label="map style"
             size="small"
           >
             <ToggleButton value="leaflet" aria-label="leaflet">
               <MapIcon sx={{ mr: 1 }} />
               Leaflet
             </ToggleButton>
             <ToggleButton value="mapbox" aria-label="mapbox">
               <MapIcon sx={{ mr: 1 }} />
               Mapbox
             </ToggleButton>
           </ToggleButtonGroup>
           <Button
             variant={isPolling ? "contained" : "outlined"}
             color={isPolling ? "success" : "primary"}
             startIcon={isPolling ? <PauseIcon /> : <PlayIcon />}
             onClick={() => {
               setIsPolling(!isPolling);
               if (isPolling) {
                 setIsSimulating(false); // Stop simulation when stopping polling
               }
             }}
             disabled={!shipment.device?.serial_number || isSimulating}
             size="small"
           >
             {isPolling ? 'Stop' : 'Start'} Auto-Update
           </Button>
           <Button
             variant={isSimulating ? "contained" : "outlined"}
             color={isSimulating ? "warning" : "default"}
             startIcon={isSimulating ? <PauseIcon /> : <PlayIcon />}
             onClick={() => {
               if (!isSimulating) {
                 // Start simulation - save current position as base
                 if (deviceStatuses.length > 0) {
                   setSimulationBasePosition({
                     latitude: parseFloat(deviceStatuses[0].gps_latitude),
                     longitude: parseFloat(deviceStatuses[0].gps_longitude),
                   });
                 } else {
                   // Use default Muscat coordinates
                   setSimulationBasePosition({
                     latitude: 23.5880,
                     longitude: 58.3829,
                   });
                 }
                 setIsPolling(false); // Stop real polling when simulation starts
               } else {
                 // Stop simulation - disable first-person view
                 setFirstPersonView(false);
               }
               setIsSimulating(!isSimulating);
             }}
             size="small"
           >
             {isSimulating ? 'Stop' : 'Start'} Test Simulation
           </Button>
           <Button
             variant="outlined"
             startIcon={<RefreshIcon />}
             onClick={() => loadTrackingData(false)}
             disabled={loadingTracking || !shipment.device?.serial_number || isSimulating}
           >
             Refresh
           </Button>
           {mapStyle === 'mapbox' && (
             <>
               <Button
                 variant={is3D ? "contained" : "outlined"}
                 color={is3D ? "secondary" : "default"}
                 startIcon={is3D ? <View2DIcon /> : <View3DIcon />}
                 onClick={() => setIs3D(!is3D)}
                 size="small"
                 title={is3D ? "Switch to 2D view" : "Switch to 3D view"}
               >
                 {is3D ? '2D' : '3D'}
               </Button>
               <Button
                 variant={followCar ? "contained" : "outlined"}
                 color={followCar ? "primary" : "default"}
                 startIcon={followCar ? <FollowCarIcon /> : <FollowCarOffIcon />}
                 onClick={() => {
                   setFollowCar(!followCar);
                   setUserInteracting(false);
                 }}
                 size="small"
                 title={followCar ? "Stop following car" : "Follow car position"}
               >
                 {followCar ? 'Follow' : 'Free'}
               </Button>
               <Button
                 variant={firstPersonView ? "contained" : "outlined"}
                 color={firstPersonView ? "error" : "default"}
                 startIcon={firstPersonView ? <FirstPersonIcon /> : <FirstPersonOffIcon />}
                 onClick={() => {
                   const newFirstPersonView = !firstPersonView;
                   setFirstPersonView(newFirstPersonView);
                   if (newFirstPersonView) {
                     // Enable follow car and 3D mode when enabling first-person view
                     setFollowCar(true);
                     setIs3D(true);
                   }
                 }}
                 disabled={!isSimulating}
                 size="small"
                 title={firstPersonView ? "Exit first-person view" : "Enter first-person view (simulation only)"}
               >
                 {firstPersonView ? '1st Person' : '1st Person'}
               </Button>
             </>
           )}
         </Box>
      </Box>

       {/* Error Messages */}
       {trackingError && (
         <Alert severity="warning" sx={{ mb: 2 }}>
           {trackingError}
         </Alert>
       )}

       {/* Auto-update status indicator */}
       {isPolling && shipment.device?.serial_number && !isSimulating && (
         <Alert 
           severity="info" 
           sx={{ mb: 2 }}
           icon={<Box
             sx={{
               width: 8,
               height: 8,
               borderRadius: '50%',
               backgroundColor: '#4caf50',
               animation: 'pulse 2s infinite',
               '@keyframes pulse': {
                 '0%, 100%': {
                   opacity: 1,
                   transform: 'scale(1)',
                 },
                 '50%': {
                   opacity: 0.5,
                   transform: 'scale(1.2)',
                 },
               },
             }}
           />}
         >
           Auto-updating every 5 seconds...
         </Alert>
       )}

       {/* Simulation mode indicator */}
       {isSimulating && (
         <Alert 
           severity="warning" 
           sx={{ mb: 2 }}
           icon={<Box
             sx={{
               width: 8,
               height: 8,
               borderRadius: '50%',
               backgroundColor: '#ff9800',
               animation: 'pulse 1s infinite',
               '@keyframes pulse': {
                 '0%, 100%': {
                   opacity: 1,
                   transform: 'scale(1)',
                 },
                 '50%': {
                   opacity: 0.5,
                   transform: 'scale(1.2)',
                 },
               },
             }}
           />}
         >
           <strong>Test Simulation Mode Active:</strong> Car position updating every 5 seconds with simulated movement
         </Alert>
       )}

       {/* First-person view indicator */}
       {firstPersonView && isSimulating && (
         <Alert 
           severity="info" 
           sx={{ mb: 2 }}
           icon={<FirstPersonIcon />}
         >
           <strong>First-Person View Active:</strong> Camera following car's perspective in real-time
         </Alert>
       )}

       {!shipment.device_id && (
         <Alert severity="info" sx={{ mb: 2 }}>
           No device assigned to this shipment. Please assign a device to enable tracking.
         </Alert>
       )}

       {/* Map Section */}
       {shipment.device?.serial_number && (
        <>
          {loadingTracking ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
              <CircularProgress />
            </Box>
          ) : deviceStatuses.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <LocationIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No tracking data available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                The device has not sent any GPS location data yet.
              </Typography>
            </Paper>
          ) : (
            <Box>
              {/* Map */}
              <Paper sx={{ mb: 3, overflow: 'hidden' }}>
                <Box sx={{ height: '600px', width: '100%' }}>
                  {mapStyle === 'leaflet' ? (
                    <MapContainer
                      center={[
                        parseFloat(deviceStatuses[0]?.gps_latitude) || 23.6,
                        parseFloat(deviceStatuses[0]?.gps_longitude) || 58.0
                      ]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      
                      {/* Fit bounds to all markers */}
                      <FitBounds
                        positions={deviceStatuses.map(status => [
                          parseFloat(status.gps_latitude),
                          parseFloat(status.gps_longitude)
                        ])}
                      />

                      {/* Polyline connecting all points */}
                      {deviceStatuses.length > 1 && (
                        <Polyline
                          positions={deviceStatuses.map(status => [
                            parseFloat(status.gps_latitude),
                            parseFloat(status.gps_longitude)
                          ])}
                          color="#1976d2"
                          weight={4}
                          opacity={0.7}
                        />
                      )}

                      {/* Markers for each status point */}
                      {deviceStatuses.map((status, index) => {
                        const lat = parseFloat(status.gps_latitude);
                        const lon = parseFloat(status.gps_longitude);
                        const isLatest = index === 0;
                        
                        return (
                          <Marker
                            key={status.id}
                            position={[lat, lon]}
                            icon={L.icon({
                              iconUrl: isLatest
                                ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
                                : 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                              iconSize: isLatest ? [25, 41] : [25, 41],
                              iconAnchor: [12, 41],
                              popupAnchor: [1, -34],
                            })}
                          >
                            <Popup>
                              <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                  {isLatest ? '📍 Latest Location' : `Point ${deviceStatuses.length - index}`}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Time:</strong> {formatTimestamp(status.timestamp)}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Coordinates:</strong> {lat.toFixed(6)}, {lon.toFixed(6)}
                                </Typography>
                                {status.gps_accuracy && (
                                  <Typography variant="body2">
                                    <strong>Accuracy:</strong> {parseFloat(status.gps_accuracy).toFixed(2)}m
                                  </Typography>
                                )}
                                {status.gps_altitude && (
                                  <Typography variant="body2">
                                    <strong>Altitude:</strong> {parseFloat(status.gps_altitude).toFixed(2)}m
                                  </Typography>
                                )}
                                {status.temperature !== null && (
                                  <Typography variant="body2">
                                    <strong>Temperature:</strong> {parseFloat(status.temperature).toFixed(2)}°C
                                  </Typography>
                                )}
                                {status.humidity !== null && (
                                  <Typography variant="body2">
                                    <strong>Humidity:</strong> {parseFloat(status.humidity).toFixed(2)}%
                                  </Typography>
                                )}
                                {status.status && (
                                  <Typography variant="body2">
                                    <strong>Status:</strong> {status.status}
                                  </Typography>
                                )}
                                {status.ip_address && (
                                  <Typography variant="body2">
                                    <strong>IP:</strong> {status.ip_address}
                                  </Typography>
                                )}
                              </Box>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  ) : (
                    <Map
                      ref={setMapboxMapRef}
                      mapboxAccessToken={MAPBOX_TOKEN}
                      initialViewState={{
                        ...getMapBounds(),
                        pitch: is3D ? 60 : 0,
                        bearing: is3D ? -17.6 : 0,
                      }}
                      style={{ width: '100%', height: '100%' }}
                      mapStyle={
                        firstPersonView 
                          ? "mapbox://styles/mapbox/navigation-day-v1" 
                          : is3D 
                            ? "mapbox://styles/mapbox/satellite-streets-v12" 
                            : "mapbox://styles/mapbox/streets-v12"
                      }
                      scrollZoom={!firstPersonView}
                      dragPan={!firstPersonView}
                      dragRotate={!firstPersonView}
                      doubleClickZoom={!firstPersonView}
                      touchZoomRotate={!firstPersonView}
                      onMoveStart={() => setUserInteracting(true)}
                      onMoveEnd={() => {
                        // Small delay to allow user to continue interacting
                        setTimeout(() => setUserInteracting(false), 2000);
                      }}
                      terrain={is3D ? { source: 'mapbox-dem', exaggeration: 1.5 } : undefined}
                      // Alternative: Use custom style from public folder
                      // mapStyle={`${window.location.origin}/mapbox/style.json`}
                    >
                      {/* DEM Source for 3D terrain */}
                      {is3D && (
                        <Source
                          id="mapbox-dem"
                          type="raster-dem"
                          url="mapbox://mapbox.mapbox-terrain-dem-v1"
                          tileSize={512}
                          maxzoom={14}
                        />
                      )}
                      
                      {/* Fit bounds to all markers - only when not manually interacting */}
                      <FitBoundsMapbox
                        mapRef={mapboxMapRef}
                        positions={deviceStatuses.map(status => [
                          parseFloat(status.gps_latitude),
                          parseFloat(status.gps_longitude)
                        ])}
                        shouldFit={!userInteracting && (deviceStatuses.length > 0 || animatedPosition)}
                        followCar={followCar && !userInteracting}
                        carPosition={animatedPosition}
                        firstPersonView={firstPersonView}
                      />
                      {/* Route polyline */}
                      {getRouteGeoJSON() && (
                        <Source id="route" type="geojson" data={getRouteGeoJSON()}>
                          <Layer
                            id="route-line"
                            type="line"
                            layout={{
                              'line-join': 'round',
                              'line-cap': 'round',
                            }}
                            paint={{
                              'line-color': '#1976d2',
                              'line-width': 4,
                              'line-opacity': 0.7,
                            }}
                          />
                        </Source>
                      )}

                      {/* Animated Car Marker for latest location */}
                      {animatedPosition && (
                        <AnimatedCarMarker
                          key="animated-car-marker"
                          longitude={animatedPosition.longitude}
                          latitude={animatedPosition.latitude}
                          isAnimating={isSimulating}
                          onClick={(e) => {
                            if (e?.originalEvent) {
                              e.originalEvent.stopPropagation();
                            }
                            if (deviceStatuses.length > 0) {
                              setSelectedMarker(deviceStatuses[0]);
                            } else if (animatedPosition) {
                              // Create a temporary marker object for popup
                              setSelectedMarker({
                                id: 'current-position',
                                gps_latitude: animatedPosition.latitude.toString(),
                                gps_longitude: animatedPosition.longitude.toString(),
                                timestamp: animatedPosition.timestamp,
                              });
                            }
                          }}
                        />
                      )}

                      {/* Regular markers for other status points - hide during simulation */}
                      {!isSimulating && deviceStatuses.slice(1).map((status, index) => {
                        const lat = parseFloat(status.gps_latitude);
                        const lon = parseFloat(status.gps_longitude);
                        
                        return (
                          <MapboxMarker
                            key={status.id}
                            longitude={lon}
                            latitude={lat}
                            anchor="bottom"
                            color="#1976d2"
                            onClick={(e) => {
                              e.originalEvent.stopPropagation();
                              setSelectedMarker(status);
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                        );
                      })}

                      {/* Popup for selected marker */}
                      {selectedMarker && (
                        <MapboxPopup
                          longitude={parseFloat(selectedMarker.gps_longitude)}
                          latitude={parseFloat(selectedMarker.gps_latitude)}
                          anchor="bottom"
                          onClose={() => setSelectedMarker(null)}
                          closeButton={true}
                          closeOnClick={false}
                        >
                          <Box sx={{ p: 1, minWidth: '200px', maxWidth: '300px' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              {deviceStatuses.findIndex(s => s.id === selectedMarker.id) === 0 
                                ? '📍 Latest Location' 
                                : `Point ${deviceStatuses.length - deviceStatuses.findIndex(s => s.id === selectedMarker.id)}`}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Time:</strong> {formatTimestamp(selectedMarker.timestamp)}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Coordinates:</strong> {parseFloat(selectedMarker.gps_latitude).toFixed(6)}, {parseFloat(selectedMarker.gps_longitude).toFixed(6)}
                            </Typography>
                            {selectedMarker.gps_accuracy && (
                              <Typography variant="body2">
                                <strong>Accuracy:</strong> {parseFloat(selectedMarker.gps_accuracy).toFixed(2)}m
                              </Typography>
                            )}
                            {selectedMarker.gps_altitude && (
                              <Typography variant="body2">
                                <strong>Altitude:</strong> {parseFloat(selectedMarker.gps_altitude).toFixed(2)}m
                              </Typography>
                            )}
                            {selectedMarker.temperature !== null && (
                              <Typography variant="body2">
                                <strong>Temperature:</strong> {parseFloat(selectedMarker.temperature).toFixed(2)}°C
                              </Typography>
                            )}
                            {selectedMarker.humidity !== null && (
                              <Typography variant="body2">
                                <strong>Humidity:</strong> {parseFloat(selectedMarker.humidity).toFixed(2)}%
                              </Typography>
                            )}
                            {selectedMarker.status && (
                              <Typography variant="body2">
                                <strong>Status:</strong> {selectedMarker.status}
                              </Typography>
                            )}
                            {selectedMarker.ip_address && (
                              <Typography variant="body2">
                                <strong>IP:</strong> {selectedMarker.ip_address}
                              </Typography>
                            )}
                          </Box>
                        </MapboxPopup>
                      )}
                    </Map>
                  )}
                </Box>
              </Paper>

              {/* Tracking Summary */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Total Tracking Points
                      </Typography>
                      <Typography variant="h4">
                        {deviceStatuses.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Latest Update
                      </Typography>
                      <Typography variant="h6">
                        {deviceStatuses.length > 0 
                          ? formatTimestamp(deviceStatuses[0].timestamp)
                          : 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        First Record
                      </Typography>
                      <Typography variant="h6">
                        {deviceStatuses.length > 0
                          ? formatTimestamp(deviceStatuses[deviceStatuses.length - 1].timestamp)
                          : 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Latest Status Details */}
              {deviceStatuses.length > 0 && (
                <Paper sx={{ mt: 3, p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Latest Status Details
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body1">
                        {parseFloat(deviceStatuses[0].gps_latitude).toFixed(6)}, {parseFloat(deviceStatuses[0].gps_longitude).toFixed(6)}
                      </Typography>
                    </Grid>
                    {deviceStatuses[0].gps_accuracy && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          GPS Accuracy
                        </Typography>
                        <Typography variant="body1">
                          {parseFloat(deviceStatuses[0].gps_accuracy).toFixed(2)}m
                        </Typography>
                      </Grid>
                    )}
                    {deviceStatuses[0].temperature !== null && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          Temperature
                        </Typography>
                        <Typography variant="body1">
                          {parseFloat(deviceStatuses[0].temperature).toFixed(2)}°C
                        </Typography>
                      </Grid>
                    )}
                    {deviceStatuses[0].humidity !== null && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          Humidity
                        </Typography>
                        <Typography variant="body1">
                          {parseFloat(deviceStatuses[0].humidity).toFixed(2)}%
                        </Typography>
                      </Grid>
                    )}
                    {deviceStatuses[0].status && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          Device Status
                        </Typography>
                        <Chip 
                          label={deviceStatuses[0].status} 
                          color="primary" 
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Grid>
                    )}
                    {deviceStatuses[0].firmware_version && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          Firmware
                        </Typography>
                        <Typography variant="body1">
                          {deviceStatuses[0].firmware_version}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ShipmentTracking;

