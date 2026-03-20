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

  // Movement speed in meters per second
  movementSpeed: 15,

  // Mouse sensitivity for azimuth control (degrees per pixel of mouse movement)
  mouseSensitivity: 0.15,

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
  // far distance in meters (one tile length at zoom 15 ≈ 1,223m via Web Mercator calc)
  // Calculated: 2 * Math.PI * EARTH_RADIUS / Math.pow(2, zoomLevel)
  far: 2145,

  // Chase camera: distance behind the drone in meters
  chaseDistance: 20,

  // Chase camera: height above the drone in meters
  chaseHeight: 10,
};

export const sceneConfig = {
  sky: {
    // Sky color (matches fog for seamless blending)
    color: 0xbfd1e5,
  },

  fog: {
    // Fog near distance in meters (starts immediately after camera)
    near: 1,

    // Fog far distance in meters (one tile length at zoom 15 ≈ 1,223m via Web Mercator calc)
    // Calculated: 2 * Math.PI * EARTH_RADIUS / Math.pow(2, zoomLevel)
    far: 2145,

    // Fog color (sky blue)
    color: 0xbfd1e5,
  },
};

export interface TileDataConfig {
  zoomLevel: number;
  ringRadius: number;
  maxConcurrentLoads: number;
}

export const elevationConfig: TileDataConfig & {
  elevationEndpoint: string;
} = {
  // Web Mercator zoom level for terrain tiles (15 ≈ 25m resolution per pixel)
  zoomLevel: 15,

  // Number of tiles in each direction from center (1 = 3×3 grid of tiles)
  ringRadius: 1,

  // Maximum concurrent tile downloads (prevents network saturation)
  maxConcurrentLoads: 3,

  // AWS Terrain Tiles endpoint for elevation data (Terrarium format)
  elevationEndpoint: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium',
};

export const contextDataConfig: TileDataConfig & {
  queryTimeout: number;
  overtureVersion: string;
  overtureBaseUrl: string;
  overtureThemes: string[];
} = {
  // Web Mercator zoom level for context data tiles (zoom 15 via PMTiles overzoom from maxZoom 13/14)
  zoomLevel: 15,

  // Number of tiles in each direction from center (1 = 3×3 grid of tiles)
  ringRadius: 1,

  // Maximum concurrent PMTiles requests (no rate limiting)
  maxConcurrentLoads: 6,

  // Query timeout in milliseconds
  queryTimeout: 30000,

  // Overture Maps PMTiles configuration
  overtureVersion: '2026-02-18.0',
  overtureBaseUrl: 'https://tiles.overturemaps.org',
  overtureThemes: ['buildings', 'transportation', 'base'],
};

/**
 * Building wall colors per building type (aerial/oblique view palette)
 */
export const colorPalette = {
  buildings: {
    residential: '#d4cdc0',
    commercial: '#c8c0b8',
    industrial: '#a8a898',
    office: '#b8c4cc',
    retail: '#c8bdb0',
    apartments: '#c8c4b8',
    detached: '#d4c8b8',
    house: '#d4c8b8',
    terrace: '#d0cab8',
    warehouse: '#a8a090',
    other: '#d0ccbc',
    default: '#d0ccbc',
  },
};

/**
 * Default building heights in meters per building type (used when no height/levels tag is present)
 */
export const buildingHeightDefaults: Record<string, number> = {
  house: 6,
  detached: 6,
  residential: 6,
  terrace: 6,
  apartments: 12,
  office: 15,
  commercial: 6,
  retail: 4,
  industrial: 9,
  warehouse: 8,
  school: 6,
  hospital: 10,
  church: 12,
  cathedral: 20,
  garage: 3,
  shed: 2.5,
  other: 6,
};

/**
 * Wall color overrides per building:material tag
 */
export const buildingMaterialColors: Record<string, string> = {
  brick: '#c87060',
  concrete: '#c8c4b8',
  glass: '#a8c8d8',
  stone: '#b8b0a0',
  wood: '#c8a878',
  metal: '#888888',
  plaster: '#d8d4cc',
  render: '#d8d4cc',
  cement_block: '#b8b4a8',
};

/**
 * Roof color overrides per roof:material tag
 */
export const roofMaterialColors: Record<string, string> = {
  roof_tiles: '#b06040',
  tiles: '#b06040',
  slate: '#708090',
  metal: '#9090a0',
  zinc: '#9090a0',
  tin: '#9090a0',
  concrete: '#909090',
  copper: '#70a888',
  grass: '#7aaa50',
  thatch: '#c0a050',
  asphalt: '#707070',
  solar_panels: '#304060',
  eternit: '#909090',
  tar_paper: '#606060',
  glass: '#a8c8d8',
};

/**
 * Default roof colors when no roof:colour or roof:material is tagged
 */
export const roofColorDefaults = {
  flat: '#a0a090',
  pitched: '#906050',
};

/**
 * Man-made structure shape, radius, height, and color defaults per man_made/power type
 */
export const structureDefaults: Record<
  string,
  { shape: string; radius: number; height: number; color: string }
> = {
  tower: { shape: 'cylinder', radius: 3, height: 20, color: '#a0a098' },
  chimney: {
    shape: 'tapered_cylinder',
    radius: 2,
    height: 40,
    color: '#888880',
  },
  mast: { shape: 'tapered_cylinder', radius: 1, height: 30, color: '#b0b0b0' },
  communications_tower: {
    shape: 'cylinder',
    radius: 4,
    height: 50,
    color: '#a0a098',
  },
  water_tower: {
    shape: 'water_tower',
    radius: 5,
    height: 20,
    color: '#a8a8b0',
  },
  silo: { shape: 'cylinder', radius: 4, height: 15, color: '#d0c8b0' },
  storage_tank: { shape: 'cylinder', radius: 8, height: 10, color: '#c0c0c0' },
  lighthouse: {
    shape: 'tapered_cylinder',
    radius: 3,
    height: 25,
    color: '#f0f0e8',
  },
  crane: { shape: 'crane', radius: 1, height: 40, color: '#f0b800' },
  power_tower: { shape: 'box', radius: 1.5, height: 25, color: '#c0c0c8' },
  power_pole: { shape: 'cylinder', radius: 0.2, height: 10, color: '#a08060' },
  aerialway_pylon: { shape: 'box', radius: 1, height: 12, color: '#b0b0b8' },
};

/**
 * Barrier default width, height, and color per barrier type
 */
export const barrierDefaults: Record<
  string,
  { width: number; height: number; color: string }
> = {
  wall: { width: 0.3, height: 2.0, color: '#c0b8b0' },
  city_wall: { width: 2.0, height: 6.0, color: '#c8c0b0' },
  retaining_wall: { width: 0.5, height: 1.5, color: '#a8a098' },
  hedge: { width: 1.0, height: 1.5, color: '#4a7030' },
};

/**
 * Barrier material color overrides (same palette as building materials)
 */
export const barrierMaterialColors: Record<string, string> = {
  ...buildingMaterialColors,
};

/**
 * Vegetation mesh generation config per vegetation category
 */
export const vegetationMeshConfig = {
  forest: {
    densityPer100m2: 1.0,
    trunkHeightMin: 8,
    trunkHeightMax: 15,
    crownRadiusMin: 2,
    crownRadiusMax: 5,
  },
  scrub: {
    densityPer100m2: 4.0,
    trunkHeightMin: 0,
    trunkHeightMax: 0,
    crownRadiusMin: 1,
    crownRadiusMax: 2.5,
  },
  orchard: {
    spacingX: 5,
    spacingY: 4,
    trunkHeightMin: 3,
    trunkHeightMax: 6,
    crownRadiusMin: 1.5,
    crownRadiusMax: 2.5,
  },
  vineyard: {
    spacingX: 2,
    spacingY: 1,
    trunkHeightMin: 0,
    trunkHeightMax: 0,
    crownRadiusMin: 0.4,
    crownRadiusMax: 0.8,
  },
  treeRow: {
    intervalMeters: 8,
    trunkHeightMin: 6,
    trunkHeightMax: 12,
    crownRadiusMin: 1.5,
    crownRadiusMax: 3,
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
    grass: '#90b860',
    park: '#90b860',
    garden: '#90b860',
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
  // Ground canvas size in pixels for rendering contextual features (roads, water, landuse, etc.)
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
