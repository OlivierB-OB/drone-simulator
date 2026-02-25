/**
 * Parser for elevation tile PNG data using Terrarium format.
 * Handles PNG decoding and elevation value extraction from RGB channels.
 *
 * Terrarium Format:
 * - PNG-encoded with elevation data in R, G, B channels
 * - Formula: elevation = (R × 256 + G + B/256) - 32768 meters
 */
export class ElevationDataTileParser {
  /**
   * Decodes a PNG image using the HTML5 Canvas API.
   * Works in browser environments and returns ImageData with RGBA channels.
   *
   * @param pngData - PNG file as Uint8Array
   * @returns ImageData with pixel data or null if decoding fails
   */
  private static async decodePNG(pngData: Uint8Array): Promise<{
    data: Uint8ClampedArray;
    width: number;
    height: number;
  } | null> {
    try {
      // Create a blob from the PNG data
      const blob = new Blob([new Uint8Array(pngData)], { type: 'image/png' });
      const url = URL.createObjectURL(blob);

      return new Promise((resolve) => {
        const image = new Image();

        image.onload = () => {
          // Create canvas and draw image
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(null);
            return;
          }

          ctx.drawImage(image, 0, 0);

          // Extract pixel data
          const imageData = ctx.getImageData(0, 0, image.width, image.height);
          URL.revokeObjectURL(url);

          resolve({
            data: imageData.data,
            width: image.width,
            height: image.height,
          });
        };

        image.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };

        image.src = url;
      });
    } catch {
      return null;
    }
  }

  /**
   * Extract elevation values from PNG ImageData using Terrarium format.
   * Terrarium encoding: elevation = (R×256 + G + B/256) - 32768
   *
   * @param imageData Canvas ImageData with RGBA pixels
   * @param tileSize Expected grid size (typically 256)
   * @returns number[][] 2D array [row][column] with elevation in meters
   * @throws Error if image dimensions don't match tileSize
   */
  static parseTerriumElevations(
    imageData: {
      data: Uint8ClampedArray;
      width: number;
      height: number;
    },
    tileSize: number
  ): number[][] {
    // Validate dimensions
    if (imageData.width !== tileSize || imageData.height !== tileSize) {
      throw new Error(
        `Invalid tile dimensions: expected ${tileSize}×${tileSize}, got ${imageData.width}×${imageData.height}`
      );
    }

    const data: number[][] = [];
    let pixelIndex = 0;
    const bytesPerPixel =
      imageData.data.length === tileSize * tileSize * 4 ? 4 : 3;

    for (let row = 0; row < tileSize; row++) {
      const rowData: number[] = [];

      for (let col = 0; col < tileSize; col++) {
        // Extract RGB values (skip alpha channel if present)
        const r = imageData.data[pixelIndex++] ?? 0;
        const g = imageData.data[pixelIndex++] ?? 0;
        const b = imageData.data[pixelIndex++] ?? 0;

        // Skip alpha channel if present (RGBA format)
        if (bytesPerPixel === 4) {
          pixelIndex++;
        }

        // Decode elevation from Terrarium RGB encoding
        // elevation = (R × 256 + G + B/256) - 32768
        const elevation = r * 256 + g + b / 256 - 32768;

        rowData.push(elevation);
      }

      data.push(rowData);
    }

    return data;
  }

  /**
   * Combined convenience method: PNG bytes → ImageData → Elevations
   * Decodes PNG and extracts elevation values in one call.
   *
   * @param pngData Uint8Array of PNG file
   * @param tileSize Expected grid size (typically 256)
   * @returns number[][] elevation grid [row][column] in meters
   * @throws Error if PNG cannot be decoded or dimensions are invalid
   */
  static async parsePNG(
    pngData: Uint8Array,
    tileSize: number
  ): Promise<number[][]> {
    const imageData = await ElevationDataTileParser.decodePNG(pngData);

    if (!imageData) {
      throw new Error('Failed to decode PNG image');
    }

    return ElevationDataTileParser.parseTerriumElevations(imageData, tileSize);
  }
}
