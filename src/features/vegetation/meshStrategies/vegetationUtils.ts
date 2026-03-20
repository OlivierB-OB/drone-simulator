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

const TO_RAD = Math.PI / 180;

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
 * Creates instanced tree meshes from [lng, lat] points.
 */
export function createInstancedTrees(
  points: [number, number][],
  trunkHeightMin: number,
  trunkHeightMax: number,
  crownRadiusMin: number,
  crownRadiusMax: number,
  isNeedle: boolean,
  colors: string[],
  elevation: ElevationSampler,
  origin: GeoCoordinates
): Object3D[] {
  const count = points.length;
  if (count === 0) return [];

  const trunkGeom = new CylinderGeometry(0.15, 0.2, 1, 5);
  const canopyGeom = isNeedle
    ? new ConeGeometry(1, 1, 6)
    : new SphereGeometry(1, 6, 4);

  const trunkMat = new MeshLambertMaterial({ color: TRUNK_COLOR });
  const canopyMat = new MeshLambertMaterial({ color: colors[0]! });

  const trunkMesh = new InstancedMesh(trunkGeom, trunkMat, count);
  const canopyMesh = new InstancedMesh(canopyGeom, canopyMat, count);

  const matrix = new Matrix4();
  const color = new Color();

  for (let i = 0; i < count; i++) {
    const [lng, lat] = points[i]!;
    const seed = hash(lng, lat);
    const t = seededRandom(seed);

    const treeHeight = trunkHeightMin + t * (trunkHeightMax - trunkHeightMin);
    const crownRadius = crownRadiusMin + t * (crownRadiusMax - crownRadiusMin);
    const trunkHeight = treeHeight * 0.4;
    const trunkRadius = crownRadius * 0.15;
    const terrainY = elevation.sampleAt(lat, lng);

    const pos = geoToLocal(lat, lng, 0, origin);

    matrix.makeScale(trunkRadius / 0.15, trunkHeight, trunkRadius / 0.15);
    matrix.setPosition(pos.x, terrainY + trunkHeight / 2, pos.z);
    trunkMesh.setMatrixAt(i, matrix);

    const canopyHeight = treeHeight - trunkHeight;
    if (isNeedle) {
      matrix.makeScale(crownRadius, canopyHeight, crownRadius);
      matrix.setPosition(
        pos.x,
        terrainY + trunkHeight + canopyHeight / 2,
        pos.z
      );
    } else {
      matrix.makeScale(crownRadius, crownRadius, crownRadius);
      matrix.setPosition(pos.x, terrainY + trunkHeight + crownRadius, pos.z);
    }
    canopyMesh.setMatrixAt(i, matrix);

    const colorIdx = Math.floor(seededRandom(seed + 1) * colors.length);
    color.set(colors[colorIdx]!);
    canopyMesh.setColorAt(i, color);
  }

  trunkMesh.instanceMatrix.needsUpdate = true;
  canopyMesh.instanceMatrix.needsUpdate = true;
  if (canopyMesh.instanceColor) canopyMesh.instanceColor.needsUpdate = true;

  return [trunkMesh, canopyMesh];
}

/**
 * Creates instanced bush meshes from [lng, lat] points.
 */
export function createInstancedBushes(
  points: [number, number][],
  radiusMin: number,
  radiusMax: number,
  colors: string[],
  elevation: ElevationSampler,
  origin: GeoCoordinates
): Object3D[] {
  const count = points.length;
  if (count === 0) return [];

  const bushGeom = new SphereGeometry(1, 6, 4);
  const bushMat = new MeshLambertMaterial({ color: colors[0]! });
  const bushMesh = new InstancedMesh(bushGeom, bushMat, count);

  const matrix = new Matrix4();
  const color = new Color();

  for (let i = 0; i < count; i++) {
    const [lng, lat] = points[i]!;
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
