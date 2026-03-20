import type { ElevationDataManager } from '../../../data/elevation/ElevationDataManager';

/**
 * Samples terrain elevation at arbitrary (lat, lng) coordinates by
 * looking up the covering elevation tile and bilinearly interpolating.
 * Returns 0 if no tile covers the point (tiles may not yet be loaded).
 */
export class ElevationSampler {
  constructor(private readonly elevationData: ElevationDataManager) {}

  sampleAt(lat: number, lng: number): number {
    const tile = this.elevationData.getTileAt(lat, lng);
    if (!tile) return 0;

    const { minLat, maxLat, minLng, maxLng } = tile.geoBounds;
    const n = tile.tileSize; // 256

    // Fractional position within the tile [0, 1]
    const fracX = (lng - minLng) / (maxLng - minLng);
    // Tile row 0 is north (maxLat); rows increase southward
    const fracY = (maxLat - lat) / (maxLat - minLat);

    // Pixel coordinates clamped to valid range
    const px = Math.max(0, Math.min(n - 1, fracX * (n - 1)));
    const py = Math.max(0, Math.min(n - 1, fracY * (n - 1)));

    const col0 = Math.floor(px);
    const col1 = Math.min(col0 + 1, n - 1);
    const row0 = Math.floor(py);
    const row1 = Math.min(row0 + 1, n - 1);
    const tx = px - col0;
    const ty = py - row0;

    const v00 = tile.data[row0]![col0]!;
    const v01 = tile.data[row0]![col1]!;
    const v10 = tile.data[row1]![col0]!;
    const v11 = tile.data[row1]![col1]!;

    return (
      (v00 * (1 - tx) + v01 * tx) * (1 - ty) + (v10 * (1 - tx) + v11 * tx) * ty
    );
  }
}
