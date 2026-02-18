import { BufferGeometry } from 'three';
import type { TileKey } from '../../terrain/geometry/types';
import type { MercatorBounds } from '../../../data/elevation/types';

/**
 * Represents a collection of geometries created from a single context data tile.
 * Holds references to Three.js geometries (TubeGeometry, ShapeGeometry) and tile metadata.
 * Each geometry is associated with a feature type for material assignment.
 */
export interface ContextGeometry {
  type: 'building' | 'road' | 'railway' | 'water' | 'vegetation' | 'airport';
  geometry: BufferGeometry;
  color: string; // Hex color from feature
  id: string; // Feature ID
}

export class ContextGeometryObject {
  private readonly geometries: ContextGeometry[];
  private readonly tileKey: TileKey;
  private readonly mercatorBounds: MercatorBounds;

  constructor(
    tileKey: TileKey,
    geometries: ContextGeometry[],
    mercatorBounds: MercatorBounds
  ) {
    this.tileKey = tileKey;
    this.geometries = geometries;
    this.mercatorBounds = mercatorBounds;
  }

  /**
   * Get the tile identifier (format: "z:x:y")
   */
  getTileKey(): TileKey {
    return this.tileKey;
  }

  /**
   * Get all geometries in this tile
   */
  getGeometries(): ContextGeometry[] {
    return this.geometries;
  }

  /**
   * Get the Mercator bounds of this tile
   */
  getMercatorBounds(): MercatorBounds {
    return this.mercatorBounds;
  }

  /**
   * Clean up all geometry resources
   */
  dispose(): void {
    for (const contextGeometry of this.geometries) {
      contextGeometry.geometry.dispose();
    }
  }
}
