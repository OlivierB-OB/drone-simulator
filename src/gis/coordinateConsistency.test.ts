import { describe, it, expect } from 'vitest';
import { geoToLocal, EARTH_RADIUS } from './GeoCoordinates';

const TO_RAD = Math.PI / 180;

/**
 * Coordinate consistency tests validate that geoToLocal() produces
 * correct local tangent plane coordinates for the drone simulator.
 *
 * Local tangent plane convention:
 *   X = east, Y = up, Z = south
 */
describe('Coordinate System Consistency', () => {
  describe('geoToLocal local tangent plane', () => {
    it('point at origin should return (0, elevation, 0)', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const result = geoToLocal(origin.lat, origin.lng, 100, origin);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBe(100);
      expect(result.z).toBeCloseTo(0, 5);
    });

    it('point east of origin should have positive X', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const result = geoToLocal(origin.lat, origin.lng + 0.001, 0, origin);

      expect(result.x).toBeGreaterThan(0);
      expect(result.z).toBeCloseTo(0, 3);
    });

    it('point north of origin should have negative Z (Z = south)', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const result = geoToLocal(origin.lat + 0.001, origin.lng, 0, origin);

      expect(result.z).toBeLessThan(0);
      expect(result.x).toBeCloseTo(0, 3);
    });
  });

  describe('spatial relationships validation', () => {
    it('drone at origin, terrain at same lat/lng should align at same XZ', () => {
      const origin = { lat: 48.853, lng: 2.3499 };

      const dronePos = geoToLocal(origin.lat, origin.lng, 35, origin);
      const terrainPos = geoToLocal(origin.lat, origin.lng, 0, origin);

      expect(dronePos.x).toBeCloseTo(terrainPos.x, 5);
      expect(dronePos.z).toBeCloseTo(terrainPos.z, 5);
      expect(dronePos.y).toBe(35);
      expect(terrainPos.y).toBe(0);
    });

    it('building and terrain at same location should have same XZ', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const buildingLat = 48.854;
      const buildingLng = 2.351;

      const terrainPos = geoToLocal(buildingLat, buildingLng, 0, origin);
      const buildingPos = geoToLocal(buildingLat, buildingLng, 15, origin);

      expect(terrainPos.x).toBeCloseTo(buildingPos.x, 5);
      expect(terrainPos.z).toBeCloseTo(buildingPos.z, 5);
    });
  });

  describe('cardinal direction alignment', () => {
    it('azimuth 0° (North) should align with -Z direction', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const north = geoToLocal(origin.lat + 0.01, origin.lng, 0, origin);

      expect(north.z).toBeLessThan(0);
      expect(north.x).toBeCloseTo(0, 3);
    });

    it('azimuth 90° (East) should align with +X direction', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const east = geoToLocal(origin.lat, origin.lng + 0.01, 0, origin);

      expect(east.x).toBeGreaterThan(0);
      expect(east.z).toBeCloseTo(0, 3);
    });

    it('azimuth 180° (South) should align with +Z direction', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const south = geoToLocal(origin.lat - 0.01, origin.lng, 0, origin);

      expect(south.z).toBeGreaterThan(0);
      expect(south.x).toBeCloseTo(0, 3);
    });

    it('azimuth 270° (West) should align with -X direction', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const west = geoToLocal(origin.lat, origin.lng - 0.01, 0, origin);

      expect(west.x).toBeLessThan(0);
      expect(west.z).toBeCloseTo(0, 3);
    });
  });

  describe('elevation independence', () => {
    it('elevation changes should not affect XZ positioning', () => {
      const origin = { lat: 48.853, lng: 2.3499 };
      const target = { lat: 48.855, lng: 2.352 };

      const pos0 = geoToLocal(target.lat, target.lng, 0, origin);
      const pos100 = geoToLocal(target.lat, target.lng, 100, origin);
      const posNeg = geoToLocal(target.lat, target.lng, -50, origin);

      expect(pos100.x).toBeCloseTo(pos0.x, 5);
      expect(pos100.z).toBeCloseTo(pos0.z, 5);
      expect(posNeg.x).toBeCloseTo(pos0.x, 5);
      expect(posNeg.z).toBeCloseTo(pos0.z, 5);

      expect(pos100.y).toBe(100);
      expect(posNeg.y).toBe(-50);
    });
  });

  describe('distance accuracy', () => {
    it('1 degree latitude should be approximately 111km', () => {
      const origin = { lat: 0, lng: 0 };
      const result = geoToLocal(1, 0, 0, origin);

      const expectedMeters = 1 * TO_RAD * EARTH_RADIUS;
      const actualDistance = Math.sqrt(result.x ** 2 + result.z ** 2);
      expect(actualDistance).toBeCloseTo(expectedMeters, -2);
    });

    it('1 degree longitude at equator should be approximately 111km', () => {
      const origin = { lat: 0, lng: 0 };
      const result = geoToLocal(0, 1, 0, origin);

      const expectedMeters = 1 * TO_RAD * EARTH_RADIUS;
      expect(result.x).toBeCloseTo(expectedMeters, -2);
    });

    it('1 degree longitude at Paris latitude should be shorter than at equator', () => {
      const parisOrigin = { lat: 48.853, lng: 2.3499 };
      const equatorOrigin = { lat: 0, lng: 0 };

      const parisEast = geoToLocal(
        parisOrigin.lat,
        parisOrigin.lng + 1,
        0,
        parisOrigin
      );
      const equatorEast = geoToLocal(0, 1, 0, equatorOrigin);

      expect(Math.abs(parisEast.x)).toBeLessThan(Math.abs(equatorEast.x));
    });
  });
});
