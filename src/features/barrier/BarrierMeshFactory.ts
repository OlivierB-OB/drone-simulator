import { BoxGeometry, MeshLambertMaterial, Mesh, type Object3D } from 'three';
import distance from '@turf/distance';
import bearing from '@turf/bearing';
import { point } from '@turf/helpers';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import { geoToLocal, type GeoCoordinates } from '../../gis/GeoCoordinates';
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

      const p1 = point([lng1, lat1]);
      const p2 = point([lng2, lat2]);
      const segmentLength = distance(p1, p2, { units: 'meters' });
      if (segmentLength < 0.1) continue;

      const midLat = (lat1 + lat2) / 2;
      const midLng = (lng1 + lng2) / 2;
      const terrainY = this.elevation.sampleAt(midLat, midLng);
      const angle = bearing(p1, p2) * TO_RAD;

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
