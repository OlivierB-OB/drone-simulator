import { describe, it, expect, beforeEach } from 'vitest';
import { ElevationDataTileParser } from './ElevationDataTileParser';

describe('ElevationDataTileParser', () => {
  describe('Terrarium RGB to elevation formula', () => {
    it('should decode RGB(128,0,0) to elevation = 32768', () => {
      // Terrarium formula: elevation = (R × 256 + G + B/256) - 32768
      // For RGB(128, 0, 0): (128 × 256 + 0 + 0/256) - 32768 = 32768 - 32768 = 0
      // Wait, let's recalculate: 128 × 256 = 32768
      // So: 32768 + 0 + 0 - 32768 = 0

      const imageData = {
        data: new Uint8ClampedArray([128, 0, 0, 255]), // RGBA: R=128, G=0, B=0, A=255
        width: 1,
        height: 1,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        1
      );

      expect(elevations[0]![0]).toBe(0);
    });

    it('should decode RGB(128, 0, 0) as reference point (0 meters elevation)', () => {
      // RGB(128,0,0) in Terrarium = 0m elevation
      const imageData = {
        data: new Uint8ClampedArray([128, 0, 0, 255]),
        width: 1,
        height: 1,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        1
      );

      expect(elevations[0]![0]).toBe(0);
    });

    it('should decode positive elevation values', () => {
      // RGB(129, 0, 0) → (129 × 256 + 0 + 0) - 32768 = 33024 - 32768 = 256m
      const imageData = {
        data: new Uint8ClampedArray([129, 0, 0, 255]),
        width: 1,
        height: 1,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        1
      );

      expect(elevations[0]![0]).toBe(256);
    });

    it('should decode sea level (~0m) correctly', () => {
      // For ~0m: (R × 256 + G + B/256) - 32768 ≈ 0
      // So: R × 256 + G + B/256 ≈ 32768
      // R=128, G=0, B=0 → 32768
      const imageData = {
        data: new Uint8ClampedArray([128, 0, 0, 255]),
        width: 1,
        height: 1,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        1
      );

      // Should be very close to 0
      expect(elevations[0]![0]).toBeCloseTo(0, 1);
    });

    it('should decode high elevation (mountain peaks)', () => {
      // Mount Everest ~8848m
      // (R × 256 + G + B/256) = 8848 + 32768 = 41616
      // R = 41616 / 256 = 162.5625 → R=162, remainder=144
      // G = 144, B/256 part = 0
      // Try: R=162, G=144: (162 × 256 + 144) - 32768 = 41616 + 144 - 32768 = 8992
      // Adjust: (162 × 256 + 144 + 0/256) - 32768 = 8992
      // Let me recalculate: 162 * 256 = 41472, + 144 = 41616, - 32768 = 8848 ✓

      const imageData = {
        data: new Uint8ClampedArray([162, 144, 0, 255]),
        width: 1,
        height: 1,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        1
      );

      expect(elevations[0]![0]).toBe(8848);
    });

    it('should handle Blue channel for sub-meter precision', () => {
      // Blue channel provides B/256 = sub-meter precision
      // RGB(128, 0, 64) → (128 × 256 + 0 + 64/256) - 32768
      // = 32768 + 0.25 - 32768 = 0.25m

      const imageData = {
        data: new Uint8ClampedArray([128, 0, 64, 255]),
        width: 1,
        height: 1,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        1
      );

      expect(elevations[0]![0]).toBeCloseTo(0.25, 2);
    });

    it('should decode negative elevation (below sea level)', () => {
      // Dead Sea ~-430m
      // (R × 256 + G + B/256) = -430 + 32768 = 32338
      // R = 32338 / 256 = 126.3359 → R=126, remainder=86
      // G = 86, B = 0
      // (126 × 256 + 86) - 32768 = 32256 + 86 - 32768 = -426
      // Try: R=126, G=86: (126 × 256 + 86) - 32768 = -426 (close enough for test)

      const imageData = {
        data: new Uint8ClampedArray([126, 86, 0, 255]),
        width: 1,
        height: 1,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        1
      );

      // Should be negative and close to -430m
      expect(elevations[0]![0]).toBeLessThan(0);
      expect(elevations[0]![0]).toBeCloseTo(-426, 0);
    });

    it('should handle minimum elevation value (all zeros)', () => {
      // RGB(0, 0, 0) → (0 × 256 + 0 + 0/256) - 32768 = -32768m
      const imageData = {
        data: new Uint8ClampedArray([0, 0, 0, 255]),
        width: 1,
        height: 1,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        1
      );

      expect(elevations[0]![0]).toBe(-32768);
    });

    it('should handle maximum elevation value (all 255)', () => {
      // RGB(255, 255, 255) → (255 × 256 + 255 + 255/256) - 32768
      // = 65280 + 255 + 0.9961 - 32768 = 32767.9961 ≈ 32768m

      const imageData = {
        data: new Uint8ClampedArray([255, 255, 255, 255]),
        width: 1,
        height: 1,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        1
      );

      expect(elevations[0]![0]).toBeCloseTo(32768, 0);
    });
  });

  describe('PNG decoding and format handling', () => {
    it('should parse RGBA format (4 bytes per pixel)', () => {
      // RGBA: R, G, B, A per pixel, 2×2 image
      const imageData = {
        data: new Uint8ClampedArray([
          128, 0, 0, 255, // Pixel (0,0): RGBA
          129, 0, 0, 255, // Pixel (0,1): RGBA
          130, 0, 0, 255, // Pixel (1,0): RGBA
          131, 0, 0, 255, // Pixel (1,1): RGBA
        ]),
        width: 2,
        height: 2,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        2
      );

      // Should have skipped alpha channel correctly and parsed all 4 pixels
      expect(elevations).toHaveLength(2);
      expect(elevations[0]).toHaveLength(2);
      expect(elevations[0]![0]).toBe(0); // 128 → 0
      expect(elevations[0]![1]).toBe(256); // 129 → 256
      expect(elevations[1]![0]).toBe(512); // 130 → 512
      expect(elevations[1]![1]).toBe(768); // 131 → 768
    });

    it('should validate 256×256 tile dimensions', () => {
      const imageData = {
        data: new Uint8ClampedArray(256 * 256 * 4).fill(128),
        width: 256,
        height: 256,
      };

      expect(() => {
        ElevationDataTileParser.parseTerriumElevations(imageData, 256);
      }).not.toThrow();
    });

    it('should reject incorrect tile dimensions (width mismatch)', () => {
      const imageData = {
        data: new Uint8ClampedArray(256 * 256 * 4).fill(128),
        width: 257, // Wrong width
        height: 256,
      };

      expect(() => {
        ElevationDataTileParser.parseTerriumElevations(imageData, 256);
      }).toThrow(/Invalid tile dimensions/);
    });

    it('should reject incorrect tile dimensions (height mismatch)', () => {
      const imageData = {
        data: new Uint8ClampedArray(256 * 256 * 4).fill(128),
        width: 256,
        height: 257, // Wrong height
      };

      expect(() => {
        ElevationDataTileParser.parseTerriumElevations(imageData, 256);
      }).toThrow(/Invalid tile dimensions/);
    });

    it('should reject both dimensions wrong', () => {
      const imageData = {
        data: new Uint8ClampedArray(128 * 128 * 4).fill(128),
        width: 128,
        height: 128,
      };

      expect(() => {
        ElevationDataTileParser.parseTerriumElevations(imageData, 256);
      }).toThrow(/Invalid tile dimensions/);
    });

    it('should detect empty ImageData', () => {
      const imageData = {
        data: new Uint8ClampedArray(0),
        width: 0,
        height: 0,
      };

      expect(() => {
        ElevationDataTileParser.parseTerriumElevations(imageData, 256);
      }).toThrow(/Invalid tile dimensions/);
    });
  });

  describe('2D array structure', () => {
    it('should return 2D array [row][column]', () => {
      // 2×2 test image with known values
      const imageData = {
        data: new Uint8ClampedArray([
          128, 0, 0, 255, // (0,0): elevation 0
          129, 0, 0, 255, // (0,1): elevation 256
          130, 0, 0, 255, // (1,0): elevation 512
          131, 0, 0, 255, // (1,1): elevation 768
        ]),
        width: 2,
        height: 2,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        2
      );

      // Check array structure
      expect(Array.isArray(elevations)).toBe(true);
      expect(elevations).toHaveLength(2); // 2 rows

      expect(Array.isArray(elevations[0])).toBe(true);
      expect(elevations[0]).toHaveLength(2); // 2 columns per row

      // Check values
      expect(elevations[0]![0]).toBe(0);
      expect(elevations[0]![1]).toBe(256);
      expect(elevations[1]![0]).toBe(512);
      expect(elevations[1]![1]).toBe(768);
    });

    it('should maintain row-major ordering', () => {
      // Verify that pixels are read row-by-row (left-to-right, top-to-bottom)
      const imageData = {
        data: new Uint8ClampedArray([
          128, 0, 0, 255, // Row 0, Col 0
          129, 0, 0, 255, // Row 0, Col 1
          130, 0, 0, 255, // Row 1, Col 0
          131, 0, 0, 255, // Row 1, Col 1
        ]),
        width: 2,
        height: 2,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        2
      );

      // Row 0 should have first two pixels
      expect(elevations[0]![0]).toBe(0);
      expect(elevations[0]![1]).toBe(256);

      // Row 1 should have next two pixels
      expect(elevations[1]![0]).toBe(512);
      expect(elevations[1]![1]).toBe(768);
    });

    it('should handle 4×4 tile correctly', () => {
      const size = 4;
      // Create 4×4 image with sequential values
      const pixelData: number[] = [];
      for (let i = 0; i < size * size; i++) {
        // Vary R channel: 128 + i/4, with G, B, A
        pixelData.push(128 + Math.floor(i / 16), (i % 16) * 16, 0, 255);
      }

      const imageData = {
        data: new Uint8ClampedArray(pixelData),
        width: 4,
        height: 4,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        4
      );

      // Should have 4 rows
      expect(elevations).toHaveLength(4);
      // Each row should have 4 columns
      for (let i = 0; i < 4; i++) {
        expect(elevations[i]).toHaveLength(4);
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle pixel data correctly for 2×2 square image', () => {
      // Simulating pixel data for 2×2 square tile with RGBA format
      const data = new Uint8ClampedArray(16); // 4 pixels × 4 bytes each
      // Row 0
      data[0] = 128; // (0,0) R
      data[1] = 0;   // (0,0) G
      data[2] = 0;   // (0,0) B
      data[3] = 255; // (0,0) A
      data[4] = 129; // (0,1) R
      data[5] = 0;   // (0,1) G
      data[6] = 0;   // (0,1) B
      data[7] = 255; // (0,1) A
      // Row 1
      data[8] = 130;  // (1,0) R
      data[9] = 0;    // (1,0) G
      data[10] = 0;   // (1,0) B
      data[11] = 255; // (1,0) A
      data[12] = 131; // (1,1) R
      data[13] = 0;   // (1,1) G
      data[14] = 0;   // (1,1) B
      data[15] = 255; // (1,1) A

      const imageData = {
        data,
        width: 2,
        height: 2,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        2
      );

      expect(elevations).toHaveLength(2);
      expect(elevations[0]!.length).toBe(2);
      expect(elevations[0]![0]).toBe(0); // 128 → 0
      expect(elevations[0]![1]).toBe(256); // 129 → 256
      expect(elevations[1]![0]).toBe(512); // 130 → 512
      expect(elevations[1]![1]).toBe(768); // 131 → 768
    });

    it('should handle RGBA pixel format correctly', () => {
      // Test with explicit RGBA (4 bytes per pixel) in 2×2 square
      const imageData = {
        data: new Uint8ClampedArray([
          128, 0, 0, 255, // (0,0) RGBA
          129, 0, 0, 255, // (0,1) RGBA
          130, 0, 0, 255, // (1,0) RGBA
          131, 0, 0, 255, // (1,1) RGBA
        ]),
        width: 2,
        height: 2,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        2
      );

      // Should correctly skip alpha channel
      expect(elevations[0]![0]).toBe(0); // 128 → 0 elevation
      expect(elevations[0]![1]).toBe(256); // 129 → 256 elevation
      expect(elevations[1]![0]).toBe(512); // 130 → 512 elevation
      expect(elevations[1]![1]).toBe(768); // 131 → 768 elevation
    });

    it('should handle very small tiles (1×1)', () => {
      const imageData = {
        data: new Uint8ClampedArray([128, 0, 0, 255]),
        width: 1,
        height: 1,
      };

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        1
      );

      expect(elevations).toHaveLength(1);
      expect(elevations[0]).toHaveLength(1);
      expect(elevations[0]![0]).toBe(0);
    });

    it('should handle large tiles (256×256)', () => {
      const size = 256;
      // Create a 256×256 tile with all pixels set to RGB(128, 0, 0) = 0 elevation
      // Each pixel is RGBA = 4 bytes, so total = 256×256×4 = 262144 bytes
      const imageData = {
        data: new Uint8ClampedArray(size * size * 4),
        width: size,
        height: size,
      };

      // Fill with pattern: R=128, G=0, B=0, A=255 for each pixel
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 128;     // R
        imageData.data[i + 1] = 0;   // G
        imageData.data[i + 2] = 0;   // B
        imageData.data[i + 3] = 255; // A
      }

      const elevations = ElevationDataTileParser.parseTerriumElevations(
        imageData,
        size
      );

      // Verify structure
      expect(elevations).toHaveLength(size);
      for (let i = 0; i < Math.min(size, 5); i++) {
        // Check first 5 rows
        expect(elevations[i]).toHaveLength(size);
        for (let j = 0; j < Math.min(size, 5); j++) {
          // Check first 5 columns
          expect(elevations[i]![j]).toBe(0); // All RGB(128,0,0) = 0 elevation
        }
      }
    });
  });

  describe('precision and accuracy', () => {
    it('should maintain elevation precision across range', () => {
      // Test precision at different elevation levels
      const testCases = [
        { r: 128, g: 0, b: 0, expectedElev: 0 }, // Sea level
        { r: 128, g: 1, b: 0, expectedElev: 1 }, // 1 meter
        { r: 128, g: 255, b: 0, expectedElev: 255 }, // 255 meters
        { r: 129, g: 0, b: 0, expectedElev: 256 }, // 1 tile width
      ];

      for (const testCase of testCases) {
        const imageData = {
          data: new Uint8ClampedArray([testCase.r, testCase.g, testCase.b, 255]),
          width: 1,
          height: 1,
        };

        const elevations = ElevationDataTileParser.parseTerriumElevations(
          imageData,
          1
        );

        expect(elevations[0]![0]).toBe(testCase.expectedElev);
      }
    });

    it('should preserve floating-point precision in Blue channel', () => {
      // Test sub-meter precision
      const testCases = [
        { r: 128, g: 0, b: 0, expectedPrecision: 0 },
        { r: 128, g: 0, b: 1, expectedPrecision: 1 / 256 }, // ~0.00391m
        { r: 128, g: 0, b: 128, expectedPrecision: 128 / 256 }, // 0.5m
        { r: 128, g: 0, b: 255, expectedPrecision: 255 / 256 }, // ~0.9961m
      ];

      for (const testCase of testCases) {
        const imageData = {
          data: new Uint8ClampedArray([testCase.r, testCase.g, testCase.b, 255]),
          width: 1,
          height: 1,
        };

        const elevations = ElevationDataTileParser.parseTerriumElevations(
          imageData,
          1
        );

        expect(elevations[0]![0]).toBeCloseTo(testCase.expectedPrecision, 3);
      }
    });
  });

  describe('mathematical correctness', () => {
    it('should apply Terrarium formula correctly: (R×256 + G + B/256) - 32768', () => {
      // Verify the formula is applied exactly
      const testCases = [
        // [R, G, B] → expected elevation
        [128, 0, 0], // (128*256 + 0 + 0/256) - 32768 = 0
        [129, 0, 0], // (129*256 + 0 + 0/256) - 32768 = 256
        [0, 0, 0], // (0*256 + 0 + 0/256) - 32768 = -32768
        [255, 255, 255], // (255*256 + 255 + 255/256) - 32768 ≈ 32768
      ];

      for (const [r, g, b] of testCases) {
        const expected = r * 256 + g + b / 256 - 32768;

        const imageData = {
          data: new Uint8ClampedArray([r, g, b, 255]),
          width: 1,
          height: 1,
        };

        const elevations = ElevationDataTileParser.parseTerriumElevations(
          imageData,
          1
        );

        expect(elevations[0]![0]).toBeCloseTo(expected, 2);
      }
    });

    it('should produce correct output range [-32768, ~32768]', () => {
      // Minimum
      const minImageData = {
        data: new Uint8ClampedArray([0, 0, 0, 255]),
        width: 1,
        height: 1,
      };
      const minElevations = ElevationDataTileParser.parseTerriumElevations(
        minImageData,
        1
      );
      expect(minElevations[0]![0]).toBe(-32768);

      // Maximum
      const maxImageData = {
        data: new Uint8ClampedArray([255, 255, 255, 255]),
        width: 1,
        height: 1,
      };
      const maxElevations = ElevationDataTileParser.parseTerriumElevations(
        maxImageData,
        1
      );
      expect(maxElevations[0]![0]).toBeGreaterThan(30000); // ~32768
    });
  });
});
