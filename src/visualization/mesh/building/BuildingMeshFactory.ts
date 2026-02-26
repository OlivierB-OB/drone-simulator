import {
  Shape,
  Path,
  ExtrudeGeometry,
  MeshLambertMaterial,
  Mesh,
  Group,
  type Object3D,
} from 'three';
import type { BuildingVisual, Polygon } from '../../../data/contextual/types';
import type { ElevationSampler } from '../util/ElevationSampler';
import { buildingHeightDefaults, roofColorDefaults } from '../../../config';
import {
  RoofGeometryFactory,
  computeOBB,
  resolveRidgeAngle,
} from './RoofGeometryFactory';

const PITCHED_SHAPES = new Set([
  'gabled',
  'hipped',
  'pyramidal',
  'dome',
  'onion',
  'cone',
  'skillion',
  'half-hipped',
  'saltbox',
  'gambrel',
  'mansard',
]);

/**
 * Creates 3D building meshes from BuildingVisual data using Three.js ExtrudeGeometry.
 * Builds geometry in local coordinates (relative to polygon centroid) to avoid
 * float32 precision issues at large Mercator coordinate values.
 *
 * For non-flat roof shapes, a separate roof geometry is created by RoofGeometryFactory
 * and combined with the wall extrusion in a Group.
 */
export class BuildingMeshFactory {
  private readonly roofFactory = new RoofGeometryFactory();

  constructor(private readonly elevation: ElevationSampler) {}

  /**
   * Creates Object3D[] for all buildings in a tile.
   * @param buildings - Parsed building visuals (hasParts flag set by the data parser)
   */
  create(buildings: BuildingVisual[]): Object3D[] {
    const meshes: Object3D[] = [];
    for (const building of buildings) {
      if (building.geometry.type !== 'Polygon') continue;
      // Skip parent outlines when child parts exist (detected spatially during parsing)
      if (!building.isPart && building.hasParts) continue;

      const mesh = this.createBuildingMesh(building, building.geometry);
      if (mesh) meshes.push(mesh);
    }
    return meshes;
  }

  private createBuildingMesh(
    building: BuildingVisual,
    polygon: Polygon
  ): Object3D | null {
    try {
      const outerRing = polygon.coordinates[0];
      if (!outerRing || outerRing.length < 4) return null;

      // Compute centroid for local coordinate space
      const centroid = this.computeCentroid(outerRing);

      // Build local ring (relative to centroid)
      const localRing: [number, number][] = outerRing.map((pt) => [
        pt[0] - centroid[0],
        pt[1] - centroid[1],
      ]);

      // Resolve heights
      const totalHeight = this.resolveHeight(building);
      const minHeight =
        building.minHeight ??
        (building.minLevelCount ? building.minLevelCount * 3.0 : 0);

      const roofShape = building.roofShape ?? 'flat';
      const isPitched = PITCHED_SHAPES.has(roofShape);

      // Split total height into wall + roof
      let roofHeight = 0;
      if (isPitched) {
        roofHeight = building.roofHeight ?? this.defaultRoofHeight(localRing);
        // Ensure wall height is at least 1m
        roofHeight = Math.min(roofHeight, totalHeight - minHeight - 1);
        if (roofHeight < 0) roofHeight = 0;
      }
      const wallHeight = totalHeight - roofHeight;
      const extrudeDepth = wallHeight - minHeight;
      if (extrudeDepth <= 0) return null;

      // Build Three.js Shape from outer ring (local coords)
      const shape = new Shape();
      shape.moveTo(localRing[0]![0], localRing[0]![1]);
      for (let i = 1; i < localRing.length; i++) {
        shape.lineTo(localRing[i]![0], localRing[i]![1]);
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

      // Create wall extrusion
      const geometry = new ExtrudeGeometry(shape, {
        depth: extrudeDepth,
        bevelEnabled: false,
      });
      // ExtrudeGeometry extrudes along +Z; rotate so extrusion goes along +Y (up)
      geometry.rotateX(-Math.PI / 2);

      // Resolve roof color per spec defaults
      const wallColor = building.color;
      const roofColor =
        building.roofColor ??
        (isPitched ? roofColorDefaults.pitched : roofColorDefaults.flat);

      const wallMaterial = new MeshLambertMaterial({ color: wallColor });
      const roofMaterial = new MeshLambertMaterial({ color: roofColor });

      // ExtrudeGeometry groups: 0 = sides (walls), 1 = top cap (roof/ceiling), 2 = bottom cap
      const wallMesh = new Mesh(geometry, [
        wallMaterial,
        isPitched ? wallMaterial : roofMaterial, // Top cap: wall color if roof sits on top
        wallMaterial,
      ]);

      // World position
      const terrainElevation = this.elevation.sampleAt(
        centroid[0],
        centroid[1]
      );
      const worldY = terrainElevation + minHeight;

      // For pitched roofs, add roof geometry
      if (isPitched && roofHeight > 0) {
        const obb = computeOBB(localRing);
        const ridgeAngle = resolveRidgeAngle(
          obb.angle,
          building.roofDirection,
          building.roofOrientation
        );
        const roofGeom = this.roofFactory.create({
          outerRing: localRing,
          roofShape,
          roofHeight,
          ridgeAngle,
        });

        if (roofGeom) {
          const roofMesh = new Mesh(roofGeom, roofMaterial);
          roofMesh.position.y = extrudeDepth; // Sit on top of walls

          const group = new Group();
          group.add(wallMesh);
          group.add(roofMesh);
          group.position.set(centroid[0], worldY, -centroid[1]);
          return group;
        }
      }

      // Flat roof or roof geometry failed — return single mesh
      wallMesh.position.set(centroid[0], worldY, -centroid[1]);
      return wallMesh;
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

  /**
   * Computes a default roof height based on the minor OBB axis (building width).
   * Uses 30% of the minor axis, clamped to [1m, 8m].
   */
  private defaultRoofHeight(localRing: [number, number][]): number {
    const obb = computeOBB(localRing);
    const minorAxis = Math.min(obb.halfLength, obb.halfWidth) * 2;
    return Math.max(1, Math.min(8, minorAxis * 0.3));
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
}
