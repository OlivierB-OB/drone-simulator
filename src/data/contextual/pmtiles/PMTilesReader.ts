import { PMTiles, FetchSource } from 'pmtiles';
import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';
import type { VectorTileLayer } from '@mapbox/vector-tile';
import type { TileCoordinates } from '../../elevation/types';

export type DecodedTile = Map<string, VectorTileLayer>;

export interface ArchiveGroup {
  tile: DecodedTile;
  fetchCoords: TileCoordinates;
}

export interface OverzoomTileResult {
  groups: ArchiveGroup[];
  /** Highest-resolution coordinates — same as requested (= max archive zoom is the ceiling) */
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
  }

  /**
   * Returns the maximum maxZoom across all PMTiles archives.
   * This is the highest zoom level at which any theme has data, allowing per-archive
   * overzoom so that high-resolution archives (e.g. buildings at Z:14) are not
   * downgraded to match lower-resolution ones (e.g. transportation at Z:13).
   * Result is cached after the first resolution.
   */
  async getEffectiveDataZoom(): Promise<number> {
    if (this.effectiveDataZoom !== null) return this.effectiveDataZoom;
    if (!this.maxZoomReady) {
      this.maxZoomReady = Promise.all(
        Array.from(this.archives.values()).map((a) =>
          a.getHeader().then((h) => h.maxZoom)
        )
      ).then((zooms) => (this.effectiveDataZoom = Math.max(...zooms)));
    }
    return this.maxZoomReady;
  }

  async getTile(coordinates: TileCoordinates): Promise<OverzoomTileResult> {
    const archiveResults = await Promise.all(
      Array.from(this.archives.values()).map(async (archive) => {
        const { maxZoom } = await archive.getHeader();
        const dz = Math.max(0, coordinates.z - maxZoom);
        const fetchCoords: TileCoordinates =
          dz > 0
            ? { z: maxZoom, x: coordinates.x >> dz, y: coordinates.y >> dz }
            : coordinates;
        const result = await archive.getZxy(
          fetchCoords.z,
          fetchCoords.x,
          fetchCoords.y
        );
        if (!result || !result.data) return null;
        return {
          vt: new VectorTile(new Pbf(new Uint8Array(result.data))),
          fetchCoords,
        };
      })
    );

    // Group layers by fetch coords — archives at the same zoom share one group
    const groupMap = new Map<
      string,
      { tile: DecodedTile; fetchCoords: TileCoordinates }
    >();
    for (const r of archiveResults) {
      if (!r) continue;
      const key = `${r.fetchCoords.z}:${r.fetchCoords.x}:${r.fetchCoords.y}`;
      if (!groupMap.has(key))
        groupMap.set(key, { tile: new Map(), fetchCoords: r.fetchCoords });
      const group = groupMap.get(key)!;
      for (const layerName of Object.keys(r.vt.layers)) {
        group.tile.set(layerName, r.vt.layers[layerName]!);
      }
    }

    return {
      groups: Array.from(groupMap.values()),
      effectiveCoords: coordinates,
    };
  }

  dispose(): void {
    this.archives.clear();
  }
}
