import { type Object3D, Mesh, type MeshStandardMaterial } from 'three';
import { DroneGeometryFactory } from './factory/DroneGeometryFactory';
import type { Drone } from '../../drone/Drone';
import type { Viewer3D } from '../../3Dviewer/Viewer3D';

/**
 * Visual representation of the drone in 3D space.
 * Manages position and orientation.
 * Uses DroneGeometryFactory for decoupled geometry creation.
 * Subscribes to Drone events for automatic position/orientation updates and rendering.
 */
export class DroneObject {
  private readonly group;
  private onLocationChanged = () => this.updatePosition();
  private onAzimuthChanged = () => this.updateRotation();
  private onElevationChanged = () => this.updatePosition();

  constructor(
    private readonly drone: Drone,
    private readonly viewer3D: Viewer3D,
    private readonly geometryFactory: DroneGeometryFactory = new DroneGeometryFactory()
  ) {
    this.group = this.geometryFactory.createDroneGeometry();

    // Add the drone mesh to the scene
    this.viewer3D.getScene().add(this.group);

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
    // Drone is always at origin (0, elevation, 0) in local tangent plane
    this.group.position.set(0, this.drone.getElevation(), 0);
    this.viewer3D.render();
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
    this.viewer3D.render();
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
