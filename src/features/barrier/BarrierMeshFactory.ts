import { BoxGeometry, MeshLambertMaterial, Mesh, type Object3D } from 'three';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import {
  geoToLocal,
  EARTH_RADIUS,
  type GeoCoordinates,
} from '../../gis/GeoCoordinates';
import { barrierDefaults, barrierMaterialColors } from '../../config';
import type { BarrierVisual } from './types';

const TO_RAD = Math.PI / 180;

/**
 * Creates 3D meshes for barriers (walls, city walls, retaining walls, hedges)
 * by extruding BoxGeometry segments along LineString paths.
 *
 * Coordinates are [lng, lat] in degrees (GeoJSON convention).
 */
export class BarrierMeshFactory {
  constructor(private readonly elevation: ElevationSampler) {}

  create(barriers: BarrierVisual[], origin: GeoCoordinates): Object3D[] {
    const meshes: Object3D[] = [];
    for (const barrier of barriers) {
      meshes.push(...this.createBarrierMeshes(barrier, origin));
    }
    return meshes;
  }

  private createBarrierMeshes(
    barrier: BarrierVisual,
    origin: GeoCoordinates
  ): Mesh[] {
    const coords = barrier.geometry.coordinates as [number, number][];
    if (coords.length < 2) return [];

    const defaults = barrierDefaults[barrier.type];
    const height = barrier.height ?? defaults?.height ?? 2;
    const width = barrier.width;
    const color = this.resolveColor(barrier);

    const material = new MeshLambertMaterial({ color });
    const segments: Mesh[] = [];

    for (let i = 0; i < coords.length - 1; i++) {
      const [lng1, lat1] = coords[i]!;
      const [lng2, lat2] = coords[i + 1]!;

      const midLat = (lat1 + lat2) / 2;
      const cosLat = Math.cos(midLat * TO_RAD);

      // Convert degree deltas to meters
      const dEast = (lng2 - lng1) * TO_RAD * EARTH_RADIUS * cosLat;
      const dNorth = (lat2 - lat1) * TO_RAD * EARTH_RADIUS;
      const segmentLength = Math.sqrt(dEast * dEast + dNorth * dNorth);
      if (segmentLength < 0.1) continue;

      const midLng = (lng1 + lng2) / 2;
      const terrainY = this.elevation.sampleAt(midLat, midLng);
      const angle = Math.atan2(dEast, dNorth); // rotation around Y axis

      const geometry = new BoxGeometry(width, height, segmentLength);
      const mesh = new Mesh(geometry, material);
      const pos = geoToLocal(midLat, midLng, terrainY + height / 2, origin);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.y = -angle;
      segments.push(mesh);
    }

    return segments;
  }

  private resolveColor(barrier: BarrierVisual): string {
    if (barrier.material && barrierMaterialColors[barrier.material]) {
      return barrierMaterialColors[barrier.material]!;
    }
    return barrier.color;
  }
}
