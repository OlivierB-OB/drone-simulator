import type { MercatorCoordinates } from '../../gis/types';

/**
 * Manages elevation data loading and caching for geographic regions.
 * Provides fast lookups of elevation values at specific coordinates.
 */
export class ElevationDataManager {
  private currentLocation: MercatorCoordinates;

  constructor(initialLocation: MercatorCoordinates) {
    this.currentLocation = initialLocation;
  }

  setLocation(location: MercatorCoordinates): void {
    this.currentLocation = location;
  }

  dispose(): void {}
}
