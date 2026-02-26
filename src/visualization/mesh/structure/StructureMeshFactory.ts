import {
  CylinderGeometry,
  BoxGeometry,
  SphereGeometry,
  MeshLambertMaterial,
  Mesh,
  Group,
  type Object3D,
} from 'three';
import type { StructureVisual } from '../../../data/contextual/types';
import type { ElevationSampler } from '../util/ElevationSampler';
import { structureDefaults } from '../../../config';

/**
 * Creates 3D meshes for man-made structures (towers, chimneys, masts, etc.)
 * using parametric shapes from config defaults.
 */
export class StructureMeshFactory {
  constructor(private readonly elevation: ElevationSampler) {}

  create(structures: StructureVisual[]): Object3D[] {
    const meshes: Object3D[] = [];
    for (const structure of structures) {
      const mesh = this.createStructureMesh(structure);
      if (mesh) meshes.push(mesh);
    }
    return meshes;
  }

  private createStructureMesh(structure: StructureVisual): Object3D | null {
    const defaults = structureDefaults[structure.type];
    if (!defaults) return null;

    const height = structure.height ?? defaults.height;
    const radius = structure.diameter
      ? structure.diameter / 2
      : defaults.radius;
    const color = structure.color;

    // Get world position
    const [mx, my] = this.getPosition(structure);
    const terrainY = this.elevation.sampleAt(mx, my);

    let obj: Object3D;

    switch (defaults.shape) {
      case 'cylinder':
        obj = this.createCylinder(radius, height, color);
        break;
      case 'tapered_cylinder':
        obj = this.createTaperedCylinder(radius, height, color);
        break;
      case 'box':
        obj = this.createBox(radius, height, color);
        break;
      case 'water_tower':
        obj = this.createWaterTower(radius, height, color);
        break;
      case 'crane':
        obj = this.createCrane(radius, height, color);
        break;
      default:
        obj = this.createCylinder(radius, height, color);
    }

    obj.position.set(mx, terrainY + height / 2, -my);
    return obj;
  }

  private createCylinder(radius: number, height: number, color: string): Mesh {
    const geometry = new CylinderGeometry(radius, radius, height, 8);
    const material = new MeshLambertMaterial({ color });
    return new Mesh(geometry, material);
  }

  private createTaperedCylinder(
    radius: number,
    height: number,
    color: string
  ): Mesh {
    const geometry = new CylinderGeometry(radius * 0.6, radius, height, 8);
    const material = new MeshLambertMaterial({ color });
    return new Mesh(geometry, material);
  }

  private createBox(radius: number, height: number, color: string): Mesh {
    const size = radius * 2;
    const geometry = new BoxGeometry(size, height, size);
    const material = new MeshLambertMaterial({ color });
    return new Mesh(geometry, material);
  }

  private createWaterTower(
    radius: number,
    height: number,
    color: string
  ): Group {
    const group = new Group();
    const material = new MeshLambertMaterial({ color });

    // Support column (thinner cylinder, bottom 2/3)
    const columnHeight = height * 0.65;
    const column = new Mesh(
      new CylinderGeometry(radius * 0.3, radius * 0.3, columnHeight, 8),
      material
    );
    column.position.y = -height / 2 + columnHeight / 2;
    group.add(column);

    // Tank (sphere at top)
    const tank = new Mesh(new SphereGeometry(radius, 12, 8), material);
    tank.position.y = height / 2 - radius;
    group.add(tank);

    return group;
  }

  private createCrane(radius: number, height: number, color: string): Group {
    const group = new Group();
    const material = new MeshLambertMaterial({ color });

    // Vertical mast
    const mast = new Mesh(
      new BoxGeometry(radius * 2, height, radius * 2),
      material
    );
    group.add(mast);

    // Horizontal arm
    const armLength = height * 0.6;
    const arm = new Mesh(new BoxGeometry(armLength, radius, radius), material);
    arm.position.set(armLength / 2, height / 2 - radius, 0);
    group.add(arm);

    return group;
  }

  private getPosition(structure: StructureVisual): [number, number] {
    if (structure.geometry.type === 'Point') {
      return structure.geometry.coordinates;
    }
    // Polygon: use centroid
    const ring = structure.geometry.coordinates[0];
    if (!ring || ring.length < 2) return [0, 0];
    let sx = 0,
      sy = 0;
    const n = ring.length - 1;
    for (let i = 0; i < n; i++) {
      sx += ring[i]![0];
      sy += ring[i]![1];
    }
    return [sx / n, sy / n];
  }
}
