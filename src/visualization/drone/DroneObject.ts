import { type Object3D, Mesh } from 'three';
import { DroneGeometryFactory } from './factory/DroneGeometryFactory';

/**
 * Visual representation of the drone in 3D space.
 * Manages position, orientation, and rotor animation.
 * Uses DroneGeometryFactory for decoupled geometry creation.
 */
export class DroneObject {
  private readonly group;
  private readonly rotorMeshes;

  constructor(
    private readonly geometryFactory: DroneGeometryFactory = new DroneGeometryFactory()
  ) {
    const { group, rotors } = this.geometryFactory.createDroneGeometry();
    this.group = group;
    this.rotorMeshes = rotors;
  }

  /**
   * Update drone visual position and orientation.
   *
   * @param x Three.js X position (= Mercator X)
   * @param y Three.js Y position (= elevation)
   * @param z Three.js Z position (= -Mercator Y)
   * @param azimuthDegrees Compass heading (0=North, 90=East, clockwise)
   * @param deltaTime Elapsed time in seconds for rotor animation
   */
  update(
    x: number,
    y: number,
    z: number,
    azimuthDegrees: number,
    deltaTime: number = 0
  ): void {
    this.group.position.set(x, y, z);

    // Azimuth increases clockwise, Three.js rotation.y increases counterclockwise
    const azimuthRad = (azimuthDegrees * Math.PI) / 180;
    this.group.rotation.order = 'YXZ';
    this.group.rotation.y = -azimuthRad;
    this.group.rotation.x = 0;
    this.group.rotation.z = 0;

    // Animate rotors: spin geometry (YXZ order → Y rotation spins disc before X tilts it horizontal)
    // Counter-rotating pairs match real quadcopter torque balance
    const rotorSpeed = 10 * Math.PI; // ~10 rev/s
    this.rotorMeshes.forEach((rotor, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      rotor.rotation.y += direction * rotorSpeed * deltaTime;
    });
  }

  getMesh(): Object3D {
    return this.group;
  }

  dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
  }
}
