import type { ContextDataTile } from '../../../data/contextual/types';
import type { MercatorBounds } from '../../../gis/types';

/**
 * Renders context features (buildings, roads, water, vegetation, etc.) onto a canvas.
 * The canvas serves as a texture that will be applied to terrain meshes.
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

    // Clear canvas with light background
    ctx.fillStyle = '#f0e8d8';
    ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    // Calculate scale factors for converting Mercator to canvas coordinates
    const mercatorWidth = mercatorBounds.maxX - mercatorBounds.minX;
    const mercatorHeight = mercatorBounds.maxY - mercatorBounds.minY;

    const scaleX = this.canvasSize / mercatorWidth;
    const scaleY = this.canvasSize / mercatorHeight;

    // Draw order: background to foreground
    this.drawWater(ctx, contextTile, mercatorBounds, scaleX, scaleY);
    this.drawVegetation(ctx, contextTile, mercatorBounds, scaleX, scaleY);
    this.drawBuildings(ctx, contextTile, mercatorBounds, scaleX, scaleY);
    this.drawRoads(ctx, contextTile, mercatorBounds, scaleX, scaleY);
    this.drawRailways(ctx, contextTile, mercatorBounds, scaleX, scaleY);
    this.drawAirports(ctx, contextTile, mercatorBounds, scaleX, scaleY);
  }

  /**
   * Clear the canvas with a light background color.
   */
  clear(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f0e8d8';
    ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
  }

  private drawWater(
    ctx: CanvasRenderingContext2D,
    tile: ContextDataTile,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number
  ): void {
    for (const water of tile.features.waters) {
      ctx.fillStyle = water.color;
      ctx.strokeStyle = water.color;
      ctx.lineWidth = 1;

      if (water.geometry.type === 'Polygon') {
        const ring = water.geometry.coordinates[0];
        if (ring) {
          this.drawPolygon(ctx, ring, bounds, scaleX, scaleY, true);
        }
      } else if (water.geometry.type === 'LineString') {
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
      ctx.fillStyle = veg.color;
      ctx.strokeStyle = veg.color;
      ctx.lineWidth = 0.5;

      if (veg.geometry.type === 'Polygon') {
        const ring = veg.geometry.coordinates[0];
        if (ring) {
          this.drawPolygon(ctx, ring, bounds, scaleX, scaleY, true);
        }
      } else if (veg.geometry.type === 'LineString') {
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
        const canvasY = (bounds.maxY - y) * scaleY; // invert Y
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawBuildings(
    ctx: CanvasRenderingContext2D,
    tile: ContextDataTile,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number
  ): void {
    for (const building of tile.features.buildings) {
      ctx.fillStyle = building.color;
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 0.5;

      if (building.geometry.type === 'Polygon') {
        const ring = building.geometry.coordinates[0];
        if (ring) {
          this.drawPolygon(ctx, ring, bounds, scaleX, scaleY, true);
        }
      } else if (building.geometry.type === 'Point') {
        const [x, y] = building.geometry.coordinates;
        const canvasX = (x - bounds.minX) * scaleX;
        const canvasY = (bounds.maxY - y) * scaleY;
        ctx.fillRect(canvasX - 2, canvasY - 2, 4, 4);
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
    // Draw roads by width category (smaller first, so larger are drawn on top)
    const roadsByWidth = {
      small: tile.features.roads.filter((r) => r.widthCategory === 'small'),
      medium: tile.features.roads.filter((r) => r.widthCategory === 'medium'),
      large: tile.features.roads.filter((r) => r.widthCategory === 'large'),
    };

    const widthMap = { small: 1, medium: 2.5, large: 4 };

    for (const [category, roads] of Object.entries(roadsByWidth)) {
      const width = widthMap[category as keyof typeof widthMap];
      for (const road of roads) {
        ctx.strokeStyle = road.color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        this.drawLineString(
          ctx,
          road.geometry.coordinates,
          bounds,
          scaleX,
          scaleY
        );
      }
    }
  }

  private drawRailways(
    ctx: CanvasRenderingContext2D,
    tile: ContextDataTile,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number
  ): void {
    for (const railway of tile.features.railways) {
      ctx.strokeStyle = railway.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]); // dashed line for railways

      this.drawLineString(
        ctx,
        railway.geometry.coordinates,
        bounds,
        scaleX,
        scaleY
      );
    }

    ctx.setLineDash([]); // reset line dash
  }

  private drawAirports(
    ctx: CanvasRenderingContext2D,
    tile: ContextDataTile,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number
  ): void {
    for (const airport of tile.features.airports) {
      ctx.fillStyle = airport.color;
      ctx.strokeStyle = '#cc8800';
      ctx.lineWidth = 1;

      if (airport.geometry.type === 'Point') {
        const [x, y] = airport.geometry.coordinates;
        const canvasX = (x - bounds.minX) * scaleX;
        const canvasY = (bounds.maxY - y) * scaleY;
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (airport.geometry.type === 'Polygon') {
        const ring = airport.geometry.coordinates[0];
        if (ring) {
          this.drawPolygon(ctx, ring, bounds, scaleX, scaleY, true);
        }
      } else if (airport.geometry.type === 'LineString') {
        this.drawLineString(
          ctx,
          airport.geometry.coordinates,
          bounds,
          scaleX,
          scaleY
        );
      }
    }
  }

  private drawPolygon(
    ctx: CanvasRenderingContext2D,
    coordinates: Array<[number, number]>,
    bounds: MercatorBounds,
    scaleX: number,
    scaleY: number,
    fill: boolean
  ): void {
    if (coordinates.length === 0) return;

    ctx.beginPath();
    let firstPoint = true;

    for (const [x, y] of coordinates) {
      const canvasX = (x - bounds.minX) * scaleX;
      const canvasY = (bounds.maxY - y) * scaleY; // invert Y for canvas coordinates

      if (firstPoint) {
        ctx.moveTo(canvasX, canvasY);
        firstPoint = false;
      } else {
        ctx.lineTo(canvasX, canvasY);
      }
    }

    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    ctx.stroke();
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
      const canvasY = (bounds.maxY - y) * scaleY; // invert Y

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
