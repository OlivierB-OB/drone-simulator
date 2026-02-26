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

  // Movement speed in Mercator coordinate units per second
  // (Not realistic m/s; game speed allows faster exploration)
  // Realistic drone: 10-15 m/s. Mercator units at zoom 15: ~300 units/meter
  // So 1200 units/sec ≈ 4 m/s in real world, but appears fast in viewport
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

  // AWS Terrain Tiles endpoint for elevation data (Terrarium format)
  elevationEndpoint: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium',
};

export const contextDataConfig = {
  // Web Mercator zoom level for context data tiles (14-15 balances detail vs. request size)
  zoomLevel: 15,

  // Number of tiles in each direction from center (1 = 3×3 grid of tiles)
  ringRadius: 1,

  // Maximum concurrent Overpass API requests
  maxConcurrentLoads: 3,

  // Query timeout in milliseconds
  queryTimeout: 30000,

  // Overpass API endpoint
  overpassEndpoint: 'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
};

/**
 * Building colors (still used by parser for 3D building rendering)
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
};

/**
 * Ground texture colors — spec-accurate aerial palette for canvas rendering
 */
export const groundColors = {
  default: '#d8c8a8',
  landuse: {
    grassland: '#90b860',
    meadow: '#90b860',
    park: '#90b860',
    recreation_ground: '#90b860',
    plant_nursery: '#88b060',
    farmland: '#c0cc70',
    orchard: '#98c068',
    vineyard: '#88a048',
    allotments: '#88aa50',
    cemetery: '#b0c8a8',
    construction: '#c0aa88',
    residential: '#d8d4cc',
    commercial: '#d8d4cc',
    retail: '#d8d4cc',
    industrial: '#d8d4cc',
    military: '#d8d4cc',
    sand: '#e8d89a',
    beach: '#e8d89a',
    dune: '#e8d89a',
    bare_rock: '#b8a888',
    scree: '#c0b090',
    mud: '#a89870',
    glacier: '#e8f0ff',
  },
  water: {
    body: '#3a6ab0',
    line: '#3a6ab0',
    wetland: '#5a9a6a',
    dam: '#888880',
    weir: '#888880',
  },
  vegetation: {
    wood: '#3a7a30',
    forest: '#3a7a30',
    scrub: '#5a8a40',
    heath: '#8a7a50',
    fell: '#a0a070',
    tundra: '#a0a070',
    default: '#3a7a30',
  },
  aeroways: {
    aerodrome: '#d8d4c0',
    runway: '#888880',
    taxiway: '#999990',
    taxilane: '#999990',
    apron: '#aaaaaa',
    helipad: '#ccccaa',
  },
};

/**
 * Road rendering spec: real-world width in meters and base color per highway type
 */
export const roadSpec: Record<string, { widthMeters: number; color: string }> =
  {
    // Sealed major roads — asphalt gray (#777060)
    motorway: { widthMeters: 25, color: '#777060' },
    trunk: { widthMeters: 20, color: '#777060' },
    motorway_link: { widthMeters: 10, color: '#777060' },
    trunk_link: { widthMeters: 10, color: '#777060' },
    primary: { widthMeters: 15, color: '#777060' },
    primary_link: { widthMeters: 8, color: '#777060' },
    secondary: { widthMeters: 12, color: '#777060' },
    secondary_link: { widthMeters: 6, color: '#777060' },
    tertiary: { widthMeters: 8, color: '#777060' },
    tertiary_link: { widthMeters: 5, color: '#777060' },
    residential: { widthMeters: 7, color: '#777060' },
    unclassified: { widthMeters: 7, color: '#777060' },
    service: { widthMeters: 4, color: '#777060' },
    living_street: { widthMeters: 5, color: '#777060' },
    // Light paving / pedestrian (#ccccbb)
    pedestrian: { widthMeters: 6, color: '#ccccbb' },
    footway: { widthMeters: 2, color: '#ccccbb' },
    path: { widthMeters: 2, color: '#ccccbb' },
    cycleway: { widthMeters: 2, color: '#ccccbb' },
    steps: { widthMeters: 2, color: '#ccccbb' },
    // Unpaved
    track: { widthMeters: 3, color: '#c4a882' },
    bridleway: { widthMeters: 3, color: '#c8b870' },
    // Default fallback
    default: { widthMeters: 7, color: '#777060' },
  };

/**
 * Road surface color overrides (takes precedence over highway-type color)
 */
export const surfaceColors: Record<string, string> = {
  // Asphalt
  asphalt: '#777060',
  // Light paving
  concrete: '#ccccbb',
  'concrete:plates': '#ccccbb',
  'concrete:lanes': '#ccccbb',
  paving_stones: '#ccccbb',
  'paving_stones:lanes': '#ccccbb',
  clay: '#ccccbb',
  tartan: '#ccccbb',
  artificial_turf: '#ccccbb',
  acrylic: '#ccccbb',
  rubber: '#ccccbb',
  carpet: '#ccccbb',
  plastic: '#ccccbb',
  // Stone
  sett: '#b0a090',
  unhewn_cobblestone: '#b0a090',
  // Brick
  bricks: '#c87060',
  // Metal
  metal: '#909090',
  metal_grid: '#909090',
  // Wood / natural material
  wood: '#b08860',
  stepping_stones: '#b08860',
  woodchips: '#b09870',
  // Unpaved / gravel
  compacted: '#c4a882',
  fine_gravel: '#c4a882',
  gravel: '#c4a882',
  pebblestone: '#c4a882',
  shells: '#c4a882',
  // Dirt
  dirt: '#a88060',
  mud: '#a88060',
  // Natural surfaces
  grass: '#90b860',
  sand: '#e8d89a',
  rock: '#b8a888',
  snow: '#e8f0ff',
  ice: '#e8f0ff',
};

/**
 * Railway rendering spec: real-world width in meters, dash pattern, and color per railway type
 */
export const railwaySpec: Record<
  string,
  { widthMeters: number; dash: number[]; color: string }
> = {
  rail: { widthMeters: 4, dash: [5, 3], color: '#888888' },
  narrow_gauge: { widthMeters: 3, dash: [5, 3], color: '#888888' },
  light_rail: { widthMeters: 3, dash: [4, 3], color: '#888888' },
  tram: { widthMeters: 2, dash: [4, 3], color: '#888888' },
  metro: { widthMeters: 4, dash: [4, 3], color: '#888888' },
  monorail: { widthMeters: 3, dash: [4, 3], color: '#999999' },
  funicular: { widthMeters: 3, dash: [4, 3], color: '#888888' },
  disused: { widthMeters: 2, dash: [2, 4], color: '#aaaaaa' },
  abandoned: { widthMeters: 2, dash: [2, 4], color: '#aaaaaa' },
  default: { widthMeters: 3, dash: [4, 3], color: '#888888' },
};

/**
 * Waterway line widths in meters per waterway type
 */
export const waterwayWidthsMeters: Record<string, number> = {
  river: 20,
  canal: 15,
  stream: 5,
  tidal_channel: 10,
  dam: 10,
  weir: 5,
  ditch: 2,
  drain: 2,
  default: 3,
};

export const textureConfig = {
  // Ground canvas size in pixels for rendering OSM features (roads, water, landuse, etc.)
  // Higher values provide more detail but increase canvas rendering time
  groundCanvasSize: 2048,
};

export const debugConfig = {
  // Show visual axes helper for debugging coordinate system (red=X, green=Y, blue=Z)
  showAxisHelper: true,

  // Size of the axes helper visualization
  axesHelperSize: 500,

  // Use simple unlit mesh material for terrain instead of realistic phong shading
  useSimpleTerrainMaterial: false,
};
