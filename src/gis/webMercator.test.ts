import { describe, it, expect } from 'vitest';
import {
  getTileCoordinatesFromGeo,
  getTileGeoBounds,
  EARTH_RADIUS,
} from './GeoCoordinates';

describe('getTileCoordinatesFromGeo', () => {
  it('returns correct zoom level', () => {
    const tile = getTileCoordinatesFromGeo({ lat: 0, lng: 0 }, 13);
    expect(tile.z).toBe(13);
  });

  it('maps equator/prime meridian to center tiles', () => {
    const zoom = 13;
    const n = Math.pow(2, zoom);
    const tile = getTileCoordinatesFromGeo({ lat: 0, lng: 0 }, zoom);

    expect(tile.x).toBe(n / 2);
    expect(tile.y).toBe(n / 2);
  });

  it('converts Paris coordinates to expected tile at zoom 15', () => {
    const paris = { lat: 48.853, lng: 2.3499 };
    const tile = getTileCoordinatesFromGeo(paris, 15);

    expect(tile.z).toBe(15);
    expect(tile.x).toBeGreaterThan(Math.pow(2, 15) / 2); // east of prime meridian
    expect(tile.y).toBeLessThan(Math.pow(2, 15) / 2); // north of equator
  });

  it('higher zoom produces larger tile indices for the same location', () => {
    const paris = { lat: 48.853, lng: 2.3499 };
    const tile10 = getTileCoordinatesFromGeo(paris, 10);
    const tile13 = getTileCoordinatesFromGeo(paris, 13);

    expect(tile13.x).toBeGreaterThan(tile10.x);
    expect(tile13.y).toBeGreaterThan(tile10.y);
  });

  it('produces different tiles for clearly different locations', () => {
    const tile1 = getTileCoordinatesFromGeo({ lat: 0, lng: 0 }, 14);
    const tile2 = getTileCoordinatesFromGeo({ lat: 48, lng: 2 }, 14);

    expect(tile1).not.toEqual(tile2);
  });

  it('floors fractional tile positions', () => {
    const tile = getTileCoordinatesFromGeo({ lat: 48.8535, lng: 2.3501 }, 15);
    expect(tile.x).toBe(Math.floor(tile.x));
    expect(tile.y).toBe(Math.floor(tile.y));
  });
});

describe('getTileGeoBounds', () => {
  it('returns minLat < maxLat and minLng < maxLng', () => {
    const bounds = getTileGeoBounds({ z: 13, x: 4520, y: 3102 });

    expect(bounds.minLat).toBeLessThan(bounds.maxLat);
    expect(bounds.minLng).toBeLessThan(bounds.maxLng);
  });

  it('adjacent tiles (same row, consecutive columns) share a lng boundary', () => {
    const bounds1 = getTileGeoBounds({ z: 13, x: 4520, y: 3102 });
    const bounds2 = getTileGeoBounds({ z: 13, x: 4521, y: 3102 });

    expect(bounds1.maxLng).toBeCloseTo(bounds2.minLng, 10);
  });

  it('adjacent tiles (same column, consecutive rows) share a lat boundary', () => {
    const bounds1 = getTileGeoBounds({ z: 13, x: 4520, y: 3102 });
    const bounds2 = getTileGeoBounds({ z: 13, x: 4520, y: 3103 });

    expect(bounds1.minLat).toBeCloseTo(bounds2.maxLat, 10);
  });

  it('bounds are larger at lower zoom levels', () => {
    const boundsZ10 = getTileGeoBounds({ z: 10, x: 565, y: 388 });
    const boundsZ13 = getTileGeoBounds({ z: 13, x: 4520, y: 3102 });

    const widthZ10 = boundsZ10.maxLng - boundsZ10.minLng;
    const widthZ13 = boundsZ13.maxLng - boundsZ13.minLng;

    expect(widthZ10).toBeGreaterThan(widthZ13);
  });

  it('round-trip: coordinates → tile → bounds contains original coordinates', () => {
    const paris = { lat: 48.853, lng: 2.3499 };
    const zoom = 13;

    const tile = getTileCoordinatesFromGeo(paris, zoom);
    const bounds = getTileGeoBounds(tile);

    expect(paris.lat).toBeGreaterThanOrEqual(bounds.minLat);
    expect(paris.lat).toBeLessThan(bounds.maxLat);
    expect(paris.lng).toBeGreaterThanOrEqual(bounds.minLng);
    expect(paris.lng).toBeLessThan(bounds.maxLng);
  });
});

describe('EARTH_RADIUS', () => {
  it('is the standard WGS-84 semi-major axis in meters', () => {
    expect(EARTH_RADIUS).toBe(6378137);
  });
});
