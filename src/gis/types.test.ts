import { describe, it, expect } from 'vitest';
import { geoToLocal, EARTH_RADIUS } from './GeoCoordinates';

const TO_RAD = Math.PI / 180;

describe('geoToLocal', () => {
  describe('direct mapping validation', () => {
    it('should map east offset to positive Three.js X', () => {
      const origin = { lat: 0, lng: 0 };
      const result = geoToLocal(0, 1, 0, origin);

      expect(result.x).toBeGreaterThan(0);
    });

    it('should map elevation directly to Three.js Y', () => {
      const origin = { lat: 0, lng: 0 };
      const result = geoToLocal(0, 0, 500, origin);

      expect(result.y).toBe(500);
    });

    it('should map north offset to negative Three.js Z (Z = south)', () => {
      const origin = { lat: 0, lng: 0 };
      const result = geoToLocal(1, 0, 0, origin);

      expect(result.z).toBeLessThan(0);
    });
  });

  describe('ground truth: known coordinates', () => {
    it('should convert origin point to (0, elevation, 0)', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const result = geoToLocal(48.853, 2.3499, 100, origin);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBe(100);
      expect(result.z).toBeCloseTo(0, 5);
    });

    it('should compute correct east distance at equator', () => {
      const origin = { lat: 0, lng: 0 };
      const result = geoToLocal(0, 1, 0, origin);

      const expectedX = 1 * TO_RAD * EARTH_RADIUS * Math.cos(0);
      expect(result.x).toBeCloseTo(expectedX, 0);
    });

    it('should compute correct north distance', () => {
      const origin = { lat: 0, lng: 0 };
      const result = geoToLocal(1, 0, 0, origin);

      const expectedZ = -(1 * TO_RAD * EARTH_RADIUS);
      expect(result.z).toBeCloseTo(expectedZ, 0);
    });

    it('should handle southern hemisphere (positive Z for south of origin)', () => {
      const origin = { lat: 0, lng: 0 };
      const result = geoToLocal(-1, 0, 0, origin);

      expect(result.z).toBeGreaterThan(0);
    });
  });

  describe('precision: distance values', () => {
    it('should produce accurate east distance at Paris latitude', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const result = geoToLocal(48.853, 2.3599, 0, origin);

      const dLng = 0.01;
      const expectedX =
        dLng * TO_RAD * EARTH_RADIUS * Math.cos(48.853 * TO_RAD);
      expect(result.x).toBeCloseTo(expectedX, 0);
    });

    it('should produce accurate north distance at Paris latitude', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const result = geoToLocal(48.863, 2.3499, 0, origin);

      const dLat = 0.01;
      const expectedZ = -(dLat * TO_RAD * EARTH_RADIUS);
      expect(result.z).toBeCloseTo(expectedZ, 0);
    });

    it('should handle fractional degrees', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const result = geoToLocal(48.8535, 2.3504, 35.75, origin);

      expect(result.y).toBe(35.75);
      expect(result.x).toBeGreaterThan(0); // slightly east
      expect(result.z).toBeLessThan(0); // slightly north
    });
  });

  describe('azimuth alignment: direction verification', () => {
    it('north movement should decrease Z', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const base = geoToLocal(48.853, 2.3499, 0, origin);
      const north = geoToLocal(48.854, 2.3499, 0, origin);

      expect(north.z).toBeLessThan(base.z);
    });

    it('east movement should increase X', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const base = geoToLocal(48.853, 2.3499, 0, origin);
      const east = geoToLocal(48.853, 2.3509, 0, origin);

      expect(east.x).toBeGreaterThan(base.x);
    });

    it('south movement should increase Z', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const base = geoToLocal(48.853, 2.3499, 0, origin);
      const south = geoToLocal(48.852, 2.3499, 0, origin);

      expect(south.z).toBeGreaterThan(base.z);
    });

    it('west movement should decrease X', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const base = geoToLocal(48.853, 2.3499, 0, origin);
      const west = geoToLocal(48.853, 2.3489, 0, origin);

      expect(west.x).toBeLessThan(base.x);
    });
  });

  describe('elevation handling', () => {
    it('should handle zero elevation', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const result = geoToLocal(48.853, 2.3499, 0, origin);

      expect(result.y).toBe(0);
    });

    it('should handle negative elevation (below sea level)', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const result = geoToLocal(48.853, 2.3499, -100, origin);

      expect(result.y).toBe(-100);
    });

    it('should handle large positive elevation', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const result = geoToLocal(48.853, 2.3499, 8848, origin);

      expect(result.y).toBe(8848);
    });
  });

  describe('mathematical properties', () => {
    it('should be anti-symmetric for horizontal components', () => {
      const a = { lat: 48.853, lng: 2.3499 };
      const b = { lat: 48.86, lng: 2.36 };

      const aToB = geoToLocal(b.lat, b.lng, 0, a);
      const bToA = geoToLocal(a.lat, a.lng, 0, b);

      expect(aToB.x).toBeCloseTo(-bToA.x, 0);
      expect(aToB.z).toBeCloseTo(-bToA.z, 0);
    });

    it('elevation should be independent of horizontal position', () => {
      const origin = { lat: 48.853, lng: 2.3499 };

      const result1 = geoToLocal(48.853, 2.3499, 50, origin);
      const result2 = geoToLocal(48.853, 2.3499, 100, origin);

      expect(result2.y - result1.y).toBe(50);
      expect(result2.x).toBeCloseTo(result1.x, 5);
      expect(result2.z).toBeCloseTo(result1.z, 5);
    });
  });
});
