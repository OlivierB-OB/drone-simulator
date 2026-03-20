import {
  Shape,
  ExtrudeGeometry,
  MeshLambertMaterial,
  DoubleSide,
  Mesh,
  Group,
  type Object3D,
  Path,
} from 'three';
import centroid from '@turf/centroid';
import type { Polygon } from 'geojson';
import type { BuildingVisual } from './types';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import {
  geoToLocal,
  EARTH_RADIUS,
  type GeoCoordinates,
} from '../../gis/GeoCoordinates';
import { buildingHeightDefaults, roofColorDefaults } from '../../config';
import {
  RoofGeometryFactory,
  computeOBB,
  resolveRidgeAngle,
} from './RoofGeometryFactory';

const TO_RAD = Math.PI / 180;

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
 * float32 precision issues at large coordinate values.
 *
 * Coordinates are [lng, lat] in degrees (GeoJSON convention).
 * Local ring converts degree offsets to meters for correct geometry.
 */
export class BuildingMeshFactory {
  private readonly roofFactory = new RoofGeometryFactory();

  constructor(private readonly elevation: ElevationSampler) {}

  /**
   * Creates Object3D[] for all buildings in a tile.
   * @param buildings - Parsed building visuals (hasParts flag set by the data parser)
   * @param origin - Current origin for coordinate conversion
   */
  create(buildings: BuildingVisual[], origin: GeoCoordinates): Object3D[] {
    const meshes: Object3D[] = [];
    for (const building of buildings) {
      if (building.geometry.type !== 'Polygon') continue;
      if (!building.isPart && building.hasParts) continue;

      const mesh = this.createBuildingMesh(building, building.geometry, origin);
      if (mesh) meshes.push(mesh);
    }
    return meshes;
  }

  private createBuildingMesh(
    building: BuildingVisual,
    polygon: Polygon,
    origin: GeoCoordinates
  ): Object3D | null {
    try {
      const outerRing = polygon.coordinates[0] as [number, number][];

      // Compute centroid [lng, lat]
      const center = centroid(polygon).geometry.coordinates as [number, number];
      const centerLng = center[0];
      const centerLat = center[1];
      const cosLat = Math.cos(centerLat * TO_RAD);

      // Build local ring: convert degree offsets to meters
      const localRing: [number, number][] = outerRing.map((pt) => [
        (pt[0] - centerLng) * TO_RAD * EARTH_RADIUS * cosLat,
        (pt[1] - centerLat) * TO_RAD * EARTH_RADIUS,
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
        roofHeight = Math.min(roofHeight, totalHeight - minHeight - 1);
        if (roofHeight < 0) roofHeight = 0;
      }
      const wallHeight = totalHeight - roofHeight;
      const extrudeDepth = wallHeight - minHeight;
      if (extrudeDepth <= 0) return null;

      // Build Three.js Shape from outer ring (local coords in meters)
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
        const hFirst = innerRing[0] as [number, number];
        hole.moveTo(
          (hFirst[0] - centerLng) * TO_RAD * EARTH_RADIUS * cosLat,
          (hFirst[1] - centerLat) * TO_RAD * EARTH_RADIUS
        );
        for (let i = 1; i < innerRing.length; i++) {
          const pt = innerRing[i] as [number, number];
          hole.lineTo(
            (pt[0] - centerLng) * TO_RAD * EARTH_RADIUS * cosLat,
            (pt[1] - centerLat) * TO_RAD * EARTH_RADIUS
          );
        }
        shape.holes.push(hole);
      }

      // Create wall extrusion
      const geometry = new ExtrudeGeometry(shape, {
        depth: extrudeDepth,
        bevelEnabled: false,
      });
      geometry.rotateX(-Math.PI / 2);

      const wallColor = building.color;
      const roofColor =
        building.roofColor ??
        (isPitched ? roofColorDefaults.pitched : roofColorDefaults.flat);

      const wallMaterial = new MeshLambertMaterial({
        color: wallColor,
        side: DoubleSide,
      });
      const roofMaterial = new MeshLambertMaterial({ color: roofColor });

      const wallMesh = new Mesh(geometry, [
        wallMaterial,
        isPitched ? wallMaterial : roofMaterial,
        wallMaterial,
      ]);

      // World position: sample elevation at centroid
      const terrainElevation = this.elevation.sampleAt(centerLat, centerLng);
      const worldY = terrainElevation + minHeight;

      if (isPitched && roofHeight > 0) {
        const obb = computeOBB(localRing);
        let ridgeAngle = resolveRidgeAngle(
          obb.angle,
          building.roofDirection,
          building.roofOrientation
        );
        if (roofShape === 'skillion' && building.roofDirection !== undefined) {
          ridgeAngle += Math.PI / 2;
        }
        const roofGeom = this.roofFactory.create({
          outerRing: localRing,
          roofShape,
          roofHeight,
          ridgeAngle,
        });

        if (roofGeom) {
          const roofMesh = new Mesh(roofGeom, roofMaterial);
          roofMesh.position.y = extrudeDepth;

          const group = new Group();
          group.add(wallMesh);
          group.add(roofMesh);
          const pos = geoToLocal(centerLat, centerLng, worldY, origin);
          group.position.set(pos.x, pos.y, pos.z);
          return group;
        }
      }

      const pos = geoToLocal(centerLat, centerLng, worldY, origin);
      wallMesh.position.set(pos.x, pos.y, pos.z);
      return wallMesh;
    } catch {
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

  private defaultRoofHeight(localRing: [number, number][]): number {
    const obb = computeOBB(localRing);
    const minorAxis = Math.min(obb.halfLength, obb.halfWidth) * 2;
    return Math.max(1, Math.min(8, minorAxis * 0.3));
  }
}
