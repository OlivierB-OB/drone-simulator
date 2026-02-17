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

  // Rotation speed in degrees per second (realistic drone rotation: 30-90°/s)
  rotationSpeed: 60,
};

export const cameraConfig = {
  // Field of view in degrees (determines camera lens width)
  fov: 75,

  // Minimum distance from camera to render (prevents clipping near camera)
  near: 0.1,

  // Maximum distance from camera to render (far clipping plane)
  far: 1000,
};

export const sceneConfig = {
  // Background color (dark navy)
  backgroundColor: 0x1a1a2e,
};

export const elevationConfig = {
  // Web Mercator zoom level for terrain tiles (13 ≈ 25m resolution per pixel)
  zoomLevel: 13,

  // Number of tiles in each direction from center (3 = 7×7 grid of tiles)
  ringRadius: 3,

  // Maximum concurrent tile downloads (prevents network saturation)
  maxConcurrentLoads: 3,
};
