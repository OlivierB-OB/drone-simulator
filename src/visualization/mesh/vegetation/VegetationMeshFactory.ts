import {
  CylinderGeometry,
  SphereGeometry,
  ConeGeometry,
  MeshLambertMaterial,
  Mesh,
  InstancedMesh,
  Group,
  Matrix4,
  Color,
  type Object3D,
} from 'three';
import type {
  VegetationVisual,
  Polygon,
  Point,
  LineString,
} from '../../../data/contextual/types';
import type { ElevationSampler } from '../util/ElevationSampler';
import { vegetationMeshConfig } from '../../../config';

const TRUNK_COLOR = '#6b4226';
const BROADLEAF_COLORS = ['#2d6b1e', '#3a7a30', '#357a28', '#408030'];
const NEEDLELEAF_COLORS = ['#1a5020', '#205828', '#256030', '#1a4a20'];
const SCRUB_COLORS = ['#4a7a38', '#5a8a40', '#4a8030'];

/**
 * Creates 3D vegetation meshes using InstancedMesh for performance.
 * Handles forests, scrub, orchards, vineyards, single trees, and tree rows.
 */
export class VegetationMeshFactory {
  constructor(private readonly elevation: ElevationSampler) {}

  create(vegetation: VegetationVisual[]): Object3D[] {
    const meshes: Object3D[] = [];
    for (const veg of vegetation) {
      try {
        meshes.push(...this.createVegetationMeshes(veg));
      } catch {
        // Skip problematic vegetation features
      }
    }
    return meshes;
  }

  private createVegetationMeshes(veg: VegetationVisual): Object3D[] {
    switch (veg.type) {
      case 'forest':
      case 'wood':
        return this.createForest(veg);
      case 'scrub':
      case 'heath':
        return this.createScrub(veg);
      case 'orchard':
        return this.createOrchard(veg);
      case 'vineyard':
        return this.createVineyard(veg);
      case 'tree':
        return this.createSingleTree(veg);
      case 'tree_row':
        return this.createTreeRow(veg);
      default:
        return [];
    }
  }

  // --- Forest / Wood ---

  private createForest(veg: VegetationVisual): Object3D[] {
    if (veg.geometry.type !== 'Polygon') return [];
    const config = vegetationMeshConfig.forest;
    const points = this.distributePointsInPolygon(
      veg.geometry,
      config.densityPer100m2
    );
    if (points.length === 0) return [];

    const isNeedle = veg.leafType === 'needleleaved';
    const colors = isNeedle ? NEEDLELEAF_COLORS : BROADLEAF_COLORS;

    return this.createInstancedTrees(
      points,
      config.trunkHeightMin,
      config.trunkHeightMax,
      config.crownRadiusMin,
      config.crownRadiusMax,
      isNeedle,
      colors
    );
  }

  // --- Scrub ---

  private createScrub(veg: VegetationVisual): Object3D[] {
    if (veg.geometry.type !== 'Polygon') return [];
    const config = vegetationMeshConfig.scrub;
    const points = this.distributePointsInPolygon(
      veg.geometry,
      config.densityPer100m2
    );
    if (points.length === 0) return [];

    return this.createInstancedBushes(
      points,
      config.crownRadiusMin,
      config.crownRadiusMax,
      SCRUB_COLORS
    );
  }

  // --- Orchard ---

  private createOrchard(veg: VegetationVisual): Object3D[] {
    if (veg.geometry.type !== 'Polygon') return [];
    const config = vegetationMeshConfig.orchard;
    const points = this.distributeGridInPolygon(
      veg.geometry,
      config.spacingX,
      config.spacingY
    );
    if (points.length === 0) return [];

    return this.createInstancedTrees(
      points,
      config.trunkHeightMin,
      config.trunkHeightMax,
      config.crownRadiusMin,
      config.crownRadiusMax,
      false,
      BROADLEAF_COLORS
    );
  }

  // --- Vineyard ---

  private createVineyard(veg: VegetationVisual): Object3D[] {
    if (veg.geometry.type !== 'Polygon') return [];
    const config = vegetationMeshConfig.vineyard;
    const points = this.distributeGridInPolygon(
      veg.geometry,
      config.spacingX,
      config.spacingY
    );
    if (points.length === 0) return [];

    return this.createInstancedBushes(
      points,
      config.crownRadiusMin,
      config.crownRadiusMax,
      SCRUB_COLORS
    );
  }

  // --- Single Tree ---

  private createSingleTree(veg: VegetationVisual): Object3D[] {
    if (veg.geometry.type !== 'Point') return [];
    const [x, y] = (veg.geometry as Point).coordinates;
    const terrainY = this.elevation.sampleAt(x, y);

    const isNeedle = veg.leafType === 'needleleaved';
    const treeHeight = veg.height ?? 10;
    const crownRadius = veg.crownDiameter
      ? veg.crownDiameter / 2
      : treeHeight * 0.25;
    const trunkHeight = treeHeight * 0.4;
    const trunkRadius = veg.trunkCircumference
      ? veg.trunkCircumference / (2 * Math.PI)
      : crownRadius * 0.15;

    const group = new Group();

    // Trunk
    const trunkGeom = new CylinderGeometry(
      trunkRadius,
      trunkRadius * 1.2,
      trunkHeight,
      6
    );
    const trunkMat = new MeshLambertMaterial({ color: TRUNK_COLOR });
    const trunk = new Mesh(trunkGeom, trunkMat);
    trunk.position.y = trunkHeight / 2;
    group.add(trunk);

    // Canopy
    const canopyColor = isNeedle ? NEEDLELEAF_COLORS[0]! : BROADLEAF_COLORS[0]!;
    const canopyGeom = isNeedle
      ? new ConeGeometry(crownRadius, treeHeight - trunkHeight, 8)
      : new SphereGeometry(crownRadius, 8, 6);
    const canopyMat = new MeshLambertMaterial({ color: canopyColor });
    const canopy = new Mesh(canopyGeom, canopyMat);
    canopy.position.y =
      trunkHeight + (isNeedle ? (treeHeight - trunkHeight) / 2 : crownRadius);
    group.add(canopy);

    group.position.set(x, terrainY, -y);
    return [group];
  }

  // --- Tree Row ---

  private createTreeRow(veg: VegetationVisual): Object3D[] {
    if (veg.geometry.type !== 'LineString') return [];
    const coords = (veg.geometry as LineString).coordinates;
    if (coords.length < 2) return [];

    const config = vegetationMeshConfig.treeRow;
    const interval = config.intervalMeters;
    const isNeedle = veg.leafType === 'needleleaved';
    const colors = isNeedle ? NEEDLELEAF_COLORS : BROADLEAF_COLORS;

    // Walk along the line and place trees at intervals
    const points: [number, number][] = [];
    let accumulated = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = coords[i]!;
      const [x2, y2] = coords[i + 1]!;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      if (segLen < 0.1) continue;

      const nx = dx / segLen;
      const ny = dy / segLen;

      while (accumulated < segLen) {
        const px = x1 + nx * accumulated;
        const py = y1 + ny * accumulated;
        points.push([px, py]);
        accumulated += interval;
      }
      accumulated -= segLen;
    }

    if (points.length === 0) return [];

    return this.createInstancedTrees(
      points,
      config.trunkHeightMin,
      config.trunkHeightMax,
      config.crownRadiusMin,
      config.crownRadiusMax,
      isNeedle,
      colors
    );
  }

  // --- Instanced creation helpers ---

  private createInstancedTrees(
    points: [number, number][],
    trunkHeightMin: number,
    trunkHeightMax: number,
    crownRadiusMin: number,
    crownRadiusMax: number,
    isNeedle: boolean,
    colors: string[]
  ): Object3D[] {
    const count = points.length;
    if (count === 0) return [];

    // Shared geometries
    const trunkGeom = new CylinderGeometry(0.15, 0.2, 1, 5); // unit height, scaled per instance
    const canopyGeom = isNeedle
      ? new ConeGeometry(1, 1, 6) // unit radius/height
      : new SphereGeometry(1, 6, 4); // unit radius

    const trunkMat = new MeshLambertMaterial({ color: TRUNK_COLOR });
    const canopyMat = new MeshLambertMaterial({ color: colors[0]! });

    const trunkMesh = new InstancedMesh(trunkGeom, trunkMat, count);
    const canopyMesh = new InstancedMesh(canopyGeom, canopyMat, count);

    const matrix = new Matrix4();
    const color = new Color();

    for (let i = 0; i < count; i++) {
      const [x, y] = points[i]!;
      const seed = this.hash(x, y);
      const t = this.seededRandom(seed);

      const treeHeight = trunkHeightMin + t * (trunkHeightMax - trunkHeightMin);
      const crownRadius =
        crownRadiusMin + t * (crownRadiusMax - crownRadiusMin);
      const trunkHeight = treeHeight * 0.4;
      const trunkRadius = crownRadius * 0.15;
      const terrainY = this.elevation.sampleAt(x, y);

      // Trunk instance
      matrix.makeScale(trunkRadius / 0.15, trunkHeight, trunkRadius / 0.15);
      matrix.setPosition(x, terrainY + trunkHeight / 2, -y);
      trunkMesh.setMatrixAt(i, matrix);

      // Canopy instance
      const canopyHeight = treeHeight - trunkHeight;
      if (isNeedle) {
        matrix.makeScale(crownRadius, canopyHeight, crownRadius);
        matrix.setPosition(x, terrainY + trunkHeight + canopyHeight / 2, -y);
      } else {
        matrix.makeScale(crownRadius, crownRadius, crownRadius);
        matrix.setPosition(x, terrainY + trunkHeight + crownRadius, -y);
      }
      canopyMesh.setMatrixAt(i, matrix);

      // Color variation
      const colorIdx = Math.floor(this.seededRandom(seed + 1) * colors.length);
      color.set(colors[colorIdx]!);
      canopyMesh.setColorAt(i, color);
    }

    trunkMesh.instanceMatrix.needsUpdate = true;
    canopyMesh.instanceMatrix.needsUpdate = true;
    if (canopyMesh.instanceColor) canopyMesh.instanceColor.needsUpdate = true;

    return [trunkMesh, canopyMesh];
  }

  private createInstancedBushes(
    points: [number, number][],
    radiusMin: number,
    radiusMax: number,
    colors: string[]
  ): Object3D[] {
    const count = points.length;
    if (count === 0) return [];

    const bushGeom = new SphereGeometry(1, 6, 4);
    const bushMat = new MeshLambertMaterial({ color: colors[0]! });
    const bushMesh = new InstancedMesh(bushGeom, bushMat, count);

    const matrix = new Matrix4();
    const color = new Color();

    for (let i = 0; i < count; i++) {
      const [x, y] = points[i]!;
      const seed = this.hash(x, y);
      const t = this.seededRandom(seed);

      const radius = radiusMin + t * (radiusMax - radiusMin);
      const terrainY = this.elevation.sampleAt(x, y);

      // Oblate sphere (Y scale * 0.6)
      matrix.makeScale(radius, radius * 0.6, radius);
      matrix.setPosition(x, terrainY + radius * 0.6, -y);
      bushMesh.setMatrixAt(i, matrix);

      const colorIdx = Math.floor(this.seededRandom(seed + 1) * colors.length);
      color.set(colors[colorIdx]!);
      bushMesh.setColorAt(i, color);
    }

    bushMesh.instanceMatrix.needsUpdate = true;
    if (bushMesh.instanceColor) bushMesh.instanceColor.needsUpdate = true;

    return [bushMesh];
  }

  // --- Point distribution ---

  /**
   * Distributes points in a polygon using a grid with random jitter,
   * clipped to the polygon boundary.
   */
  private distributePointsInPolygon(
    polygon: Polygon,
    densityPer100m2: number
  ): [number, number][] {
    const ring = polygon.coordinates[0];
    if (!ring || ring.length < 4) return [];

    const spacing = Math.sqrt(100 / densityPer100m2);
    return this.distributeGridInPolygon(polygon, spacing, spacing, true);
  }

  private distributeGridInPolygon(
    polygon: Polygon,
    spacingX: number,
    spacingY: number,
    jitter: boolean = false
  ): [number, number][] {
    const ring = polygon.coordinates[0];
    if (!ring || ring.length < 4) return [];

    // Compute bounding box
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    // Cap total points to prevent performance issues
    const maxPoints = 2000;
    const estimatedCount =
      ((maxX - minX) / spacingX) * ((maxY - minY) / spacingY);
    const effectiveSpacingX =
      estimatedCount > maxPoints
        ? spacingX * Math.sqrt(estimatedCount / maxPoints)
        : spacingX;
    const effectiveSpacingY =
      estimatedCount > maxPoints
        ? spacingY * Math.sqrt(estimatedCount / maxPoints)
        : spacingY;

    const points: [number, number][] = [];

    for (let x = minX; x <= maxX; x += effectiveSpacingX) {
      for (let y = minY; y <= maxY; y += effectiveSpacingY) {
        let px = x;
        let py = y;

        if (jitter) {
          const seed = this.hash(x, y);
          px += (this.seededRandom(seed + 2) - 0.5) * effectiveSpacingX * 0.8;
          py += (this.seededRandom(seed + 3) - 0.5) * effectiveSpacingY * 0.8;
        }

        if (this.pointInPolygon(px, py, ring)) {
          points.push([px, py]);
        }
      }
    }

    return points;
  }

  /**
   * Ray-casting point-in-polygon test.
   */
  private pointInPolygon(
    x: number,
    y: number,
    ring: [number, number][]
  ): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i]!;
      const [xj, yj] = ring[j]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  // --- Seeded random ---

  private hash(x: number, y: number): number {
    // Simple deterministic hash from coordinates
    const a = Math.floor(x * 1000) & 0xffff;
    const b = Math.floor(y * 1000) & 0xffff;
    return ((a * 73856093) ^ (b * 19349663)) & 0x7fffffff;
  }

  private seededRandom(seed: number): number {
    // Simple PRNG returning [0, 1)
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
}
