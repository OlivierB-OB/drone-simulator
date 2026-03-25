import * as THREE from 'three';
import { Scene } from '../../3Dviewer/Scene';
import type { ContextDataManager } from '../../data/contextual/ContextDataManager';
import type { ContextDataTile } from '../../data/contextual/types';
import type { ElevationDataManager } from '../../data/elevation/ElevationDataManager';
import type { ElevationSampler } from './util/ElevationSampler';
import { featureRegistry } from '../../features/registry';
import '../../features/registration';
import type { OriginManager } from '../../gis/OriginManager';
import {
  geoToLocal,
  type GeoCoordinates,
  type GeoBounds,
} from '../../gis/GeoCoordinates';

/**
 * Manages 3D mesh objects (buildings, vegetation, structures, barriers, bridges)
 * in response to context data tile lifecycle events.
 *
 * Each tile gets a THREE.Group positioned at its geographic center. Feature
 * meshes inside the group are positioned relative to that center, so only the
 * group position needs updating when the drone (origin) moves.
 *
 * Dual-source gating: meshes are created only when both context data and
 * elevation data are available for a tile. Tiles awaiting elevation are held
 * in a pending map — no rebuild or destroy+recreate cycle occurs.
 */
export class MeshObjectManager {
  private readonly objects = new Map<string, THREE.Group>();
  private readonly pendingContext = new Map<string, ContextDataTile>();

  constructor(
    private readonly scene: Scene,
    private readonly contextData: ContextDataManager,
    private readonly elevationSampler: ElevationSampler,
    private readonly elevationData: ElevationDataManager,
    private readonly originManager: OriginManager
  ) {
    contextData.on('tileAdded', this.onContextAdded);
    contextData.on('tileRemoved', this.onContextRemoved);
    elevationData.on('tileAdded', this.onElevationAdded);
    this.originManager.onChange(this.onOriginChange);
  }

  private readonly onContextAdded = ({
    key,
    tile,
  }: {
    key: string;
    tile: ContextDataTile;
  }): void => {
    this.pendingContext.set(key, tile);
    if (this.isElevationReady(tile)) {
      this.pendingContext.delete(key);
      this.buildTile(key, tile);
    }
  };

  private readonly onElevationAdded = (_event: {
    key: string;
    tile: unknown;
  }): void => {
    for (const [key, tile] of this.pendingContext) {
      if (this.isElevationReady(tile)) {
        this.pendingContext.delete(key);
        this.buildTile(key, tile);
      }
    }
  };

  private readonly onContextRemoved = ({ key }: { key: string }): void => {
    this.pendingContext.delete(key);
    const group = this.objects.get(key);
    if (group !== undefined) {
      this.objects.delete(key);
      this.disposeObject(group);
    }
  };

  dispose(): void {
    this.contextData.off('tileAdded', this.onContextAdded);
    this.contextData.off('tileRemoved', this.onContextRemoved);
    this.elevationData.off(
      'tileAdded',
      this.onElevationAdded as Parameters<
        typeof this.elevationData.on<'tileAdded'>
      >[1]
    );
    this.originManager.offChange(this.onOriginChange);
    for (const group of this.objects.values()) this.disposeObject(group);
    this.objects.clear();
    this.pendingContext.clear();
  }

  private isElevationReady(tile: ContextDataTile): boolean {
    const b = tile.geoBounds;
    const centerLat = (b.minLat + b.maxLat) / 2;
    const centerLng = (b.minLng + b.maxLng) / 2;
    return this.elevationData.getTileAt(centerLat, centerLng) !== null;
  }

  private buildTile(key: string, tile: ContextDataTile): void {
    const group = this.createObject(key, tile);
    this.objects.set(key, group);
  }

  private createObject(_key: string, tile: ContextDataTile): THREE.Group {
    const group = new THREE.Group();

    const b = tile.geoBounds;
    const centerLat = (b.minLat + b.maxLat) / 2;
    const centerLng = (b.minLng + b.maxLng) / 2;

    const groupPos = geoToLocal(
      centerLat,
      centerLng,
      0,
      this.originManager.getOrigin()
    );
    group.position.set(groupPos.x, 0, groupPos.z);

    const tileCenter: GeoCoordinates = { lat: centerLat, lng: centerLng };
    const meshes = featureRegistry.createAllMeshes(
      tile.features,
      this.elevationSampler,
      tileCenter
    );
    for (const mesh of meshes) group.add(mesh);

    group.userData.bounds = b;
    this.scene.add(group);
    return group;
  }

  private disposeObject(group: THREE.Group): void {
    this.scene.remove(group);
    group.traverse((child) => {
      const m = child as unknown as {
        geometry?: { dispose: () => void };
        material?: { dispose: () => void } | { dispose: () => void }[];
      };
      m.geometry?.dispose();
      if (Array.isArray(m.material)) {
        m.material.forEach((mat) => mat.dispose());
      } else {
        m.material?.dispose();
      }
    });
  }

  private readonly onOriginChange = (newOrigin: GeoCoordinates): void => {
    for (const group of this.objects.values()) {
      const b = group.userData.bounds as GeoBounds;
      const pos = geoToLocal(
        (b.minLat + b.maxLat) / 2,
        (b.minLng + b.maxLng) / 2,
        0,
        newOrigin
      );
      group.position.set(pos.x, 0, pos.z);
    }
  };
}
