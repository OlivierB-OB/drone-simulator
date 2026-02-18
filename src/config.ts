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
  movementSpeed: 1200,

  // Mouse sensitivity for azimuth control (degrees per pixel of mouse movement)
  mouseSensitivity: 0.2,

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

  // Chase camera: distance behind the drone in meters
  chaseDistance: 20,

  // Chase camera: height above the drone in meters
  chaseHeight: 10,
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

export const contextDataConfig = {
  // Web Mercator zoom level for context data tiles (14-15 balances detail vs. request size)
  zoomLevel: 14,

  // Number of tiles in each direction from center (1 = 3×3 grid of tiles)
  ringRadius: 1,

  // Maximum concurrent Overpass API requests
  maxConcurrentLoads: 3,

  // Query timeout in milliseconds
  queryTimeout: 30000,

  // Overpass API endpoint
  overpassEndpoint: 'https://overpass-api.de/api/interpreter',

  // Enable checking Overpass API status endpoint for real-time rate limit information
  statusCheckEnabled: true,

  // Overpass API status endpoint URL
  statusEndpoint: 'https://overpass-api.de/api/status',

  // How often to poll status endpoint in milliseconds (30 seconds)
  statusCheckIntervalMs: 30000,

  // How long to wait for status endpoint response before timing out (5 seconds)
  statusCheckTimeoutMs: 5000,

  // Cache status response for this long before fetching fresh data (30 seconds)
  statusCacheTtlMs: 30000,

  // Fallback throttle delay in milliseconds if status endpoint is unavailable
  fallbackThrottleMs: 200,
};

/**
 * Color palette for visual OSM features
 * Maps feature types to hex colors for rendering
 */
export const colorPalette = {
  buildings: {
    residential: '#c4b8a0',
    commercial: '#cc99ff',
    industrial: '#888888',
    office: '#cc99ff',
    retail: '#ff99cc',
    apartments: '#c4b8a0',
    detached: '#d4c4b0',
    house: '#d4c4b0',
    other: '#aaaaaa',
    default: '#c4b8a0',
  },
  roads: {
    motorway: '#e0a56e',
    trunk: '#ddb855',
    primary: '#ddb855',
    secondary: '#f7e6b8',
    tertiary: '#f7e6b8',
    residential: '#ffffff',
    service: '#ffffff',
    footway: '#cccccc',
    path: '#cccccc',
    other: '#ffffff',
    default: '#ffffff',
  },
  railways: {
    rail: '#888888',
    light_rail: '#666666',
    tram: '#666666',
    metro: '#ff0000',
    monorail: '#888888',
    other: '#888888',
    default: '#888888',
  },
  waters: {
    river: '#5588dd',
    stream: '#5588dd',
    canal: '#5588dd',
    lake: '#3366cc',
    pond: '#3366cc',
    reservoir: '#3366cc',
    wetland: '#88dd99',
    water: '#3366cc',
    other: '#3366cc',
    default: '#3366cc',
  },
  vegetation: {
    forest: '#2d8a2d',
    wood: '#3d9d3d',
    scrub: '#669966',
    grass: '#99cc99',
    grassland: '#99cc99',
    tree: '#4da64d',
    hedge: '#669966',
    other: '#99cc99',
    default: '#2d8a2d',
  },
  airport: '#ffff99',
};

export const debugConfig = {
  // Show visual axes helper for debugging coordinate system (red=X, green=Y, blue=Z)
  showAxisHelper: true,

  // Size of the axes helper visualization
  axesHelperSize: 500,

  // Use simple unlit mesh material for terrain instead of realistic phong shading
  useSimpleTerrainMaterial: true,
};
