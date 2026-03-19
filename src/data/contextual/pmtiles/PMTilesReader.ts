import { PMTiles, FetchSource } from 'pmtiles';
import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';
import type { VectorTileLayer } from '@mapbox/vector-tile';

export type DecodedTile = Map<string, VectorTileLayer>;

export interface PMTilesReaderConfig {
  baseUrl: string;
  version: string;
  themes: string[];
}

/**
 * Thin wrapper holding PMTiles instances for each Overture Maps theme.
 * Queries all archives in parallel and returns merged MVT layers.
 */
export class PMTilesReader {
  private readonly archives: Map<string, PMTiles>;

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

  async getTile(z: number, x: number, y: number): Promise<DecodedTile> {
    const results = await Promise.all(
      Array.from(this.archives.entries()).map(async ([, archive]) => {
        const result = await archive.getZxy(z, x, y);
        if (!result || !result.data) return null;
        const pbf = new Pbf(new Uint8Array(result.data));
        return new VectorTile(pbf);
      })
    );

    const layers: DecodedTile = new Map();
    for (const vt of results) {
      if (!vt) continue;
      for (const layerName of Object.keys(vt.layers)) {
        layers.set(layerName, vt.layers[layerName]!);
      }
    }
    return layers;
  }

  dispose(): void {
    this.archives.clear();
  }
}
