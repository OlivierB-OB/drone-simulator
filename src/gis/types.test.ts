import { describe, it, expect } from 'vitest';
import { mercatorToThreeJs, type MercatorCoordinates } from './types';

describe('mercatorToThreeJs', () => {
  describe('direct mapping validation', () => {
    it('should map Mercator X directly to Three.js X', () => {
      const location: MercatorCoordinates = { x: 1000, y: 2000 };
      const elevation = 500;

      const result = mercatorToThreeJs(location, elevation);

      expect(result.x).toBe(1000);
    });

    it('should map elevation directly to Three.js Y', () => {
      const location: MercatorCoordinates = { x: 1000, y: 2000 };
      const elevation = 500;

      const result = mercatorToThreeJs(location, elevation);

      expect(result.y).toBe(500);
    });

    it('should negate Mercator Y to Three.js Z', () => {
      const location: MercatorCoordinates = { x: 1000, y: 2000 };
      const elevation = 500;

      const result = mercatorToThreeJs(location, elevation);

      expect(result.z).toBe(-2000);
    });
  });

  describe('ground truth: known Mercator coordinates', () => {
    it('should convert origin (0,0) with elevation to expected Three.js position', () => {
      const location: MercatorCoordinates = { x: 0, y: 0 };
      const elevation = 100;

      const result = mercatorToThreeJs(location, elevation);

      // JavaScript -0 === 0, but Object.is distinguishes them; use toStrictEqual for fuzzy match
      expect(result.x).toBe(0);
      expect(result.y).toBe(100);
      expect(result.z).toBe(-0); // Negating 0 gives -0 in JavaScript
    });

    it('should convert Paris coordinates correctly', () => {
      // Paris Île de la Cité in Web Mercator
      const parisLocation: MercatorCoordinates = { x: 261763, y: 6250047 };
      const elevation = 35; // Approximate elevation at Paris

      const result = mercatorToThreeJs(parisLocation, elevation);

      // X should be unchanged
      expect(result.x).toBe(261763);
      // Y should be elevation
      expect(result.y).toBe(35);
      // Z should be negated Y
      expect(result.z).toBe(-6250047);
    });

    it('should handle southern hemisphere coordinates (negative Mercator Y → positive Z)', () => {
      // Southern hemisphere has negative Y in Web Mercator
      const southLocation: MercatorCoordinates = { x: 1000000, y: -4000000 };
      const elevation = 200;

      const result = mercatorToThreeJs(southLocation, elevation);

      // When Mercator Y is negative, -Y becomes positive Z
      expect(result.z).toBe(4000000);
      expect(result.x).toBe(1000000);
      expect(result.y).toBe(200);
    });

    it('should handle equatorial region coordinates', () => {
      // Near the equator, Y ≈ 0 in Web Mercator
      const equatorialLocation: MercatorCoordinates = { x: 5000000, y: 100 };
      const elevation = 150;

      const result = mercatorToThreeJs(equatorialLocation, elevation);

      expect(result).toEqual({ x: 5000000, y: 150, z: -100 });
    });
  });

  describe('precision: large coordinate values', () => {
    it('should handle large coordinate values without precision loss (global scale)', () => {
      // Web Mercator coordinates at zoom 15 can reach ~20M meters
      const largeLocation: MercatorCoordinates = {
        x: 20000000,
        y: 20000000,
      };
      const elevation = 5000;

      const result = mercatorToThreeJs(largeLocation, elevation);

      // Should preserve large numbers exactly (JavaScript number precision)
      expect(result.x).toBe(20000000);
      expect(result.y).toBe(5000);
      expect(result.z).toBe(-20000000);
    });

    it('should handle negative large coordinates', () => {
      const negativeLocation: MercatorCoordinates = {
        x: -10000000,
        y: -10000000,
      };
      const elevation = 1000;

      const result = mercatorToThreeJs(negativeLocation, elevation);

      expect(result.x).toBe(-10000000);
      expect(result.y).toBe(1000);
      expect(result.z).toBe(10000000); // Negative Y becomes positive Z
    });

    it('should handle fractional Mercator coordinates', () => {
      const fractionalLocation: MercatorCoordinates = {
        x: 261763.5,
        y: 6250047.25,
      };
      const elevation = 35.75;

      const result = mercatorToThreeJs(fractionalLocation, elevation);

      expect(result.x).toBe(261763.5);
      expect(result.y).toBe(35.75);
      expect(result.z).toBe(-6250047.25);
    });
  });

  describe('azimuth alignment: Z-negation strategy', () => {
    it('should align azimuth 0° (North) with -Z direction', () => {
      // When moving North (increasing Y in Mercator), Z should decrease
      // This proves Z = -Y maps North to -Z direction (Three.js camera default)
      const baseLocation: MercatorCoordinates = { x: 0, y: 0 };
      const northLocation: MercatorCoordinates = { x: 0, y: 1000 };

      const baseResult = mercatorToThreeJs(baseLocation, 0);
      const northResult = mercatorToThreeJs(northLocation, 0);

      // Moving North (Y increases) should decrease Z (move in -Z direction)
      expect(northResult.z).toBeLessThan(baseResult.z);
      expect(northResult.z - baseResult.z).toBe(-1000);
    });

    it('should align azimuth 90° (East) with +X direction', () => {
      // When moving East (increasing X in Mercator), X should increase
      const baseLocation: MercatorCoordinates = { x: 0, y: 0 };
      const eastLocation: MercatorCoordinates = { x: 1000, y: 0 };

      const baseResult = mercatorToThreeJs(baseLocation, 0);
      const eastResult = mercatorToThreeJs(eastLocation, 0);

      // Moving East (X increases) should increase X
      expect(eastResult.x).toBeGreaterThan(baseResult.x);
      expect(eastResult.x - baseResult.x).toBe(1000);
    });

    it('should align azimuth 180° (South) with +Z direction', () => {
      // When moving South (decreasing Y in Mercator), Z should increase
      const baseLocation: MercatorCoordinates = { x: 0, y: 1000 };
      const southLocation: MercatorCoordinates = { x: 0, y: 0 };

      const baseResult = mercatorToThreeJs(baseLocation, 0);
      const southResult = mercatorToThreeJs(southLocation, 0);

      // Moving South (Y decreases) should increase Z (move in +Z direction)
      expect(southResult.z).toBeGreaterThan(baseResult.z);
      expect(southResult.z - baseResult.z).toBe(1000);
    });

    it('should align azimuth 270° (West) with -X direction', () => {
      // When moving West (decreasing X in Mercator), X should decrease
      const baseLocation: MercatorCoordinates = { x: 1000, y: 0 };
      const westLocation: MercatorCoordinates = { x: 0, y: 0 };

      const baseResult = mercatorToThreeJs(baseLocation, 0);
      const westResult = mercatorToThreeJs(westLocation, 0);

      // Moving West (X decreases) should decrease X
      expect(westResult.x).toBeLessThan(baseResult.x);
      expect(westResult.x - baseResult.x).toBe(-1000);
    });
  });

  describe('elevation handling', () => {
    it('should handle zero elevation', () => {
      const location: MercatorCoordinates = { x: 100, y: 200 };
      const elevation = 0;

      const result = mercatorToThreeJs(location, elevation);

      expect(result.y).toBe(0);
    });

    it('should handle negative elevation (below sea level)', () => {
      const location: MercatorCoordinates = { x: 100, y: 200 };
      const elevation = -100;

      const result = mercatorToThreeJs(location, elevation);

      expect(result.y).toBe(-100);
    });

    it('should handle large positive elevation', () => {
      const location: MercatorCoordinates = { x: 100, y: 200 };
      const elevation = 8848; // Mount Everest

      const result = mercatorToThreeJs(location, elevation);

      expect(result.y).toBe(8848);
    });

    it('should handle fractional elevation', () => {
      const location: MercatorCoordinates = { x: 100, y: 200 };
      const elevation = 123.456;

      const result = mercatorToThreeJs(location, elevation);

      expect(result.y).toBe(123.456);
    });
  });

  describe('mathematical properties', () => {
    it('should maintain linearity: scaling coordinates should scale result proportionally', () => {
      const location: MercatorCoordinates = { x: 100, y: 200 };
      const elevation = 50;

      const result1 = mercatorToThreeJs(location, elevation);

      const scaledLocation: MercatorCoordinates = {
        x: location.x * 2,
        y: location.y * 2,
      };
      const result2 = mercatorToThreeJs(scaledLocation, elevation * 2);

      // Scaling should be proportional
      expect(result2.x).toBe(result1.x * 2);
      expect(result2.y).toBe(result1.y * 2);
      expect(result2.z).toBe(result1.z * 2);
    });

    it('should be invertible: reversing Y should negate Z', () => {
      const location: MercatorCoordinates = { x: 100, y: 200 };
      const elevation = 50;

      const result = mercatorToThreeJs(location, elevation);
      const negatedLocation: MercatorCoordinates = { x: location.x, y: -location.y };
      const negatedResult = mercatorToThreeJs(negatedLocation, elevation);

      // Negating Y should negate Z
      expect(negatedResult.z).toBe(-result.z);
      // X and Y should remain the same
      expect(negatedResult.x).toBe(result.x);
      expect(negatedResult.y).toBe(result.y);
    });

    it('should compose with elevation independently', () => {
      const location: MercatorCoordinates = { x: 100, y: 200 };

      const result1 = mercatorToThreeJs(location, 50);
      const result2 = mercatorToThreeJs(location, 100);

      // Only Y should differ when elevation changes
      expect(result2.x).toBe(result1.x);
      expect(result2.z).toBe(result1.z);
      expect(result2.y).toBe(result1.y + 50);
    });
  });
});
