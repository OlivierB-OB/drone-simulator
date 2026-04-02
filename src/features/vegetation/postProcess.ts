import type { Polygon, MultiPolygon } from 'geojson';
import { area } from '@turf/area';
import { buffer } from '@turf/buffer';
import { difference } from '@turf/difference';
import { booleanIntersects } from '@turf/boolean-intersects';
import { feature, featureCollection } from '@turf/helpers';
import type { ModulesFeatures } from '../registrationTypes';
import type { VegetationVisual } from './types';

const QUALIFYING_LANDUSE_TYPES = new Set([
  'grassland',
  'meadow',
  'park',
  'recreation_ground',
  'plant_nursery',
  'grass',
  'farmland',
  'cemetery',
  'sand',
  'beach',
  'dune',
  'bare_rock',
  'scree',
  'mud',
  'glacier',
  'snow',
]);

function buildStaticBlockers(features: ModulesFeatures): Polygon[] {
  const blockers: Polygon[] = [];

  for (const b of features.buildings) {
    if (b.geometry.type === 'Polygon' && !b.isPart) {
      blockers.push(b.geometry);
    }
  }

  for (const w of features.waters) {
    if (w.isArea && w.geometry.type === 'Polygon') {
      blockers.push(w.geometry);
    } else if (!w.isArea && w.geometry.type === 'LineString') {
      const buf = buffer(feature(w.geometry), w.widthMeters / 2, {
        units: 'meters',
      });
      if (buf?.geometry.type === 'Polygon') blockers.push(buf.geometry);
    }
  }

  for (const r of features.roads) {
    const buf = buffer(feature(r.geometry), r.widthMeters / 2, {
      units: 'meters',
    });
    if (buf?.geometry.type === 'Polygon') blockers.push(buf.geometry);
  }

  for (const r of features.railways) {
    const buf = buffer(feature(r.geometry), r.widthMeters / 2, {
      units: 'meters',
    });
    if (buf?.geometry.type === 'Polygon') blockers.push(buf.geometry);
  }

  return blockers;
}

function applyDifferences(
  geom: Polygon | MultiPolygon,
  blockers: Polygon[]
): Polygon | MultiPolygon | null {
  let current: Polygon | MultiPolygon = geom;
  for (const blocker of blockers) {
    if (!booleanIntersects(feature(current), feature(blocker))) continue;
    const result = difference(
      featureCollection([feature(current), feature(blocker)])
    );
    if (!result) return null;
    current = result.geometry;
  }
  return current;
}

function toPolygons(geom: Polygon | MultiPolygon): Polygon[] {
  if (geom.type === 'Polygon') return [geom];
  return geom.coordinates.map((coords) => ({
    type: 'Polygon',
    coordinates: coords,
  }));
}

export function postProcessVegetation(features: ModulesFeatures): void {
  const staticBlockers = buildStaticBlockers(features);

  const vegAreas = new Map<string, number>();
  for (const veg of features.vegetation) {
    if (veg.geometry.type === 'Polygon') {
      vegAreas.set(veg.id, area(feature(veg.geometry)));
    }
  }

  const result: VegetationVisual[] = [];

  for (const veg of features.vegetation) {
    if (veg.geometry.type !== 'Polygon') {
      result.push(veg);
      continue;
    }

    const vegArea = vegAreas.get(veg.id)!;

    const smallerVeg = features.vegetation
      .filter((v) => v.geometry.type === 'Polygon' && v.id !== veg.id)
      .filter((v) => (vegAreas.get(v.id) ?? 0) < vegArea)
      .map((v) => v.geometry as Polygon);

    const qualifyingLanduse = features.landuse
      .filter((l) => QUALIFYING_LANDUSE_TYPES.has(l.type) && l.area < vegArea)
      .map((l) => l.geometry);

    const allBlockers = [
      ...staticBlockers,
      ...smallerVeg,
      ...qualifyingLanduse,
    ];

    const resultGeom = applyDifferences(veg.geometry, allBlockers);
    if (!resultGeom) continue;

    const polygons = toPolygons(resultGeom);
    polygons.forEach((poly, i) => {
      const id = polygons.length === 1 ? veg.id : `${veg.id}_part_${i}`;
      result.push({ ...veg, id, geometry: poly });
    });
  }

  features.vegetation = result;
}
