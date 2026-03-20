import type { GeoCoordinates } from './GeoCoordinates';

/**
 * Holds the current Three.js origin in geographic coordinates.
 * All geoToLocal() calls use this origin for position calculations.
 * Updated each frame to match the drone's position.
 */
export class OriginManager {
  private origin: GeoCoordinates;

  constructor(initial: GeoCoordinates) {
    this.origin = { ...initial };
  }

  getOrigin(): GeoCoordinates {
    return this.origin;
  }

  setOrigin(geo: GeoCoordinates): void {
    this.origin = { ...geo };
  }
}
