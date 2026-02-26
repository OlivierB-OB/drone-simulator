import { BoxGeometry, MeshLambertMaterial, Mesh, type Object3D } from 'three';
import type { BarrierVisual } from '../../../data/contextual/types';
import type { ElevationSampler } from '../util/ElevationSampler';
import { barrierDefaults, barrierMaterialColors } from '../../../config';

/**
 * Creates 3D meshes for barriers (walls, city walls, retaining walls, hedges)
 * by extruding BoxGeometry segments along LineString paths.
 */
export class BarrierMeshFactory {
  constructor(private readonly elevation: ElevationSampler) {}

  create(barriers: BarrierVisual[]): Object3D[] {
    const meshes: Object3D[] = [];
    for (const barrier of barriers) {
      meshes.push(...this.createBarrierMeshes(barrier));
    }
    return meshes;
  }

  private createBarrierMeshes(barrier: BarrierVisual): Mesh[] {
    const coords = barrier.geometry.coordinates;
    if (coords.length < 2) return [];

    const defaults = barrierDefaults[barrier.type];
    const height = barrier.height ?? defaults?.height ?? 2;
    const width = barrier.width;
    const color = this.resolveColor(barrier);

    const material = new MeshLambertMaterial({ color });
    const segments: Mesh[] = [];

    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = coords[i]!;
      const [x2, y2] = coords[i + 1]!;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      if (segmentLength < 0.1) continue;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const terrainY = this.elevation.sampleAt(midX, midY);
      const angle = Math.atan2(dx, dy); // rotation around Y axis

      const geometry = new BoxGeometry(width, height, segmentLength);
      const mesh = new Mesh(geometry, material);
      mesh.position.set(midX, terrainY + height / 2, -midY);
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
