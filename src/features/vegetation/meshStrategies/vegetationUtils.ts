import {
  CylinderGeometry,
  SphereGeometry,
  ConeGeometry,
  MeshLambertMaterial,
  InstancedMesh,
  Matrix4,
  Color,
  type Object3D,
} from 'three';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon as turfPolygon } from '@turf/helpers';
import pointGrid from '@turf/point-grid';
import type { Polygon } from 'geojson';
import type { ElevationSampler } from '../../../visualization/mesh/util/ElevationSampler';
import {
  geoToLocal,
  EARTH_RADIUS,
  type GeoCoordinates,
} from '../../../gis/GeoCoordinates';
import type { TreePoint, BushPoint } from './types';

const TO_RAD = Math.PI / 180;

// Shared geometries — created once, reused across all InstancedMesh calls
const TRUNK_GEOM = new CylinderGeometry(0.15, 0.2, 1, 5);
const BROADLEAF_GEOM = new SphereGeometry(1, 6, 4);
const NEEDLE_GEOM = new ConeGeometry(1, 1, 6);
const BUSH_GEOM = new SphereGeometry(1, 6, 4);

export const TRUNK_COLOR = '#6b4226';
export const BROADLEAF_COLORS = ['#2d6b1e', '#3a7a30', '#357a28', '#408030'];
export const NEEDLELEAF_COLORS = ['#1a5020', '#205828', '#256030', '#1a4a20'];
export const SCRUB_COLORS = ['#4a7a38', '#5a8a40', '#4a8030'];

export function hash(x: number, y: number): number {
  const a = Math.floor(x * 1000) & 0xffff;
  const b = Math.floor(y * 1000) & 0xffff;
  return ((a * 73856093) ^ (b * 19349663)) & 0x7fffffff;
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Distributes points in a polygon using density-based spacing.
 * Polygon coordinates are [lng, lat] in degrees.
 * Spacing is converted from meters to degree increments.
 */
export function distributePointsInPolygon(
  polygon: Polygon,
  densityPer100m2: number
): [number, number][] {
  const ring = polygon.coordinates[0];
  if (!ring || ring.length < 4) return [];

  const spacing = Math.sqrt(100 / densityPer100m2);
  return distributeGridInPolygon(polygon, spacing, spacing, true);
}

/**
 * Distributes points in a grid pattern within a polygon.
 * Polygon coordinates are [lng, lat] in degrees.
 * spacingX/spacingY are in meters, converted to degrees internally.
 */
export function distributeGridInPolygon(
  polygon: Polygon,
  spacingX: number,
  spacingY: number,
  jitter: boolean = false
): [number, number][] {
  const ring = polygon.coordinates[0];
  if (!ring || ring.length < 4) return [];

  let minLng = Infinity,
    maxLng = -Infinity;
  let minLat = Infinity,
    maxLat = -Infinity;
  for (const [lng, lat] of ring as [number, number][]) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  const grid = pointGrid([minLng, minLat, maxLng, maxLat], spacingX, {
    units: 'meters',
    mask: turfPolygon(polygon.coordinates),
  });

  if (!jitter) {
    return grid.features.map((f) => f.geometry.coordinates as [number, number]);
  }

  const centerLat = (minLat + maxLat) / 2;
  const cosLat = Math.cos(centerLat * TO_RAD);
  const spacingLng = spacingX / (TO_RAD * EARTH_RADIUS * cosLat);
  const spacingLat = spacingY / (TO_RAD * EARTH_RADIUS);

  const points: [number, number][] = [];
  for (const f of grid.features) {
    const [lng, lat] = f.geometry.coordinates as [number, number];
    const seed = hash(lng, lat);
    const px = lng + (seededRandom(seed + 2) - 0.5) * spacingLng * 0.8;
    const py = lat + (seededRandom(seed + 3) - 0.5) * spacingLat * 0.8;
    if (booleanPointInPolygon(point([px, py]), polygon)) {
      points.push([px, py]);
    }
  }
  return points;
}

/**
 * Batches all tree points into a minimal set of InstancedMeshes.
 * Returns 1 trunk mesh + up to 2 canopy meshes (broadleaf, needle).
 */
export function batchInstancedTrees(
  points: TreePoint[],
  elevation: ElevationSampler,
  origin: GeoCoordinates
): Object3D[] {
  if (points.length === 0) return [];

  const broadleaf = points.filter((p) => !p.isNeedle);
  const needle = points.filter((p) => p.isNeedle);

  const trunkMat = new MeshLambertMaterial({ color: TRUNK_COLOR });
  const trunkMesh = new InstancedMesh(TRUNK_GEOM, trunkMat, points.length);

  const matrix = new Matrix4();
  const color = new Color();

  // Trunks — iterate all points in order (broadleaf first, then needle)
  const ordered = [...broadleaf, ...needle];
  for (let i = 0; i < ordered.length; i++) {
    const { lng, lat, trunkHeightMin, trunkHeightMax, crownRadiusMin } =
      ordered[i]!;
    const seed = hash(lng, lat);
    const t = seededRandom(seed);

    const treeHeight = trunkHeightMin + t * (trunkHeightMax - trunkHeightMin);
    const crownRadius =
      crownRadiusMin + t * (ordered[i]!.crownRadiusMax - crownRadiusMin);
    const trunkHeight = treeHeight * 0.4;
    const trunkRadius = crownRadius * 0.15;
    const terrainY = elevation.sampleAt(lat, lng);
    const pos = geoToLocal(lat, lng, 0, origin);

    matrix.makeScale(trunkRadius / 0.15, trunkHeight, trunkRadius / 0.15);
    matrix.setPosition(pos.x, terrainY + trunkHeight / 2, pos.z);
    trunkMesh.setMatrixAt(i, matrix);
  }
  trunkMesh.instanceMatrix.needsUpdate = true;

  const result: Object3D[] = [trunkMesh];

  if (broadleaf.length > 0) {
    const canopyMat = new MeshLambertMaterial({
      color: broadleaf[0]!.colors[0]!,
    });
    const canopyMesh = new InstancedMesh(
      BROADLEAF_GEOM,
      canopyMat,
      broadleaf.length
    );

    for (let i = 0; i < broadleaf.length; i++) {
      const {
        lng,
        lat,
        trunkHeightMin,
        trunkHeightMax,
        crownRadiusMin,
        crownRadiusMax,
        colors,
      } = broadleaf[i]!;
      const seed = hash(lng, lat);
      const t = seededRandom(seed);

      const treeHeight = trunkHeightMin + t * (trunkHeightMax - trunkHeightMin);
      const crownRadius =
        crownRadiusMin + t * (crownRadiusMax - crownRadiusMin);
      const trunkHeight = treeHeight * 0.4;
      const terrainY = elevation.sampleAt(lat, lng);
      const pos = geoToLocal(lat, lng, 0, origin);

      matrix.makeScale(crownRadius, crownRadius, crownRadius);
      matrix.setPosition(pos.x, terrainY + trunkHeight + crownRadius, pos.z);
      canopyMesh.setMatrixAt(i, matrix);

      const colorIdx = Math.floor(seededRandom(seed + 1) * colors.length);
      color.set(colors[colorIdx]!);
      canopyMesh.setColorAt(i, color);
    }
    canopyMesh.instanceMatrix.needsUpdate = true;
    if (canopyMesh.instanceColor) canopyMesh.instanceColor.needsUpdate = true;
    result.push(canopyMesh);
  }

  if (needle.length > 0) {
    const canopyMat = new MeshLambertMaterial({ color: needle[0]!.colors[0]! });
    const canopyMesh = new InstancedMesh(NEEDLE_GEOM, canopyMat, needle.length);

    for (let i = 0; i < needle.length; i++) {
      const {
        lng,
        lat,
        trunkHeightMin,
        trunkHeightMax,
        crownRadiusMin,
        crownRadiusMax,
        colors,
      } = needle[i]!;
      const seed = hash(lng, lat);
      const t = seededRandom(seed);

      const treeHeight = trunkHeightMin + t * (trunkHeightMax - trunkHeightMin);
      const crownRadius =
        crownRadiusMin + t * (crownRadiusMax - crownRadiusMin);
      const trunkHeight = treeHeight * 0.4;
      const canopyHeight = treeHeight - trunkHeight;
      const terrainY = elevation.sampleAt(lat, lng);
      const pos = geoToLocal(lat, lng, 0, origin);

      matrix.makeScale(crownRadius, canopyHeight, crownRadius);
      matrix.setPosition(
        pos.x,
        terrainY + trunkHeight + canopyHeight / 2,
        pos.z
      );
      canopyMesh.setMatrixAt(i, matrix);

      const colorIdx = Math.floor(seededRandom(seed + 1) * colors.length);
      color.set(colors[colorIdx]!);
      canopyMesh.setColorAt(i, color);
    }
    canopyMesh.instanceMatrix.needsUpdate = true;
    if (canopyMesh.instanceColor) canopyMesh.instanceColor.needsUpdate = true;
    result.push(canopyMesh);
  }

  return result;
}

/**
 * Batches all bush points into a single InstancedMesh.
 */
export function batchInstancedBushes(
  points: BushPoint[],
  elevation: ElevationSampler,
  origin: GeoCoordinates
): Object3D[] {
  if (points.length === 0) return [];

  const bushMat = new MeshLambertMaterial({ color: points[0]!.colors[0]! });
  const bushMesh = new InstancedMesh(BUSH_GEOM, bushMat, points.length);

  const matrix = new Matrix4();
  const color = new Color();

  for (let i = 0; i < points.length; i++) {
    const { lng, lat, radiusMin, radiusMax, colors } = points[i]!;
    const seed = hash(lng, lat);
    const t = seededRandom(seed);

    const radius = radiusMin + t * (radiusMax - radiusMin);
    const terrainY = elevation.sampleAt(lat, lng);
    const pos = geoToLocal(lat, lng, 0, origin);

    matrix.makeScale(radius, radius * 0.6, radius);
    matrix.setPosition(pos.x, terrainY + radius * 0.6, pos.z);
    bushMesh.setMatrixAt(i, matrix);

    const colorIdx = Math.floor(seededRandom(seed + 1) * colors.length);
    color.set(colors[colorIdx]!);
    bushMesh.setColorAt(i, color);
  }

  bushMesh.instanceMatrix.needsUpdate = true;
  if (bushMesh.instanceColor) bushMesh.instanceColor.needsUpdate = true;

  return [bushMesh];
}
