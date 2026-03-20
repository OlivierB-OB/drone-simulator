import type { TileCoordinates } from '../data/elevation/types';

export interface GeoCoordinates {
  lat: number; // degrees, WGS84
  lng: number; // degrees, WGS84
}

export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export const EARTH_RADIUS = 6_378_137; // meters (WGS84)

const TO_RAD = Math.PI / 180;

/**
 * Projects geographic coordinates onto a local tangent plane centered at `origin`.
 * Local frame: X = east, Y = up, Z = south (matches Three.js convention).
 */
export function geoToLocal(
  lat: number,
  lng: number,
  elevation: number,
  origin: GeoCoordinates
): { x: number; y: number; z: number } {
  const cosOriginLat = Math.cos(origin.lat * TO_RAD);

  return {
    x: (lng - origin.lng) * TO_RAD * EARTH_RADIUS * cosOriginLat,
    y: elevation,
    z: -(lat - origin.lat) * TO_RAD * EARTH_RADIUS,
  };
}

/**
 * Converts lat/lng to Web Mercator tile z/x/y (standard Slippy Map formula).
 * Mercator math is internal -- callers only need lat/lng.
 */
export function getTileCoordinatesFromGeo(
  geo: GeoCoordinates,
  zoomLevel: number
): TileCoordinates {
  const n = Math.pow(2, zoomLevel);
  const x = ((geo.lng + 180) / 360) * n;
  const latRad = geo.lat * TO_RAD;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

  return {
    z: zoomLevel,
    x: Math.floor(x),
    y: Math.floor(y),
  };
}

/**
 * Returns the lat/lng bounds of a tile (inverse of getTileCoordinatesFromGeo).
 */
export function getTileGeoBounds(tile: TileCoordinates): GeoBounds {
  const n = Math.pow(2, tile.z);

  const minLng = (tile.x / n) * 360 - 180;
  const maxLng = ((tile.x + 1) / n) * 360 - 180;

  // tile.y is top edge (north), tile.y+1 is bottom edge (south)
  const maxLat =
    Math.atan(Math.sinh(Math.PI * (1 - (2 * tile.y) / n))) / TO_RAD;
  const minLat =
    Math.atan(Math.sinh(Math.PI * (1 - (2 * (tile.y + 1)) / n))) / TO_RAD;

  return { minLat, maxLat, minLng, maxLng };
}
