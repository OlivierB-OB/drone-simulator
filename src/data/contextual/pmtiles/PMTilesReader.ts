import { PMTiles, FetchSource } from 'pmtiles';
import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';
import type { VectorTileLayer } from '@mapbox/vector-tile';
import type { TileCoordinates } from '../../elevation/types';

export type DecodedTile = Map<string, VectorTileLayer>;

export interface OverzoomTileResult {
  tile: DecodedTile;
  /** Actual coords fetched — parent coords if overzoom was applied, else same as requested */
  effectiveCoords: TileCoordinates;
}

export interface PMTilesReaderConfig {
  baseUrl: string;
  version: string;
  themes: string[];
}

/**
 * Thin wrapper holding PMTiles instances for each Overture Maps theme.
 * Queries all archives in parallel and returns merged MVT layers.
 * Transparently handles overzoom: when the requested zoom exceeds the PMTiles
 * maxZoom, it fetches the nearest parent tile and returns its effective coords.
 */
export class PMTilesReader {
  private readonly archives: Map<string, PMTiles>;
  private effectiveDataZoom: number | null = null;
  private maxZoomReady: Promise<number> | null = null;

  constructor(config: PMTilesReaderConfig) {
    this.archives = new Map();
    for (const theme of config.themes) {
      const url = `${config.baseUrl}/${config.version}/${theme}.pmtiles`;
      this.archives.set(theme, new PMTiles(new FetchSource(url)));
    }
    this.logZoomRanges();
  }

  private logZoomRanges(): void {
    for (const [theme, archive] of this.archives) {
      archive.getHeader().then((h) => {
        console.log(
          `[PMTiles] ${theme}: minZoom=${h.minZoom} maxZoom=${h.maxZoom}`
        );
      });
    }
  }

  /**
   * Returns the minimum maxZoom across all PMTiles archives.
   * This is the highest zoom level at which data is guaranteed to exist for all themes.
   * Result is cached after the first resolution.
   */
  async getEffectiveDataZoom(): Promise<number> {
    if (this.effectiveDataZoom !== null) return this.effectiveDataZoom;
    if (!this.maxZoomReady) {
      this.maxZoomReady = Promise.all(
        Array.from(this.archives.values()).map((a) =>
          a.getHeader().then((h) => h.maxZoom)
        )
      ).then((zooms) => (this.effectiveDataZoom = Math.min(...zooms)));
    }
    return this.maxZoomReady;
  }

  async getTile(coordinates: TileCoordinates): Promise<OverzoomTileResult> {
    const effectiveZ = await this.getEffectiveDataZoom();
    const dz = coordinates.z - effectiveZ;

    const effectiveCoords: TileCoordinates =
      dz > 0
        ? { z: effectiveZ, x: coordinates.x >> dz, y: coordinates.y >> dz }
        : coordinates;

    const results = await Promise.all(
      Array.from(this.archives.entries()).map(async ([, archive]) => {
        const result = await archive.getZxy(
          effectiveCoords.z,
          effectiveCoords.x,
          effectiveCoords.y
        );
        if (!result || !result.data) return null;
        const pbf = new Pbf(new Uint8Array(result.data));
        return new VectorTile(pbf);
      })
    );

    const tile: DecodedTile = new Map();
    for (const vt of results) {
      if (!vt) continue;
      for (const layerName of Object.keys(vt.layers)) {
        tile.set(layerName, vt.layers[layerName]!);
      }
    }
    return { tile, effectiveCoords };
  }

  dispose(): void {
    this.archives.clear();
  }
}
