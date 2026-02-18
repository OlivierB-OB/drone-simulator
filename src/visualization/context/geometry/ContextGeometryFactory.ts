import { BufferGeometry, TubeGeometry, ShapeGeometry, Vector3, Shape } from 'three';
import type {
  LineString,
  Polygon,
  RoadVisual,
  RailwayVisual,
  WaterVisual,
} from '../../../data/contextual/types';
import type { MercatorBounds } from '../../../data/elevation/types';

/**
 * Factory for creating Three.js geometries from OSM context features.
 * Converts LineString → TubeGeometry, Polygon → ShapeGeometry
 * Handles Mercator coordinate conversion (X → X, Y → -Z, tile centering)
 */
export class ContextGeometryFactory {
  /**
   * Create geometry from a LineString feature (roads, railways, water)
   * Uses TubeGeometry with dynamic radius based on feature type
   */
  createLineStringGeometry(
    lineString: LineString,
    bounds: MercatorBounds,
    feature: RoadVisual | RailwayVisual | WaterVisual
  ): BufferGeometry {
    const radius = this.getLineStringRadius(feature);
    return this.createTubeGeometry(lineString, radius, bounds);
  }

  /**
   * Create geometry from a Polygon feature (buildings, water areas, vegetation)
   * Uses ShapeGeometry
   */
  createPolygonGeometry(
    polygon: Polygon,
    bounds: MercatorBounds
  ): BufferGeometry {
    return this.createShapeGeometry(polygon, bounds);
  }

  /**
   * Determine the radius for a line feature based on type and attributes
   * Priority: width tag > lanes tag > type category
   */
  private getLineStringRadius(
    feature: RoadVisual | RailwayVisual | WaterVisual
  ): number {
    // For roads, use width category if available
    if ('widthCategory' in feature) {
      return this.getRoadRadiusFromCategory(feature.widthCategory);
    }

    // For railways, default to 0.5m
    if ('trackCount' in feature) {
      return 0.5;
    }

    // For water, use 0.5m
    return 0.5;
  }

  /**
   * Get radius in meters for road width category
   */
  private getRoadRadiusFromCategory(
    category: 'large' | 'medium' | 'small'
  ): number {
    switch (category) {
      case 'large':
        return 2.0; // motorway, trunk, primary
      case 'medium':
        return 1.0; // secondary, tertiary
      case 'small':
        return 0.5; // residential, service, etc.
    }
  }

  /**
   * Create a TubeGeometry from a LineString
   * Converts Mercator coordinates to Three.js coordinates
   * Tile-centers coordinates relative to tile bounds
   */
  private createTubeGeometry(
    lineString: LineString,
    radius: number,
    bounds: MercatorBounds
  ): BufferGeometry {
    // Convert coordinates to Three.js coordinate system
    // Tile-center the coordinates (subtract tile center)
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const points = lineString.coordinates.map(([mercatorX, mercatorY]) => {
      const x = mercatorX - centerX;
      const z = -(mercatorY - centerY); // Negate Y → Z (Mercator Y northward = -Z northward)
      const y = 0; // No elevation in context features
      return new Vector3(x, y, z);
    });

    // TubeGeometry requires at least 2 points
    if (points.length < 2) {
      return new BufferGeometry(); // Return empty geometry for invalid data
    }

    // Create tube with radial segments = 8 (balance between quality and performance)
    const tubeGeometry = new TubeGeometry(points, 8, radius, 8, false);
    return tubeGeometry;
  }

  /**
   * Create a ShapeGeometry from a Polygon
   * Converts exterior ring to Shape, optionally handles holes
   */
  private createShapeGeometry(
    polygon: Polygon,
    bounds: MercatorBounds
  ): BufferGeometry {
    if (polygon.coordinates.length === 0) {
      return new BufferGeometry(); // Empty polygon
    }

    // Get tile center for coordinate conversion
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    // Convert exterior ring to Shape
    const exteriorRing = polygon.coordinates[0];
    if (exteriorRing.length < 3) {
      return new BufferGeometry(); // Invalid ring
    }

    const shape = new Shape();

    // Start from first point
    const [firstX, firstY] = exteriorRing[0];
    shape.moveTo(firstX - centerX, -(firstY - centerY));

    // Draw to remaining points
    for (let i = 1; i < exteriorRing.length; i++) {
      const [x, y] = exteriorRing[i];
      shape.lineTo(x - centerX, -(y - centerY));
    }

    // Handle holes (inner rings)
    for (let h = 1; h < polygon.coordinates.length; h++) {
      const hole = polygon.coordinates[h];
      if (hole.length < 3) continue;

      const holePath = new Shape();
      const [hFirstX, hFirstY] = hole[0];
      holePath.moveTo(hFirstX - centerX, -(hFirstY - centerY));

      for (let i = 1; i < hole.length; i++) {
        const [x, y] = hole[i];
        holePath.lineTo(x - centerX, -(y - centerY));
      }

      shape.holes.push(holePath);
    }

    // Create ShapeGeometry with minimal height (2D in 3D space)
    const shapeGeometry = new ShapeGeometry(shape, 32); // 32 segments for shape subdivision
    return shapeGeometry;
  }
}
