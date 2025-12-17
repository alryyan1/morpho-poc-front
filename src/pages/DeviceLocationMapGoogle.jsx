import { useState, useEffect, useRef } from 'react';
import { Box, TextField, MenuItem, Paper, CircularProgress, Alert, Button, Autocomplete } from '@mui/material';
import { devicesAPI, deviceStatusAPI } from '../services/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyA6TcM28YXya6gQ6GasdGXWkjU3HmLqxss';

const DeviceLocationMapGoogle = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [deviceStatuses, setDeviceStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [sourceMarker, setSourceMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [sourceCoord, setSourceCoord] = useState(null);
  const [destinationCoord, setDestinationCoord] = useState(null);
  const [sourceSearch, setSourceSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [sourceCoordInput, setSourceCoordInput] = useState('');
  const [destinationCoordInput, setDestinationCoordInput] = useState('');
  const [trackingMode, setTrackingMode] = useState('source'); // 'source' or 'destination'
  const [sourceAutocomplete, setSourceAutocomplete] = useState(null);
  const [destinationAutocomplete, setDestinationAutocomplete] = useState(null);
  const mapRef = useRef(null);
  const sourceInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const googleMapsLoaded = useRef(false);
  const [mapsReady, setMapsReady] = useState(false);
  const trackingModeRef = useRef('source');

  // Update trackingModeRef when trackingMode changes
  useEffect(() => {
    trackingModeRef.current = trackingMode;
  }, [trackingMode]);

  // Define helper functions (using refs to access current state)
  const updateSourceMarker = (coord) => {
    if (!map || !window.google) return;

    setSourceMarker(prevMarker => {
      if (prevMarker) {
        prevMarker.setMap(null);
      }

      try {
        const marker = new window.google.maps.Marker({
          position: { lat: coord[1], lng: coord[0] },
          map: map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#27ae60',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
          title: 'Source',
        });

        return marker;
      } catch (err) {
        console.error('Error creating source marker:', err);
        return prevMarker;
      }
    });
  };

  const updateDestinationMarker = (coord) => {
    if (!map || !window.google) return;

    setDestinationMarker(prevMarker => {
      if (prevMarker) {
        prevMarker.setMap(null);
      }

      try {
        const marker = new window.google.maps.Marker({
          position: { lat: coord[1], lng: coord[0] },
          map: map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#e74c3c',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
          title: 'Destination',
        });

        return marker;
      } catch (err) {
        console.error('Error creating destination marker:', err);
        return prevMarker;
      }
    });
  };

  // Load Google Maps script
  useEffect(() => {
    if (googleMapsLoaded.current || window.google) {
      googleMapsLoaded.current = true;
      setMapsReady(true);
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      if (window.google) {
        googleMapsLoaded.current = true;
        setMapsReady(true);
      } else {
        existingScript.addEventListener('load', () => {
          googleMapsLoaded.current = true;
          setMapsReady(true);
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleMapsLoaded.current = true;
      setMapsReady(true);
    };
    script.onerror = () => {
      setError('Failed to load Google Maps. Please check your API key and network connection.');
      setLoading(false);
    };
    document.head.appendChild(script);
  }, []);

  // Initialize Google Map
  useEffect(() => {
    if (!mapsReady || !window.google || !mapRef.current || map) return;

    try {
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 20.0, lng: 55.5 },
        zoom: 8,
        mapTypeId: 'roadmap',
        tilt: 45,
        heading: 0,
      });

      setMap(googleMap);

      // Map click handler - define inline to avoid closure issues
      googleMap.addListener('click', (e) => {
        const coord = [e.latLng.lng(), e.latLng.lat()];
        const currentMode = trackingModeRef.current;
        
        if (currentMode === 'source') {
          setSourceCoord(coord);
          setSourceCoordInput(`${coord[1].toFixed(6)}, ${coord[0].toFixed(6)}`);
          
          // Update source marker inline
          setSourceMarker(prevMarker => {
            if (prevMarker) prevMarker.setMap(null);
            try {
              return new window.google.maps.Marker({
                position: { lat: coord[1], lng: coord[0] },
                map: googleMap,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#27ae60',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                },
                title: 'Source',
              });
            } catch (err) {
              console.error('Error creating source marker:', err);
              return prevMarker;
            }
          });
          
          // Reverse geocode to get address
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: coord[1], lng: coord[0] } },
            (results, status) => {
              if (status === 'OK' && results[0]) {
                setSourceSearch(results[0].formatted_address);
              }
            }
          );
        } else if (currentMode === 'destination') {
          setDestinationCoord(coord);
          setDestinationCoordInput(`${coord[1].toFixed(6)}, ${coord[0].toFixed(6)}`);
          
          // Update destination marker inline
          setDestinationMarker(prevMarker => {
            if (prevMarker) prevMarker.setMap(null);
            try {
              return new window.google.maps.Marker({
                position: { lat: coord[1], lng: coord[0] },
                map: googleMap,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#e74c3c',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                },
                title: 'Destination',
              });
            } catch (err) {
              console.error('Error creating destination marker:', err);
              return prevMarker;
            }
          });
          
          // Reverse geocode to get address
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: coord[1], lng: coord[0] } },
            (results, status) => {
              if (status === 'OK' && results[0]) {
                setDestinationSearch(results[0].formatted_address);
              }
            }
          );
        }
      });
    } catch (err) {
      console.error('Error initializing Google Map:', err);
      setError('Failed to initialize Google Maps. ' + err.message);
    }
  }, [mapsReady, map]);

  // Initialize Autocomplete after map and refs are ready
  useEffect(() => {
    if (!mapsReady || !window.google || !map) return;

    // Use setTimeout to ensure refs are set after render
    const timer = setTimeout(() => {
      try {
        // Initialize Autocomplete for source
        if (sourceInputRef.current && !sourceInputRef.current.dataset.autocompleteInit) {
          const sourceAutocompleteInstance = new window.google.maps.places.Autocomplete(
            sourceInputRef.current,
            { types: ['geocode'] }
          );
          sourceInputRef.current.dataset.autocompleteInit = 'true';
          
          sourceAutocompleteInstance.addListener('place_changed', () => {
            const place = sourceAutocompleteInstance.getPlace();
            if (place.geometry && map) {
              const coord = [place.geometry.location.lng(), place.geometry.location.lat()];
              setSourceCoord(coord);
              setSourceSearch(place.formatted_address || place.name);
              setSourceCoordInput(`${place.geometry.location.lat()}, ${place.geometry.location.lng()}`);
              
              setSourceMarker(prevMarker => {
                if (prevMarker) prevMarker.setMap(null);
                try {
                  return new window.google.maps.Marker({
                    position: { lat: coord[1], lng: coord[0] },
                    map: map,
                    icon: {
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: '#27ae60',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 3,
                    },
                    title: 'Source',
                  });
                } catch (err) {
                  console.error('Error creating source marker:', err);
                  return prevMarker;
                }
              });
            }
          });
          setSourceAutocomplete(sourceAutocompleteInstance);
        }

        // Initialize Autocomplete for destination
        if (destinationInputRef.current && !destinationInputRef.current.dataset.autocompleteInit) {
          const destAutocompleteInstance = new window.google.maps.places.Autocomplete(
            destinationInputRef.current,
            { types: ['geocode'] }
          );
          destinationInputRef.current.dataset.autocompleteInit = 'true';
          
          destAutocompleteInstance.addListener('place_changed', () => {
            const place = destAutocompleteInstance.getPlace();
            if (place.geometry && map) {
              const coord = [place.geometry.location.lng(), place.geometry.location.lat()];
              setDestinationCoord(coord);
              setDestinationSearch(place.formatted_address || place.name);
              setDestinationCoordInput(`${place.geometry.location.lat()}, ${place.geometry.location.lng()}`);
              
              setDestinationMarker(prevMarker => {
                if (prevMarker) prevMarker.setMap(null);
                try {
                  return new window.google.maps.Marker({
                    position: { lat: coord[1], lng: coord[0] },
                    map: map,
                    icon: {
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: '#e74c3c',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 3,
                    },
                    title: 'Destination',
                  });
                } catch (err) {
                  console.error('Error creating destination marker:', err);
                  return prevMarker;
                }
              });
            }
          });
          setDestinationAutocomplete(destAutocompleteInstance);
        }
      } catch (err) {
        console.error('Error initializing Autocomplete:', err);
      }
    }, 500); // Increased delay to ensure refs are ready

    return () => clearTimeout(timer);
  }, [mapsReady, map]);

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      loadDeviceStatuses();
      const interval = setInterval(() => {
        loadDeviceStatuses();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    if (map && deviceStatuses.length > 0) {
      updateMapMarkers();
      focusOnLastCoordinate();
    }
  }, [map, deviceStatuses]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await devicesAPI.getAll();
      
      const devicesList = response.data?.data || response.data || [];
      
      if (Array.isArray(devicesList) && devicesList.length > 0) {
        setDevices(devicesList);
        if (!selectedDeviceId && devicesList.length > 0) {
          const defaultDevice = devicesList.find(d => d.serial_number === '2228268') || devicesList[0];
          setSelectedDeviceId(defaultDevice.serial_number);
        }
      } else {
        setError('No devices available');
        setDevices([]);
      }
    } catch (error) {
      setError('Failed to load devices');
      console.error('Error loading devices:', error);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceStatuses = async () => {
    if (!selectedDeviceId) return;

    try {
      const response = await deviceStatusAPI.getByDeviceId(selectedDeviceId, {
        limit: 100,
        offset: 0,
        order_by: 'timestamp',
        order_direction: 'desc',
      });

      if (response.data.success && response.data.data) {
        const sortedData = [...response.data.data].sort((a, b) => b.id - a.id);
        setDeviceStatuses(sortedData);
      }
    } catch (error) {
      console.error('Error loading device statuses:', error);
    }
  };

  const updateMapMarkers = () => {
    if (!map || !window.google) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers = [];

    // Filter coordinates with GPS data
    const coordinates = deviceStatuses
      .filter(status => status.gps_latitude && status.gps_longitude)
      .map(status => ({
        lat: parseFloat(status.gps_latitude),
        lng: parseFloat(status.gps_longitude),
        data: status,
      }))
      .reverse(); // Oldest to newest

    // Create markers
    coordinates.forEach((coord, index) => {
      const isFirst = index === 0;
      const isLast = index === coordinates.length - 1;

      const marker = new window.google.maps.Marker({
        position: { lat: coord.lat, lng: coord.lng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isFirst ? 8 : isLast ? 10 : 6,
          fillColor: isFirst ? '#27ae60' : isLast ? '#e74c3c' : '#3498db',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: `Point ${index + 1}`,
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 5px;">
            <strong>Point ${index + 1}</strong><br/>
            <strong>Time:</strong> ${formatTimestamp(coord.data.timestamp)}<br/>
            <strong>Coordinates:</strong> ${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}<br/>
            ${coord.data.temperature !== null ? `<strong>Temperature:</strong> ${parseFloat(coord.data.temperature).toFixed(2)}°C<br/>` : ''}
            ${coord.data.humidity !== null ? `<strong>Humidity:</strong> ${parseFloat(coord.data.humidity).toFixed(2)}%<br/>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Draw route polyline
    if (coordinates.length > 1) {
      if (routePolyline) {
        routePolyline.setMap(null);
      }

      const path = coordinates.map(coord => ({ lat: coord.lat, lng: coord.lng }));

      const polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#4285f4',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map,
      });

      setRoutePolyline(polyline);
    }
  };

  const focusOnLastCoordinate = () => {
    if (!map || deviceStatuses.length === 0) return;

    const lastStatus = deviceStatuses[0]; // Most recent (first in sorted array)
    if (lastStatus.gps_latitude && lastStatus.gps_longitude) {
      const lat = parseFloat(lastStatus.gps_latitude);
      const lng = parseFloat(lastStatus.gps_longitude);

      map.setCenter({ lat, lng });
      map.setZoom(15);
    }
  };

  const handleTrackRoute = () => {
    if (!sourceCoord || !destinationCoord || !map || !window.google) return;

    // Filter coordinates between source and destination
    const coordinates = deviceStatuses
      .filter(status => status.gps_latitude && status.gps_longitude)
      .map(status => ({
        lat: parseFloat(status.gps_latitude),
        lng: parseFloat(status.gps_longitude),
      }));

    // Find nearest points to source and destination
    const sourceNearest = findNearestCoordinate(sourceCoord, coordinates);
    const destNearest = findNearestCoordinate(destinationCoord, coordinates);

    const sourceIndex = coordinates.findIndex(c => 
      Math.abs(c.lat - sourceNearest.lat) < 0.0001 && 
      Math.abs(c.lng - sourceNearest.lng) < 0.0001
    );
    const destIndex = coordinates.findIndex(c => 
      Math.abs(c.lat - destNearest.lat) < 0.0001 && 
      Math.abs(c.lng - destNearest.lng) < 0.0001
    );

    if (sourceIndex !== -1 && destIndex !== -1) {
      const startIndex = Math.min(sourceIndex, destIndex);
      const endIndex = Math.max(sourceIndex, destIndex);
      const routePath = coordinates.slice(startIndex, endIndex + 1);

      if (routePolyline) {
        routePolyline.setMap(null);
      }

      const polyline = new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: '#e74c3c',
        strokeOpacity: 0.8,
        strokeWeight: 6,
        map: map,
      });

      setRoutePolyline(polyline);

      // Fit bounds to route
      const bounds = new window.google.maps.LatLngBounds();
      routePath.forEach(coord => bounds.extend(coord));
      bounds.extend({ lat: sourceCoord[1], lng: sourceCoord[0] });
      bounds.extend({ lat: destinationCoord[1], lng: destinationCoord[0] });
      map.fitBounds(bounds);
    }
  };

  const findNearestCoordinate = (targetCoord, coordinates) => {
    let nearest = coordinates[0];
    let minDistance = Infinity;

    coordinates.forEach(coord => {
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(coord.lat, coord.lng),
        new window.google.maps.LatLng(targetCoord[1], targetCoord[0])
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = coord;
      }
    });

    return nearest;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const handleDeviceChange = (event) => {
    setSelectedDeviceId(event.target.value);
    setDeviceStatuses([]);
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
    if (routePolyline) {
      routePolyline.setMap(null);
      setRoutePolyline(null);
    }
  };

  const handleClearTracking = () => {
    setSourceCoord(null);
    setDestinationCoord(null);
    setSourceSearch('');
    setDestinationSearch('');
    setSourceCoordInput('');
    setDestinationCoordInput('');
    setTrackingMode('source');
    if (sourceMarker) {
      sourceMarker.setMap(null);
      setSourceMarker(null);
    }
    if (destinationMarker) {
      destinationMarker.setMap(null);
      setDestinationMarker(null);
    }
    if (routePolyline) {
      routePolyline.setMap(null);
      setRoutePolyline(null);
    }
    if (map && deviceStatuses.length > 0) {
      updateMapMarkers();
      focusOnLastCoordinate();
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {/* Device Selector */}
      <Paper
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1000,
          p: 2,
          minWidth: 300,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <span>Loading devices...</span>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        ) : (
          <TextField
            select
            label="Select Device"
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            fullWidth
            size="small"
            sx={{ minWidth: 250 }}
          >
            {devices.length === 0 ? (
              <MenuItem value="" disabled>
                No devices available
              </MenuItem>
            ) : (
              devices.map((device) => (
                <MenuItem key={device.device_id} value={device.serial_number}>
                  {device.serial_number} {device.device_type && `(${device.device_type})`}
                </MenuItem>
              ))
            )}
          </TextField>
        )}
      </Paper>

      {/* Route Tracking Panel */}
      <Paper
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          zIndex: 1000,
          p: 2,
          minWidth: 350,
          maxWidth: 400,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Button
              variant={trackingMode === 'source' ? 'contained' : 'outlined'}
              onClick={() => setTrackingMode('source')}
              size="small"
              fullWidth
            >
              Set Source
            </Button>
            <Button
              variant={trackingMode === 'destination' ? 'contained' : 'outlined'}
              onClick={() => setTrackingMode('destination')}
              size="small"
              fullWidth
            >
              Set Destination
            </Button>
          </Box>
          <TextField
            fullWidth
            size="small"
            label="Source"
            value={sourceSearch}
            onChange={(e) => setSourceSearch(e.target.value)}
            inputRef={sourceInputRef}
            placeholder="Search place name or click on map"
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            size="small"
            label="Source Coordinates"
            value={sourceCoordInput}
            onChange={(e) => {
              setSourceCoordInput(e.target.value);
              const value = e.target.value.trim();
              if (value) {
                const parts = value.split(',');
                if (parts.length === 2) {
                  const lat = parseFloat(parts[0].trim());
                  const lng = parseFloat(parts[1].trim());
                  if (!isNaN(lat) && !isNaN(lng) && map) {
                    const coord = [lng, lat];
                    setSourceCoord(coord);
                    setSourceMarker(prevMarker => {
                      if (prevMarker) prevMarker.setMap(null);
                      try {
                        return new window.google.maps.Marker({
                          position: { lat: coord[1], lng: coord[0] },
                          map: map,
                          icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: '#27ae60',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                          },
                          title: 'Source',
                        });
                      } catch (err) {
                        console.error('Error creating source marker:', err);
                        return prevMarker;
                      }
                    });
                  }
                }
              }
            }}
            placeholder="Or enter coordinates (Lat, Lng)"
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            size="small"
            label="Destination"
            value={destinationSearch}
            onChange={(e) => setDestinationSearch(e.target.value)}
            inputRef={destinationInputRef}
            placeholder="Search place name or click on map"
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            size="small"
            label="Destination Coordinates"
            value={destinationCoordInput}
            onChange={(e) => {
              setDestinationCoordInput(e.target.value);
              const value = e.target.value.trim();
              if (value) {
                const parts = value.split(',');
                if (parts.length === 2) {
                  const lat = parseFloat(parts[0].trim());
                  const lng = parseFloat(parts[1].trim());
                  if (!isNaN(lat) && !isNaN(lng) && map) {
                    const coord = [lng, lat];
                    setDestinationCoord(coord);
                    setDestinationMarker(prevMarker => {
                      if (prevMarker) prevMarker.setMap(null);
                      try {
                        return new window.google.maps.Marker({
                          position: { lat: coord[1], lng: coord[0] },
                          map: map,
                          icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: '#e74c3c',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                          },
                          title: 'Destination',
                        });
                      } catch (err) {
                        console.error('Error creating destination marker:', err);
                        return prevMarker;
                      }
                    });
                  }
                }
              }
            }}
            placeholder="Or enter coordinates (Lat, Lng)"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleTrackRoute}
            disabled={!sourceCoord || !destinationCoord}
            fullWidth
          >
            Track Route
          </Button>
          <Button
            variant="outlined"
            onClick={handleClearTracking}
            fullWidth
          >
            Clear
          </Button>
        </Box>
      </Paper>

      {/* Google Map */}
      {error && !map && (
        <Alert 
          severity="error" 
          sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 2000,
            minWidth: 300,
          }}
        >
          {error}
        </Alert>
      )}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100vh',
        }}
      />
    </Box>
  );
};

export default DeviceLocationMapGoogle;
