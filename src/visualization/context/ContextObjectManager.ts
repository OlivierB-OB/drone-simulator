import { Mesh } from 'three';
import { Scene } from '../../3Dviewer/Scene';
import { ContextGeometryObjectManager } from './geometry/ContextGeometryObjectManager';
import { ContextObjectFactory } from './ContextObjectFactory';
import type { TileKey } from '../terrain/geometry/types';

/**
 * Object representing a single context mesh with position tracking
 */
interface ContextMeshObject {
  mesh: Mesh;
  tileKey: TileKey;
}

/**
 * Manages scene integration for context OSM features.
 * Wraps ContextGeometryObjectManager to create meshes and add them to the scene.
 * Handles lifecycle of meshes: creation, positioning, and disposal.
 */
export class ContextObjectManager {
  private readonly meshObjects: Map<string, ContextMeshObject>; // Key: "{tileKey}:{featureId}"
  private readonly geometryManager: ContextGeometryObjectManager;
  private readonly factory: ContextObjectFactory;
  private readonly scene: Scene;

  constructor(
    scene: Scene,
    geometryManager: ContextGeometryObjectManager,
    factory?: ContextObjectFactory
  ) {
    this.scene = scene;
    this.geometryManager = geometryManager;
    this.factory = factory ?? new ContextObjectFactory();
    this.meshObjects = new Map();
  }

  /**
   * Synchronize meshes with geometries in ContextGeometryObjectManager.
   *
   * This method:
   * 1. Calls geometryManager.refresh() to sync geometries with tiles
   * 2. Removes meshes for geometries no longer in geometryManager
   * 3. Creates meshes for new geometries in geometryManager
   * 4. Positions meshes at tile centers
   */
  refresh(): void {
    // Refresh geometries first
    this.geometryManager.refresh();

    // Build set of current geometry keys
    const currentGeometryKeys = new Set<string>();
    for (const contextGeoObj of this.geometryManager.getAllGeometries()) {
      const tileKey = contextGeoObj.getTileKey();
      for (const geometry of contextGeoObj.getGeometries()) {
        const key = `${tileKey}:${geometry.id}`;
        currentGeometryKeys.add(key);
      }
    }

    // Remove meshes for geometries no longer present
    const meshKeysToRemove: string[] = [];
    for (const key of this.meshObjects.keys()) {
      if (!currentGeometryKeys.has(key)) {
        meshKeysToRemove.push(key);
      }
    }

    for (const key of meshKeysToRemove) {
      const meshObj = this.meshObjects.get(key);
      if (meshObj) {
        this.scene.remove(meshObj.mesh);
        meshObj.mesh.geometry.dispose();
        if (Array.isArray(meshObj.mesh.material)) {
          meshObj.mesh.material.forEach((m) => m.dispose());
        } else {
          meshObj.mesh.material.dispose();
        }
        this.meshObjects.delete(key);
      }
    }

    // Add meshes for new geometries
    for (const contextGeoObj of this.geometryManager.getAllGeometries()) {
      const tileKey = contextGeoObj.getTileKey();
      const bounds = contextGeoObj.getMercatorBounds();

      for (const geometry of contextGeoObj.getGeometries()) {
        const key = `${tileKey}:${geometry.id}`;

        // Skip if already exists
        if (this.meshObjects.has(key)) {
          continue;
        }

        // Create mesh from geometry
        const mesh = this.factory.createMesh(geometry);

        // Rotate from XY plane (ShapeGeometry default) to XZ plane (ground)
        mesh.rotation.x = -Math.PI / 2;

        // Position mesh at tile center
        // Note: geometry is already tile-centered internally, but we offset for tile position
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerZ = (bounds.minY + bounds.maxY) / 2;
        mesh.position.set(centerX, 0, -centerZ);

        // Add to scene
        this.scene.add(mesh);

        // Track mesh
        this.meshObjects.set(key, { mesh, tileKey });
      }
    }
  }

  /**
   * Get all managed mesh objects
   */
  getAllMeshes(): Mesh[] {
    return Array.from(this.meshObjects.values()).map((obj) => obj.mesh);
  }

  /**
   * Clean up all meshes and materials, remove from scene
   */
  dispose(): void {
    for (const meshObj of this.meshObjects.values()) {
      this.scene.remove(meshObj.mesh);
      meshObj.mesh.geometry.dispose();
      if (Array.isArray(meshObj.mesh.material)) {
        meshObj.mesh.material.forEach((m) => m.dispose());
      } else {
        meshObj.mesh.material.dispose();
      }
    }
    this.meshObjects.clear();
    this.geometryManager.dispose();
  }
}
