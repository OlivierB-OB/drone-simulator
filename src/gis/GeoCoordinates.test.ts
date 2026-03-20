import { describe, it, expect } from 'vitest';
import {
  EARTH_RADIUS,
  geoToLocal,
  getTileCoordinatesFromGeo,
  getTileGeoBounds,
  type GeoCoordinates,
} from './GeoCoordinates';

describe('geoToLocal', () => {
  const origin: GeoCoordinates = { lat: 48.853, lng: 2.3499 };

  it('should return (0, elevation, 0) at origin', () => {
    const result = geoToLocal(origin.lat, origin.lng, 100, origin);

    expect(result.x).toBeCloseTo(0, 6);
    expect(result.y).toBe(100);
    expect(result.z).toBeCloseTo(0, 6);
  });

  it('should map 1 degree east at equator to ~111km on X', () => {
    const equatorOrigin: GeoCoordinates = { lat: 0, lng: 0 };
    const result = geoToLocal(0, 1, 0, equatorOrigin);

    const expectedMeters = (Math.PI / 180) * EARTH_RADIUS; // ~111,319m
    expect(result.x).toBeCloseTo(expectedMeters, 0);
    expect(result.y).toBe(0);
    expect(result.z).toBeCloseTo(0, 6);
  });

  it('should map 1 degree north to negative Z (~-111km)', () => {
    const equatorOrigin: GeoCoordinates = { lat: 0, lng: 0 };
    const result = geoToLocal(1, 0, 0, equatorOrigin);

    const expectedMeters = (Math.PI / 180) * EARTH_RADIUS;
    // Z = south, so north = negative Z
    expect(result.z).toBeCloseTo(-expectedMeters, 0);
    expect(result.x).toBeCloseTo(0, 6);
  });

  it('should produce correct offsets for Paris coordinates', () => {
    // Point ~100m east and ~100m north of origin
    const dLng =
      100 /
      ((Math.PI / 180) * EARTH_RADIUS * Math.cos((origin.lat * Math.PI) / 180));
    const dLat = 100 / ((Math.PI / 180) * EARTH_RADIUS);

    const result = geoToLocal(origin.lat + dLat, origin.lng + dLng, 35, origin);

    expect(result.x).toBeCloseTo(100, 0);
    expect(result.y).toBe(35);
    expect(result.z).toBeCloseTo(-100, 0);
  });

  it('should have anti-symmetric horizontal components: geoToLocal(A,B) ≈ -geoToLocal(B,A)', () => {
    const a: GeoCoordinates = { lat: 48.853, lng: 2.3499 };
    const b: GeoCoordinates = { lat: 48.86, lng: 2.355 };

    const ab = geoToLocal(b.lat, b.lng, 0, a);
    const ba = geoToLocal(a.lat, a.lng, 0, b);

    // X and Z should be approximately negated (not exact due to cos(lat) difference)
    expect(ab.x).toBeCloseTo(-ba.x, 0);
    expect(ab.z).toBeCloseTo(-ba.z, 0);
  });

  it('should shrink X distances at higher latitudes', () => {
    const equator: GeoCoordinates = { lat: 0, lng: 0 };
    const paris: GeoCoordinates = { lat: 48.853, lng: 0 };

    const atEquator = geoToLocal(0, 1, 0, equator);
    const atParis = geoToLocal(48.853, 1, 0, paris);

    // 1 degree of longitude should be smaller at Paris than at equator
    expect(Math.abs(atParis.x)).toBeLessThan(Math.abs(atEquator.x));
    // Ratio should be approximately cos(48.853°)
    const ratio = Math.abs(atParis.x) / Math.abs(atEquator.x);
    expect(ratio).toBeCloseTo(Math.cos((48.853 * Math.PI) / 180), 3);
  });

  it('should not affect Y when horizontal position changes', () => {
    const result1 = geoToLocal(48.86, 2.36, 50, origin);
    const result2 = geoToLocal(48.87, 2.37, 50, origin);

    expect(result1.y).toBe(50);
    expect(result2.y).toBe(50);
  });
});

describe('getTileCoordinatesFromGeo', () => {
  it('should return correct tile for Paris at zoom 15', () => {
    // Paris (48.853, 2.3499) at zoom 15 — verify against Slippy Map formula
    const tile = getTileCoordinatesFromGeo({ lat: 48.853, lng: 2.3499 }, 15);

    expect(tile.z).toBe(15);
    expect(tile.x).toBe(16597);
    expect(tile.y).toBe(11273);
  });

  it('should return center tile for (0,0) at any zoom', () => {
    const tile = getTileCoordinatesFromGeo({ lat: 0, lng: 0 }, 13);
    const n = Math.pow(2, 13);

    expect(tile.x).toBe(n / 2);
    expect(tile.y).toBe(n / 2);
  });

  it('should produce higher tile indices at higher zoom levels', () => {
    const paris: GeoCoordinates = { lat: 48.853, lng: 2.3499 };
    const tile10 = getTileCoordinatesFromGeo(paris, 10);
    const tile15 = getTileCoordinatesFromGeo(paris, 15);

    expect(tile15.x).toBeGreaterThan(tile10.x);
    expect(tile15.y).toBeGreaterThan(tile10.y);
  });

  it('should match the Mercator-based getTileCoordinates for Paris', () => {
    // Cross-check: Drone.latLonToMercator(48.853, 2.3499) gives Mercator coords
    // then getTileCoordinates(mercator, 15) should give same tile
    const earthRadius = 6378137;
    const lat = 48.853;
    const lon = 2.3499;
    const mx = ((lon * Math.PI) / 180) * earthRadius;
    const my = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) * earthRadius;
    const maxExtent = earthRadius * Math.PI;
    const n = Math.pow(2, 15);
    const expectedX = Math.floor(((mx + maxExtent) / (2 * maxExtent)) * n);
    const expectedY = Math.floor(((maxExtent - my) / (2 * maxExtent)) * n);

    const tile = getTileCoordinatesFromGeo({ lat, lng: lon }, 15);

    expect(tile.x).toBe(expectedX);
    expect(tile.y).toBe(expectedY);
  });
});

describe('getTileGeoBounds', () => {
  it('should return minLat < maxLat and minLng < maxLng', () => {
    const bounds = getTileGeoBounds({ z: 15, x: 16596, y: 11273 });

    expect(bounds.minLat).toBeLessThan(bounds.maxLat);
    expect(bounds.minLng).toBeLessThan(bounds.maxLng);
  });

  it('should contain the center of the tile from getTileCoordinatesFromGeo', () => {
    const paris: GeoCoordinates = { lat: 48.853, lng: 2.3499 };
    const tile = getTileCoordinatesFromGeo(paris, 15);
    const bounds = getTileGeoBounds(tile);

    expect(paris.lat).toBeGreaterThanOrEqual(bounds.minLat);
    expect(paris.lat).toBeLessThanOrEqual(bounds.maxLat);
    expect(paris.lng).toBeGreaterThanOrEqual(bounds.minLng);
    expect(paris.lng).toBeLessThanOrEqual(bounds.maxLng);
  });

  it('should have adjacent tiles share boundaries (same row, consecutive columns)', () => {
    const bounds1 = getTileGeoBounds({ z: 15, x: 16596, y: 11273 });
    const bounds2 = getTileGeoBounds({ z: 15, x: 16597, y: 11273 });

    expect(bounds1.maxLng).toBeCloseTo(bounds2.minLng, 10);
  });

  it('should have adjacent tiles share boundaries (same column, consecutive rows)', () => {
    const bounds1 = getTileGeoBounds({ z: 15, x: 16596, y: 11273 });
    const bounds2 = getTileGeoBounds({ z: 15, x: 16596, y: 11274 });

    // Row 11273 is north of row 11274, so bounds1.minLat === bounds2.maxLat
    expect(bounds1.minLat).toBeCloseTo(bounds2.maxLat, 10);
  });

  it('should produce larger bounds at lower zoom levels', () => {
    const boundsZ10 = getTileGeoBounds({ z: 10, x: 519, y: 352 });
    const boundsZ15 = getTileGeoBounds({ z: 15, x: 16596, y: 11273 });

    const widthZ10 = boundsZ10.maxLng - boundsZ10.minLng;
    const widthZ15 = boundsZ15.maxLng - boundsZ15.minLng;

    expect(widthZ10).toBeGreaterThan(widthZ15);
  });

  it('zoom 0 tile (0,0) should cover the whole world longitude', () => {
    const bounds = getTileGeoBounds({ z: 0, x: 0, y: 0 });

    expect(bounds.minLng).toBeCloseTo(-180, 5);
    expect(bounds.maxLng).toBeCloseTo(180, 5);
  });
});
