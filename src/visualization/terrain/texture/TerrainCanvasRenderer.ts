import type { ContextDataTile } from '../../../data/contextual/types';
import type { MercatorBounds } from '../../../gis/types';
import { groundColors } from '../../../config';

/**
 * Renders context features (landuse, roads, water, vegetation, etc.) onto a canvas.
 * The canvas serves as a texture that will be applied to terrain meshes.
 *
 * Draw order (painter's algorithm, back to front):
 *   1. Base ground fill
 *   2. Landuse/landcover areas
 *   3. Water bodies (polygon areas)
 *   4. Wetlands
 *   5. Waterway lines
 *   6. Vegetation areas
 *   7. Aeroways
 *   8. Roads (sorted by widthPx ascending)
 *   9. Railways
 */
export class TerrainCanvasRenderer {
  constructor(private readonly canvasSize: number = 512) {}

  /**
   * Render a context tile's features onto a canvas.
   *
   * @param canvas - HTMLCanvasElement to render onto
   * @param contextTile - Context data tile containing features
   * @param mercatorBounds - Mercator coordinate bounds for the tile
   */
  renderTile(
    canvas: HTMLCanvasElement,
    contextTile: ContextDataTile,
    mercatorBounds: MercatorBounds
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = groundColors.default;
    ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    const mercatorWidth = mercatorBounds.maxX - mercatorBounds.minX;
    const mercatorHeight = mercatorBounds.maxY - mercatorBounds.minY;
    const scaleX = this.canvasSize / mercatorWidth;
    const scaleY = this.canvasSize / mercatorHeight;

    this.drawLanduse(ctx, contextTile, mercatorBounds, scaleX, scaleY);
    this.drawWaterBodies(ctx, contextTile, mercatorBounds, scaleX, scaleY);
    this.drawWetlands(ctx, contextTile, mercatorBounds, scaleX, scaleY);
    this.drawWaterwayLines(ctx, contextTile, mercatorBounds, scaleX, scaleY);
    this.drawVegetation(ctx, contextTile, mercatorBounds, scaleX, scaleY);
    this.drawAeroways(ctx, contextTile, mercatorBounds, scaleX, scaleY);
    this.drawRoads(ctx, contextTile, mercatorBounds, scaleX, scaleY);
    this.drawRailways(ctx, contextTile, mercatorBounds, scaleX, scaleY);
  }

  /**
   * Clear the canvas with the default ground color.
   */
  clear(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = groundColors.default;
    ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
  }

  private drawLanduse(
    ctx: CanvasRenderingContext2D,
    tile: ContextDataTile,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number
  ): void {
    for (const lu of tile.features.landuse) {
      ctx.fillStyle = lu.color;
      this.drawPolygon(
        ctx,
        lu.geometry.coordinates,
        bounds,
        scaleX,
        scaleY,
        true,
        false
      );
    }
  }

  private drawWaterBodies(
    ctx: CanvasRenderingContext2D,
    tile: ContextDataTile,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number
  ): void {
    for (const water of tile.features.waters) {
      if (!water.isArea || water.type === 'wetland') continue;
      ctx.fillStyle = water.color;
      if (water.geometry.type === 'Polygon') {
        this.drawPolygon(
          ctx,
          water.geometry.coordinates,
          bounds,
          scaleX,
          scaleY,
          true,
          false
        );
      }
    }
  }

  private drawWetlands(
    ctx: CanvasRenderingContext2D,
    tile: ContextDataTile,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number
  ): void {
    for (const water of tile.features.waters) {
      if (water.type !== 'wetland') continue;
      ctx.fillStyle = water.color;
      if (water.geometry.type === 'Polygon') {
        this.drawPolygon(
          ctx,
          water.geometry.coordinates,
          bounds,
          scaleX,
          scaleY,
          true,
          false
        );
      }
    }
  }

  private drawWaterwayLines(
    ctx: CanvasRenderingContext2D,
    tile: ContextDataTile,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number
  ): void {
    ctx.setLineDash([]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const water of tile.features.waters) {
      if (water.isArea) continue;
      ctx.strokeStyle = water.color;
      ctx.lineWidth = water.widthPx;
      if (water.geometry.type === 'LineString') {
        this.drawLineString(
          ctx,
          water.geometry.coordinates,
          bounds,
          scaleX,
          scaleY
        );
      }
    }
  }

  private drawVegetation(
    ctx: CanvasRenderingContext2D,
    tile: ContextDataTile,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number
  ): void {
    for (const veg of tile.features.vegetation) {
      // tree and tree_row are mesh-only (§5.4) — no canvas rendering
      if (veg.type === 'tree' || veg.type === 'tree_row') continue;

      ctx.fillStyle = veg.color;

      if (veg.geometry.type === 'Polygon') {
        this.drawPolygon(
          ctx,
          veg.geometry.coordinates,
          bounds,
          scaleX,
          scaleY,
          true,
          false
        );
      } else if (veg.geometry.type === 'LineString') {
        ctx.strokeStyle = veg.color;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([]);
        this.drawLineString(
          ctx,
          veg.geometry.coordinates,
          bounds,
          scaleX,
          scaleY
        );
      } else if (veg.geometry.type === 'Point') {
        const [x, y] = veg.geometry.coordinates;
        const canvasX = (x - bounds.minX) * scaleX;
        const canvasY = (bounds.maxY - y) * scaleY;
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawAeroways(
    ctx: CanvasRenderingContext2D,
    tile: ContextDataTile,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number
  ): void {
    ctx.setLineDash([]);
    for (const aeroway of tile.features.airports) {
      ctx.fillStyle = aeroway.color;
      ctx.strokeStyle = aeroway.color;

      if (aeroway.geometry.type === 'Polygon') {
        this.drawPolygon(
          ctx,
          aeroway.geometry.coordinates,
          bounds,
          scaleX,
          scaleY,
          true,
          false
        );
      } else if (aeroway.geometry.type === 'LineString') {
        ctx.lineWidth = aeroway.widthPx ?? 2; // runway: 3, taxiway: 2, taxilane: 1.5
        this.drawLineString(
          ctx,
          aeroway.geometry.coordinates,
          bounds,
          scaleX,
          scaleY
        );
      } else if (aeroway.geometry.type === 'Point') {
        const [x, y] = aeroway.geometry.coordinates;
        const canvasX = (x - bounds.minX) * scaleX;
        const canvasY = (bounds.maxY - y) * scaleY;
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 4, 0, Math.PI * 2); // spec §5.7: helipad r=4px
        ctx.fill();
      }
    }
  }

  private drawRoads(
    ctx: CanvasRenderingContext2D,
    tile: ContextDataTile,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number
  ): void {
    // Sort ascending by widthPx: narrow roads drawn first, wide roads on top
    const sorted = [...tile.features.roads].sort(
      (a, b) => a.widthPx - b.widthPx
    );

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const road of sorted) {
      ctx.setLineDash(road.type === 'steps' ? [2, 2] : []); // spec §5.5: steps dash [2,2]
      ctx.strokeStyle = road.surfaceColor ?? road.color;
      ctx.lineWidth = road.widthPx;
      this.drawLineString(
        ctx,
        road.geometry.coordinates,
        bounds,
        scaleX,
        scaleY
      );
    }
    ctx.setLineDash([]);
  }

  private drawRailways(
    ctx: CanvasRenderingContext2D,
    tile: ContextDataTile,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number
  ): void {
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';

    for (const railway of tile.features.railways) {
      ctx.strokeStyle = railway.color;
      ctx.lineWidth = railway.widthPx;
      ctx.setLineDash(railway.dash);
      this.drawLineString(
        ctx,
        railway.geometry.coordinates,
        bounds,
        scaleX,
        scaleY
      );
    }

    ctx.setLineDash([]);
  }

  private drawPolygon(
    ctx: CanvasRenderingContext2D,
    rings: Array<Array<[number, number]>>,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number,
    fill: boolean,
    stroke: boolean
  ): void {
    if (rings.length === 0 || (rings[0]?.length ?? 0) === 0) return;

    ctx.beginPath();
    for (const ring of rings) {
      if (ring.length === 0) continue;
      let first = true;
      for (const [x, y] of ring) {
        const canvasX = (x - bounds.minX) * scaleX;
        const canvasY = (bounds.maxY - y) * scaleY;
        if (first) {
          ctx.moveTo(canvasX, canvasY);
          first = false;
        } else {
          ctx.lineTo(canvasX, canvasY);
        }
      }
      ctx.closePath();
    }

    if (fill) ctx.fill('evenodd');
    if (stroke) ctx.stroke();
  }

  private drawLineString(
    ctx: CanvasRenderingContext2D,
    coordinates: Array<[number, number]>,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number
  ): void {
    if (coordinates.length < 2) return;

    ctx.beginPath();
    let firstPoint = true;

    for (const [x, y] of coordinates) {
      const canvasX = (x - bounds.minX) * scaleX;
      const canvasY = (bounds.maxY - y) * scaleY;

      if (firstPoint) {
        ctx.moveTo(canvasX, canvasY);
        firstPoint = false;
      } else {
        ctx.lineTo(canvasX, canvasY);
      }
    }

    ctx.stroke();
  }
}
