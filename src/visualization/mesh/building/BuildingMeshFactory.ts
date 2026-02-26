import {
  Shape,
  Path,
  ExtrudeGeometry,
  MeshLambertMaterial,
  Mesh,
  type Object3D,
} from 'three';
import type { BuildingVisual, Polygon } from '../../../data/contextual/types';
import type { ElevationSampler } from '../util/ElevationSampler';
import { buildingHeightDefaults } from '../../../config';

/**
 * Creates 3D building meshes from BuildingVisual data using Three.js ExtrudeGeometry.
 * Builds geometry in local coordinates (relative to polygon centroid) to avoid
 * float32 precision issues at large Mercator coordinate values.
 */
export class BuildingMeshFactory {
  constructor(private readonly elevation: ElevationSampler) {}

  /**
   * Creates Object3D[] for all buildings in a tile.
   * @param buildings - Parsed building visuals
   * @param parentsWithParts - Set of building IDs that have child parts (skip their outlines)
   */
  create(
    buildings: BuildingVisual[],
    parentsWithParts: Set<string>
  ): Object3D[] {
    const meshes: Object3D[] = [];
    for (const building of buildings) {
      if (building.geometry.type !== 'Polygon') continue;
      // Skip parent outlines when child parts exist
      if (!building.isPart && parentsWithParts.has(building.id)) continue;

      const mesh = this.createBuildingMesh(building, building.geometry);
      if (mesh) meshes.push(mesh);
    }
    return meshes;
  }

  private createBuildingMesh(
    building: BuildingVisual,
    polygon: Polygon
  ): Mesh | null {
    try {
      const outerRing = polygon.coordinates[0];
      if (!outerRing || outerRing.length < 4) return null;

      // Compute height
      const height = this.resolveHeight(building);
      const minHeight =
        building.minHeight ??
        (building.minLevelCount ? building.minLevelCount * 3.0 : 0);
      const extrudeDepth = height - minHeight;
      if (extrudeDepth <= 0) return null;

      // Compute centroid for local coordinate space
      const centroid = this.computeCentroid(outerRing);

      // Build Three.js Shape from outer ring (local coords)
      const shape = new Shape();
      const first = outerRing[0]!;
      shape.moveTo(first[0] - centroid[0], first[1] - centroid[1]);
      for (let i = 1; i < outerRing.length; i++) {
        const pt = outerRing[i]!;
        shape.lineTo(pt[0] - centroid[0], pt[1] - centroid[1]);
      }

      // Add holes from inner rings
      for (let r = 1; r < polygon.coordinates.length; r++) {
        const innerRing = polygon.coordinates[r];
        if (!innerRing || innerRing.length < 4) continue;
        const hole = new Path();
        const hFirst = innerRing[0]!;
        hole.moveTo(hFirst[0] - centroid[0], hFirst[1] - centroid[1]);
        for (let i = 1; i < innerRing.length; i++) {
          const pt = innerRing[i]!;
          hole.lineTo(pt[0] - centroid[0], pt[1] - centroid[1]);
        }
        shape.holes.push(hole);
      }

      // Create ExtrudeGeometry
      const geometry = new ExtrudeGeometry(shape, {
        depth: extrudeDepth,
        bevelEnabled: false,
      });

      // ExtrudeGeometry extrudes along +Z; we need to rotate so extrusion goes along +Y (up)
      geometry.rotateX(-Math.PI / 2);

      // Materials: wall + roof cap
      const wallColor = building.color;
      const roofColor = building.roofColor ?? this.darkenColor(wallColor, 0.85);

      const wallMaterial = new MeshLambertMaterial({ color: wallColor });
      const roofMaterial = new MeshLambertMaterial({ color: roofColor });

      // ExtrudeGeometry groups: 0 = sides (walls), 1 = top cap (roof), 2 = bottom cap
      const mesh = new Mesh(geometry, [
        wallMaterial,
        roofMaterial,
        wallMaterial,
      ]);

      // Position at world coordinates
      const terrainElevation = this.elevation.sampleAt(
        centroid[0],
        centroid[1]
      );
      mesh.position.set(
        centroid[0],
        terrainElevation + minHeight,
        -centroid[1] // Mercator Y → Three.js -Z
      );

      return mesh;
    } catch {
      // Skip degenerate polygons (self-intersecting, etc.)
      return null;
    }
  }

  private resolveHeight(building: BuildingVisual): number {
    if (building.height !== undefined) return building.height;
    if (building.levelCount !== undefined)
      return building.levelCount * 3.0 + 1.0;
    return (
      buildingHeightDefaults[building.type] ??
      buildingHeightDefaults['other'] ??
      6
    );
  }

  private computeCentroid(ring: [number, number][]): [number, number] {
    let sumX = 0;
    let sumY = 0;
    // Exclude closing point (last === first)
    const count = ring.length - 1;
    for (let i = 0; i < count; i++) {
      sumX += ring[i]![0];
      sumY += ring[i]![1];
    }
    return [sumX / count, sumY / count];
  }

  private darkenColor(hex: string, factor: number): string {
    const c = parseInt(hex.replace('#', ''), 16);
    const r = Math.round(((c >> 16) & 0xff) * factor);
    const g = Math.round(((c >> 8) & 0xff) * factor);
    const b = Math.round((c & 0xff) * factor);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}
