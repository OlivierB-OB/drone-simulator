import { type Object3D, Mesh, type MeshStandardMaterial } from 'three';
import { DroneGeometryFactory } from './factory/DroneGeometryFactory';
import type { Drone } from '../../drone/Drone';
import { mercatorToThreeJs } from '../../gis/types';
import type { Scene } from '../../3Dviewer/Scene';

/**
 * Visual representation of the drone in 3D space.
 * Manages position, orientation, and rotor animation.
 * Uses DroneGeometryFactory for decoupled geometry creation.
 * Subscribes to Drone events for automatic position/orientation updates.
 */
export class DroneObject {
  private readonly group;
  private readonly rotorMeshes;
  private onLocationChanged = () => this.updatePosition();
  private onAzimuthChanged = () => this.updateRotation();
  private onElevationChanged = () => this.updatePosition();

  constructor(
    private readonly drone: Drone,
    private readonly scene: Scene,
    private readonly geometryFactory: DroneGeometryFactory = new DroneGeometryFactory()
  ) {
    const { group, rotors } = this.geometryFactory.createDroneGeometry();
    this.group = group;
    this.rotorMeshes = rotors;

    // Add the drone mesh to the scene
    this.scene.add(this.group);

    // Subscribe to Drone events for automatic position/orientation updates
    this.drone.on('locationChanged', this.onLocationChanged);
    this.drone.on('azimuthChanged', this.onAzimuthChanged);
    this.drone.on('elevationChanged', this.onElevationChanged);
  }

  /**
   * Update drone position from Drone state.
   * Called when location or elevation changes.
   */
  private updatePosition(): void {
    const location = this.drone.getLocation();
    const elevation = this.drone.getElevation();
    const threeCoords = mercatorToThreeJs(location, elevation);
    this.group.position.set(threeCoords.x, threeCoords.y, threeCoords.z);
  }

  /**
   * Update drone rotation from Drone state.
   * Called when azimuth changes.
   */
  private updateRotation(): void {
    const azimuthDegrees = this.drone.getAzimuth();
    // Azimuth increases clockwise, Three.js rotation.y increases counterclockwise
    const azimuthRad = (azimuthDegrees * Math.PI) / 180;
    this.group.rotation.order = 'YXZ';
    this.group.rotation.y = -azimuthRad;
    this.group.rotation.x = 0;
    this.group.rotation.z = 0;
  }

  /**
   * Animate rotors.
   * Called each frame to update rotor rotation.
   */
  animateRotors(): void {
    // TODO: Remove fixed deltaTime value and restore frame-rate independent rotor animation
    const deltaTime = 1;
    // Animate rotors: spin geometry (YXZ order → Y rotation spins disc before X tilts it horizontal)
    // Counter-rotating pairs match real quadcopter torque balance
    const rotorSpeed = 10 * Math.PI; // ~10 rev/s
    this.rotorMeshes.forEach((rotor, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      rotor.rotation.y += direction * rotorSpeed * deltaTime;
    });
  }

  /**
   * Update drone visual position and orientation.
   * @deprecated Use event-driven updates instead. This method is kept for backwards compatibility.
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

  /**
   * Dispose of all Three.js resources and unsubscribe from Drone events.
   * Must be called when DroneObject is no longer needed.
   */
  dispose(): void {
    // Unsubscribe from Drone events
    this.drone.off('locationChanged', this.onLocationChanged);
    this.drone.off('azimuthChanged', this.onAzimuthChanged);
    this.drone.off('elevationChanged', this.onElevationChanged);

    // Dispose of Three.js resources
    this.group.traverse((child) => {
      if (child instanceof Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            (mat as MeshStandardMaterial).map?.dispose();
            mat.dispose();
          });
        } else {
          (child.material as MeshStandardMaterial)?.map?.dispose();
          child.material?.dispose();
        }
      }
    });
  }
}
