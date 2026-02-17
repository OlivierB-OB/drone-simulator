/**
 * Drone Simulator Configuration
 */

export const droneConfig = {
  // Initial position: Paris Île de la Cité: 48.8530°N, 2.3499°E
  initialCoordinates: {
    latitude: 48.853,
    longitude: 2.3499,
  },

  // Initial azimuth in degrees (0 = North, 90 = East, 180 = South, 270 = West)
  initialAzimuth: 0,

  // Movement speed in meters per second (realistic drone cruising speed: 10-15 m/s)
  movementSpeed: 12,

  // Mouse sensitivity for azimuth control (degrees per pixel of mouse movement)
  mouseSensitivity: 0.5,

  // Elevation bounds in meters (0 = ground level)
  elevationMinimum: 0,
  elevationMaximum: 500,

  // Elevation change per mouse wheel tick in meters
  wheelElevationSensitivity: 5,
};

export const cameraConfig = {
  // Field of view in degrees (determines camera lens width)
  fov: 75,

  // Minimum distance from camera to render (prevents clipping near camera)
  near: 0.1,

  // Maximum distance from camera to render (far clipping plane)
  // Set to 100km to accommodate terrain tiles positioned far from origin in Mercator space
  far: 100000,
};

export const sceneConfig = {
  // Background color (dark navy)
  backgroundColor: 0x1a1a2e,
};

export const elevationConfig = {
  // Web Mercator zoom level for terrain tiles (13 ≈ 25m resolution per pixel)
  zoomLevel: 15,

  // Number of tiles in each direction from center (1 = 3×3 grid of tiles)
  ringRadius: 1,

  // Maximum concurrent tile downloads (prevents network saturation)
  maxConcurrentLoads: 3,
};

export const debugConfig = {
  // Show visual axes helper for debugging coordinate system (red=X, green=Y, blue=Z)
  showAxisHelper: true,

  // Size of the axes helper visualization
  axesHelperSize: 500,

  // Use simple unlit mesh material for terrain instead of realistic phong shading
  useSimpleTerrainMaterial: false,
};
