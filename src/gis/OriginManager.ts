import type { GeoCoordinates } from './GeoCoordinates';

type OriginChangeHandler = (
  newOrigin: GeoCoordinates,
  prevOrigin: GeoCoordinates
) => void;

/**
 * Holds the current Three.js origin in geographic coordinates.
 * All geoToLocal() calls use this origin for position calculations.
 * Updated each frame to match the drone's position.
 *
 * Subscribers (TerrainObjectManager, MeshObjectManager) register via
 * onChange() to reposition their existing tile meshes when the origin shifts.
 */
export class OriginManager {
  private origin: GeoCoordinates;
  private readonly changeHandlers = new Set<OriginChangeHandler>();

  constructor(initial: GeoCoordinates) {
    this.origin = { ...initial };
  }

  getOrigin(): GeoCoordinates {
    return this.origin;
  }

  setOrigin(geo: GeoCoordinates): void {
    if (this.origin.lat === geo.lat && this.origin.lng === geo.lng) return;
    const prev = this.origin;
    this.origin = { ...geo };
    for (const handler of this.changeHandlers) handler(this.origin, prev);
  }

  onChange(handler: OriginChangeHandler): void {
    this.changeHandlers.add(handler);
  }

  offChange(handler: OriginChangeHandler): void {
    this.changeHandlers.delete(handler);
  }
}
