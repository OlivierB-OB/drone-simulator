import { Mesh, ConeGeometry, MeshBasicMaterial, type Object3D } from 'three';

export class DroneObject {
  private readonly mesh: Mesh;

  constructor(
    geometryConstructor: typeof ConeGeometry = ConeGeometry,
    materialConstructor: typeof MeshBasicMaterial = MeshBasicMaterial
  ) {
    const geometry = new geometryConstructor(2, 6, 8);
    const material = new materialConstructor({ color: 0xff4444 });
    this.mesh = new Mesh(geometry, material);
  }

  /**
   * Update drone visual position and orientation.
   *
   * @param x Three.js X position (= Mercator X)
   * @param y Three.js Y position (= elevation)
   * @param z Three.js Z position (= -Mercator Y)
   * @param azimuthDegrees Compass heading (0=North, 90=East, clockwise)
   */
  update(x: number, y: number, z: number, azimuthDegrees: number): void {
    this.mesh.position.set(x, y, z);

    // Azimuth increases clockwise, Three.js rotation.y increases counterclockwise
    // ConeGeometry tip points +Y by default; rotate -90° on X to point along -Z (North)
    // Apply rotation order YXZ: yaw (azimuth) first, then pitch (tilt forward)
    const azimuthRad = (azimuthDegrees * Math.PI) / 180;
    this.mesh.rotation.order = 'YXZ';
    this.mesh.rotation.y = -azimuthRad;
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.rotation.z = 0;
  }

  getMesh(): Object3D {
    return this.mesh;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as MeshBasicMaterial).dispose();
  }
}
