import { describe, it, expect } from 'vitest';
import { OvertureParser } from './OvertureParser';
import type { VectorTileLayer, VectorTileFeature } from '@mapbox/vector-tile';
import type { DecodedTile } from './PMTilesReader';
import type { MercatorBounds, TileCoordinates } from '../../elevation/types';

const bounds: MercatorBounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };
const coords: TileCoordinates = { z: 15, x: 100, y: 100 };

function mockFeature(
  type: 1 | 2 | 3,
  rawGeom: { x: number; y: number }[][],
  properties: Record<string, unknown> = {}
): VectorTileFeature {
  return {
    type,
    extent: 4096,
    loadGeometry: () => rawGeom,
    properties,
  } as unknown as VectorTileFeature;
}

function mockLayer(features: VectorTileFeature[]): VectorTileLayer {
  return {
    length: features.length,
    feature: (i: number) => features[i]!,
  } as unknown as VectorTileLayer;
}

const SQUARE = [
  { x: 0, y: 0 },
  { x: 4096, y: 0 },
  { x: 4096, y: 4096 },
  { x: 0, y: 4096 },
  { x: 0, y: 0 },
];

const LINE = [
  { x: 0, y: 0 },
  { x: 4096, y: 4096 },
];

describe('OvertureParser', () => {
  it('routes building layer to buildings array', () => {
    const layers: DecodedTile = new Map([
      [
        'building',
        mockLayer([mockFeature(3, [SQUARE], { class: 'residential' })]),
      ],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.buildings).toHaveLength(1);
    expect(features.buildings[0]!.type).toBe('residential');
    expect(features.buildings[0]!.isPart).toBe(false);
  });

  it('routes building_part layer with isPart=true', () => {
    const layers: DecodedTile = new Map([
      [
        'building_part',
        mockLayer([mockFeature(3, [SQUARE], { class: 'commercial' })]),
      ],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.buildings).toHaveLength(1);
    expect(features.buildings[0]!.isPart).toBe(true);
  });

  it('routes segment layer to roads for non-rail classes', () => {
    const layers: DecodedTile = new Map([
      ['segment', mockLayer([mockFeature(2, [LINE], { class: 'primary' })])],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.roads).toHaveLength(1);
    expect(features.roads[0]!.type).toBe('primary');
    expect(features.railways).toHaveLength(0);
  });

  it('routes segment layer to railways for rail classes', () => {
    const layers: DecodedTile = new Map([
      ['segment', mockLayer([mockFeature(2, [LINE], { class: 'rail' })])],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.railways).toHaveLength(1);
    expect(features.roads).toHaveLength(0);
  });

  it('routes land_use layer to landuse array', () => {
    const layers: DecodedTile = new Map([
      [
        'land_use',
        mockLayer([mockFeature(3, [SQUARE], { class: 'residential' })]),
      ],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.landuse).toHaveLength(1);
    expect(features.landuse[0]!.type).toBe('residential');
  });

  it('routes land layer vegetation subtypes to vegetation', () => {
    const layers: DecodedTile = new Map([
      [
        'land',
        mockLayer([
          mockFeature(3, [SQUARE], { class: 'forest', subtype: 'forest' }),
        ]),
      ],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.vegetation).toHaveLength(1);
    expect(features.landuse).toHaveLength(0);
  });

  it('routes land layer non-vegetation subtypes to landuse', () => {
    const layers: DecodedTile = new Map([
      [
        'land',
        mockLayer([
          mockFeature(3, [SQUARE], { class: 'sand', subtype: 'sand' }),
        ]),
      ],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.landuse).toHaveLength(1);
    expect(features.vegetation).toHaveLength(0);
  });

  it('routes land_cover layer to vegetation', () => {
    const layers: DecodedTile = new Map([
      ['land_cover', mockLayer([mockFeature(3, [SQUARE], { class: 'scrub' })])],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.vegetation).toHaveLength(1);
  });

  it('routes infrastructure aeroway classes to airports', () => {
    const layers: DecodedTile = new Map([
      [
        'infrastructure',
        mockLayer([mockFeature(3, [SQUARE], { class: 'aerodrome' })]),
      ],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.airports).toHaveLength(1);
  });

  it('ignores infrastructure non-aeroway classes', () => {
    const layers: DecodedTile = new Map([
      [
        'infrastructure',
        mockLayer([mockFeature(3, [SQUARE], { class: 'power_plant' })]),
      ],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.airports).toHaveLength(0);
  });

  it('routes water layer to waters array', () => {
    const layers: DecodedTile = new Map([
      ['water', mockLayer([mockFeature(3, [SQUARE], { class: 'lake' })])],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.waters).toHaveLength(1);
    expect(features.waters[0]!.isArea).toBe(true);
  });

  it('handles multiple layers in one tile', () => {
    const layers: DecodedTile = new Map([
      ['building', mockLayer([mockFeature(3, [SQUARE], { class: 'office' })])],
      ['segment', mockLayer([mockFeature(2, [LINE], { class: 'secondary' })])],
      ['water', mockLayer([mockFeature(2, [LINE], { class: 'river' })])],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.buildings).toHaveLength(1);
    expect(features.roads).toHaveLength(1);
    expect(features.waters).toHaveLength(1);
  });

  it('handles empty tile', () => {
    const layers: DecodedTile = new Map();
    const features = OvertureParser.parse(layers, bounds, coords);

    expect(features.buildings).toHaveLength(0);
    expect(features.roads).toHaveLength(0);
    expect(features.railways).toHaveLength(0);
    expect(features.waters).toHaveLength(0);
    expect(features.airports).toHaveLength(0);
    expect(features.vegetation).toHaveLength(0);
    expect(features.landuse).toHaveLength(0);
  });

  it('skips features with null geometry', () => {
    // Point features in a polygon-only layer produce null geometry
    const layers: DecodedTile = new Map([
      [
        'land_use',
        mockLayer([mockFeature(1, [[{ x: 100, y: 100 }]], { class: 'park' })]),
      ],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    // Point geometry is not Polygon, so land_use skips it
    expect(features.landuse).toHaveLength(0);
  });

  it('routes land Point class=tree to vegetation', () => {
    const layers: DecodedTile = new Map([
      [
        'land',
        mockLayer([
          mockFeature(1, [[{ x: 2048, y: 2048 }]], { class: 'tree' }),
        ]),
      ],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.vegetation).toHaveLength(1);
    expect(features.vegetation[0]!.type).toBe('tree');
    expect(features.landuse).toHaveLength(0);
  });

  it('routes land LineString class=tree_row to vegetation', () => {
    const layers: DecodedTile = new Map([
      ['land', mockLayer([mockFeature(2, [LINE], { class: 'tree_row' })])],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.vegetation).toHaveLength(1);
    expect(features.vegetation[0]!.type).toBe('tree_row');
    expect(features.landuse).toHaveLength(0);
  });

  it('routes land Polygon class=tree with no vegetation subtype to landuse', () => {
    const layers: DecodedTile = new Map([
      ['land', mockLayer([mockFeature(3, [SQUARE], { class: 'tree' })])],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.landuse).toHaveLength(1);
    expect(features.vegetation).toHaveLength(0);
  });

  it('remaps land_cover Polygon class=tree to forest', () => {
    const layers: DecodedTile = new Map([
      ['land_cover', mockLayer([mockFeature(3, [SQUARE], { class: 'tree' })])],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.vegetation).toHaveLength(1);
    expect(features.vegetation[0]!.type).toBe('forest');
  });

  it('ignores unknown layer names', () => {
    const layers: DecodedTile = new Map([
      [
        'unknown_layer',
        mockLayer([mockFeature(3, [SQUARE], { class: 'foo' })]),
      ],
    ]);

    const features = OvertureParser.parse(layers, bounds, coords);
    expect(features.buildings).toHaveLength(0);
    expect(features.roads).toHaveLength(0);
  });
});
