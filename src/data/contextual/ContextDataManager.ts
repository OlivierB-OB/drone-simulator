import type { MercatorCoordinates } from '../../gis/types';

/**
 * Manages terrain and geographical context information.
 * Provides access to map features, terrain properties, and geographic metadata.
 */
export class ContextDataManager {
  private currentLocation: MercatorCoordinates;

  constructor(initialLocation: MercatorCoordinates) {
    this.currentLocation = initialLocation;
  }

  setLocation(location: MercatorCoordinates): void {
    this.currentLocation = location;
  }

  dispose(): void {}
}
