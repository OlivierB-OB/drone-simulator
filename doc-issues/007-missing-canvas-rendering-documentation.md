# Issue 007: Missing Canvas Rendering Documentation

## Severity
**MEDIUM** - Incomplete coverage of a significant visualization subsystem

## Summary
The canvas-based terrain rendering system (used for drawing contextual features like buildings, roads, landmarks) is mentioned across multiple documentation files but lacks a comprehensive, dedicated section explaining the rendering pipeline, layer ordering, coordinate transformation, and feature drawing algorithms.

## Current State

### Scattered References
- `doc/visualization/ground-surface.md` (lines 193-225): Describes painter's algorithm and feature colors
- `doc/data/contextual.md` (lines 616-635): Describes canvas rendering strategy
- `doc/visualization/objects.md`: Related object rendering patterns
- No dedicated comprehensive reference document

### What's Documented
- Feature color assignments (different colors for building types, landmarks, etc.)
- High-level painter's algorithm approach
- Rendering order/layering strategy
- Canvas coordinate system basics

### What's Missing
- **Canvas rendering pipeline**: Complete flow from tile data → feature list → canvas drawing
- **Layer ordering details**: Why specific layers drawn in specific order
- **Coordinate transformation**: How contextual data coordinates map to canvas pixels
- **Feature drawing algorithms**: How polygons, roads, landmarks are actually drawn
- **Performance optimizations**: Caching, batch rendering, culling strategies
- **Edge cases**: Polygon holes, self-intersecting boundaries, very large features
- **Integration with tile system**: How canvas rendering coordinates align with tile boundaries
- **Memory management**: Canvas lifecycle, when/how canvases are recycled

## Root Cause
Canvas rendering was likely implemented later in the project. Knowledge exists scattered in two separate docs but wasn't consolidated into a single reference.

## Related Code Components
- `TerrainCanvasRenderer` (mentioned but not documented)
- `TerrainTextureFactory` (creates textures from canvases)
- Canvas-based feature drawing functions
- Contextual data tile processing

## Required Action

### Option 1: Create New Dedicated File (Recommended)
**Create**: `doc/visualization/canvas-rendering.md` (~400-500 lines)

**Content structure**:
1. **Overview**: Canvas rendering in the visualization pipeline
2. **Architecture diagram**: Data flow from tile fetch → features → canvas → texture
3. **Rendering pipeline** (step-by-step):
   - Feature extraction from contextual tiles
   - Layer organization (roads, buildings, landmarks, water, etc.)
   - Canvas creation and dimension calculation
   - Feature drawing sequence (painter's algorithm)
   - Texture generation from canvas
4. **Layer ordering system**: Why each layer order chosen, impact on visual result
5. **Coordinate systems**:
   - Mercator coordinates (input from contextual tiles)
   - Canvas pixel coordinates (drawing output)
   - Transformation math and edge alignment
6. **Feature drawing algorithms**:
   - Polygons (buildings, water, regions)
   - Lines (roads, boundaries)
   - Points (landmarks, POIs)
   - Coloring strategy (type-based, elevation-based, etc.)
7. **Performance characteristics**:
   - Canvas size vs quality trade-off
   - Redraw frequency (when tiles load)
   - Memory usage per canvas
   - Culling/optimization opportunities
8. **Edge cases**:
   - Tile boundary handling (seamless boundaries)
   - Polygon holes and complex shapes
   - Self-intersecting boundaries
   - Very large features spanning multiple tiles
9. **Integration with other systems**:
   - Relationship to TerrainTextureFactory
   - How canvas output feeds into mesh system
   - Coordinate consistency with 3D objects
10. **Configuration**: Canvas size, color schemes, layer ordering parameters

### Option 2: Expand Existing Document
**If preferred**: Add comprehensive "Canvas Rendering System" section to:
- `doc/visualization/ground-surface.md` (after current painter's algorithm section)
- OR `doc/data/contextual.md` (after rendering strategy section)

**Advantage**: Keeps visualization content together
**Disadvantage**: Makes file larger; may dilute focus

## Example Structure for New File

```markdown
# Canvas Rendering System

## Overview

The drone simulator uses HTML5 Canvas to render contextual features
(buildings, roads, landmarks) onto the terrain surface.

## Architecture

[Data flow diagram: Tiles → Features → Canvas → Texture]

## Rendering Pipeline

### Step 1: Feature Extraction
[Description of how features are extracted from contextual tiles]

### Step 2: Layer Organization
[Description of how features are organized by type and order]

### Step 3: Canvas Preparation
[Canvas size calculation, coordinate system setup]

### Step 4: Painter's Algorithm
[Detail how features are drawn in specific order]

### Step 5: Texture Generation
[How canvas becomes a Three.js texture]

## Coordinate System Transformation

[Math and code showing Mercator → Canvas pixel transformation]

## Feature Drawing Algorithms

### Polygons
[How building outlines, water bodies are drawn]

### Lines
[How roads, boundaries are drawn]

### Points
[How landmarks, POIs are drawn]

## Performance Optimization

[Canvas size, redraw frequency, culling strategies]

## Edge Cases

[Handling tile boundaries, complex shapes, etc.]

## Integration Points

[How canvas system connects to mesh factories and texture system]
```

## Verification

After implementation:
1. New/expanded section is self-contained and comprehensible
2. Includes references to actual canvas rendering code
3. Diagrams show data flow clearly
4. Algorithm descriptions align with actual implementation
5. Cross-references work (links to TerrainCanvasRenderer, etc.)
6. Covers integration with TerrainTextureFactory

## Impact
- Centralizes knowledge about canvas rendering pipeline
- Helps new developers understand feature rendering approach
- Documents algorithms and coordinate transformations
- Provides reference for performance optimization discussions
- Clarifies relationship between canvas rendering and 3D mesh system
