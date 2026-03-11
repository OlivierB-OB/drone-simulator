# Glossary

Central reference for all technical terms used throughout the drone simulator documentation.

## Terms (A-Z)

**Aeroway** - OSM feature for airport infrastructure (runways, taxiways, helipads).

**Azimuth** - Compass bearing in degrees (0°=North, clockwise positive). Used to define drone heading and camera orientation.

**Bilinear Interpolation** - Smoothing technique using 4 nearest pixel values to compute intermediate elevation. Provides sub-meter precision when sampling elevations between tile pixels.

**Bounding Box (bbox)** - Rectangle defined by min/max latitude and longitude; used to scope Overpass queries to tile area.

**Canvas Rendering Context2D** - HTML5 2D drawing API providing methods like `fillRect()`, `stroke()`, `fill()`, `arc()`, etc. Used to draw OSM features on canvas textures.

**Canvas Texture** - HTML5 Canvas rendered to an image, then converted to a WebGL texture. OSM features (roads, buildings, water) are rasterized to canvas, then mapped onto terrain meshes.

**Center Tile** - Tile containing drone's current position. Starting point for concentric ring expansion.

**Centroid** - Geometric center of a polygon. Used for point placement of features like buildings or vegetation.

**Conformal Projection** - Map projection that preserves angles locally. Mercator is conformal, which is why course/azimuth values remain meaningful.

**Concurrent Loads** - Maximum simultaneous network requests for data tiles (e.g., elevation or context tiles). Limited to reduce bandwidth/server load.

**Context Data Tile** - Parsed OSM data for a single tile: buildings, roads, water, vegetation, landuse, aeroways, structures, barriers. One tile at zoom 15 covers ~327 m × 327 m.

**Coordinate Transformation** - Mapping geographic Mercator coordinates to Three.js world coordinates, or vice versa. Critical for alignment of drone, camera, terrain, and objects.

**Elevation Tile** - 256×256 pixel PNG in Terrarium format covering ~327 m × 327 m area at zoom 15. Each pixel encodes elevation via Terrarium RGB formula.

**Even-Odd Fill Rule** - Polygon fill rule: a point is filled if a ray from that point crosses an odd number of boundaries. Correctly handles holes in polygons without special processing.

**ExtrudeGeometry** - Three.js geometry that extrudes a 2D shape along the Z axis. Used for buildings and roofs.

**Feature Classification** - Process of examining OSM tags and determining which visual type (BuildingVisual, RoadVisual, etc.) to create.

**Graceful Degradation** - System remains functional when cache/network fails. Terrain renders without feature overlays if context tiles unavailable.

**Index Buffer** - Array of vertex indices defining triangle faces. Avoids vertex duplication and reduces memory usage.

**IndexedDB** - Browser's persistent key-value storage (survives page reload). Used for 24-hour cache of context data and elevation tiles.

**Instanced Mesh** - Three.js optimization drawing single geometry multiple times with different transforms. Reduces draw calls and memory for repeated objects (trees, poles).

**Landuse** - OSM classification of ground area (farmland, park, residential, industrial, forest, etc.). Combined with natural/water tags to categorize terrain features.

**LineCap** - How line endpoints render: 'round', 'butt', or 'square'. Affects road and railway appearance at endpoints.

**LineDash** - Dash pattern array: `[2, 2]` = 2 pixels on, 2 pixels off. Used for steps/stairs roads and all railways in canvas rendering.

**LineJoin** - How line segments join: 'round', 'bevel', or 'miter'. Affects corner sharpness in roads and railways.

**LineWidth** - Stroke width in pixels when rendering to canvas. Calculated from feature width in Mercator meters × scale factor.

**Manager** - Component that controls data loading, caching, and lifecycle. Typically maintains a ring of tiles and emits events when tiles are added/removed. Examples: ElevationDataManager, ContextDataManager.

**Mercator Bounds** - Rectangular region in Web Mercator projection: `{minX, maxX, minY, maxY}` in meters. Defines tile geographic extent.

**Mercator Projection** - Web mapping standard used by OSM, Google Maps, etc. (EPSG:3857). Maps latitude/longitude to rectangular coordinates. Maintains angles but distorts area near poles.

**MeshPhongMaterial** - Three.js material supporting Phong reflection model (combines ambient, diffuse, specular lighting). Used for realistic shading of terrain and objects.

**Mipmapping** - Pre-computed texture pyramies for efficient filtering at different scales/distances. Applied automatically by Three.js for better performance.

**Natural** - OSM tag for natural features (forests, water, grassland). Combined with landuse tags to categorize terrain.

**OpenStreetMap (OSM)** - Collaborative global map database. Features include roads, buildings, water, vegetation, railways, etc. Source for contextual features in simulator.

**Oriented Bounding Box (OBB)** - Minimal rectangle aligned with polygon axes rather than axis-aligned. Used for accurate bounds in building placement.

**Overpass API** - Free, open-source query service for OpenStreetMap data. Returns OverpassJSON format with nodes, ways, relations, and tags.

**OverpassJSON** - JSON format for Overpass API responses. Contains nodes, ways, relations with tags and geometry coordinates.

**OverpassQL** - Query language for Overpass API. Supports complex spatial and tag-based queries.

**Painter's Algorithm** - Drawing technique rendering back-to-front (furthest to nearest) to achieve correct layering without explicit Z-buffering. Used for canvas feature layering.

**Parser** - Component that decodes raw data (PNG pixels, GeoJSON features) into structured data (elevation grids, feature objects).

**Rasterization** - Converting vector features (lines, polygons) to raster (pixel) format on a canvas. Opposite of vectorization.

**Ring** - Set of tiles arranged in concentric square pattern around drone center. Ring 1 = 3×3 grid, Ring 2 = 5×5, etc. (formula: (2r+1)² tiles).

**Ring-Based Loading** - Strategy where tiles load in rings around the drone position. Only tiles within active ring maintained in memory. Optimizes network I/O and memory usage.

**Ring Radius** - Distance in tiles from center to edge of ring. Radius 1 = 3×3 grid, Radius 2 = 5×5 grid, etc.

**Ring System** - 3×3 or larger grid of tiles loaded around drone position. Basis for spatial data management in simulator.

**Strategy Pattern** - Design pattern using separate/interchangeable algorithms. Examples: classifyBuilding, classifyRoad (feature classification); different roof shapes for buildings.

**Sub-Meter Precision** - Blue channel in Terrarium format enables ~4 mm elevation accuracy (B/256 meter subdivision).

**Tag** - OSM key-value pair describing feature properties. Examples: `building=residential`, `height=10`, `highway=primary`.

**Tapered Cylinder** - Cylinder with different top and bottom radii. Used for chimneys and similar building features.

**Terrarium** - Mapbox elevation tile service. Provides global elevation as PNG tiles with Terrarium RGB encoding formula.

**Terrarium Format** - PNG encoding scheme: `(R × 256 + G + B/256) - 32768 = elevation in meters`. Used by Mapbox elevation service.

**Tile** - Rectangular region in Web Mercator grid (256×256 pixels per tile standard). Identified by z:x:y coordinates.

**Tile Boundary** - Edge between adjacent tiles. Must be seamlessly connected in 3D visualization.

**Tile Key** - Unique identifier for a tile: `"z:x:y"` format (e.g., `"15:16807:11239"`). Used for caching and map lookups.

**Tile Size** - Standard tile dimensions: 256×256 pixels per tile. This is Web Mercator convention.

**TTL (Time-To-Live)** - Expiry duration for cached data. Context tiles cached 24 hours before re-fetch.

**UV Coordinates** - 2D texture coordinates (u, v) mapped to 3D vertices. Range [0,1] for each tile. Critical for texture alignment across tile boundaries.

**Vertex Normal** - Direction perpendicular to mesh surface, computed per-vertex. Essential for realistic lighting calculations.

**Way** - OSM feature representing linestring or polygon (roads, buildings, water, etc.).

**Web Mercator** - Standard cylindrical map projection for web maps (EPSG:3857). X increases eastward, Y increases northward. Formula: longitude → X directly, latitude → Y nonlinearly.

**Winding Order** - Polygon vertex order (clockwise vs. counterclockwise). Affects face normals and which side is "front" for rendering.

**Z-Negation** - Critical transformation: Mercator Y (northward positive) maps to -Z in Three.js (camera looks along -Z axis). Applied everywhere: drone position, terrain meshes, canvas coordinates.

**Z/X/Y Coordinates** - Standard tile addressing scheme. Z = zoom level (higher = more tiles, finer detail), X/Y = position in grid at that zoom.

**Zoom Level** - Web Mercator parameter in tile addressing. Higher zoom = smaller geographic area per tile, finer detail. Zoom 15 ≈ 327 m per tile at equator.
