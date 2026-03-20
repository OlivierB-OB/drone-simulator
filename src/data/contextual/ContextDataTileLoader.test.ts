import { describe, it, expect } from 'vitest';
import { classifyOvertureBuilding } from '../../features/building/overtureClassify';
import { classifyOvertureRoad } from '../../features/road/overtureClassify';
import { classifyOvertureRailway } from '../../features/railway/overtureClassify';
import { classifyOvertureWater } from '../../features/water/overtureClassify';
import { classifyOvertureAeroway } from '../../features/aeroway/overtureClassify';
import { classifyOvertureVegetation } from '../../features/vegetation/overtureClassify';
import { classifyOvertureLanduse } from '../../features/landuse/overtureClassify';
import { classifyOvertureBarrier } from '../../features/barrier/overtureClassify';
import { classifyOvertureStructure } from '../../features/structure/overtureClassify';
import { polygon, lineString, point } from '@turf/helpers';

describe('Overture classify functions', () => {
  it('classifies buildings with visual properties', () => {
    const geom = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]).geometry;

    const building = classifyOvertureBuilding(
      'b1',
      { class: 'residential', height: 10, num_floors: 3 },
      geom
    );

    expect(building.type).toBe('residential');
    expect(building.height).toBe(10);
    expect(building.levelCount).toBe(3);
    expect(building.color).toBeDefined();
    expect(building.isPart).toBe(false);
  });

  it('classifies building parts', () => {
    const geom = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]).geometry;

    const part = classifyOvertureBuilding(
      'bp1',
      { class: 'commercial', height: 20 },
      geom,
      true
    );

    expect(part.isPart).toBe(true);
    expect(part.height).toBe(20);
  });

  it('classifies buildings without height (uses defaults)', () => {
    const geom = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]).geometry;

    const building = classifyOvertureBuilding('b2', { class: 'yes' }, geom);

    expect(building.height).toBeUndefined();
    expect(building.levelCount).toBeUndefined();
  });

  it('classifies roads with correct widthMeters', () => {
    const geom = lineString([
      [0, 0],
      [1, 1],
    ]).geometry;

    const road = classifyOvertureRoad(
      'r1',
      { class: 'primary', lanes: 2, surface: 'asphalt' },
      geom
    )[0]!;

    expect(road.type).toBe('primary');
    expect(road.laneCount).toBe(2);
    expect(road.widthMeters).toBe(15);
    expect(road.surfaceColor).toBe('#777060');
    expect(road.color).toBeDefined();
  });

  it('classifies footways with narrow width', () => {
    const geom = lineString([
      [0, 0],
      [1, 1],
    ]).geometry;

    const footway = classifyOvertureRoad('r2', { class: 'footway' }, geom)[0]!;

    expect(footway.type).toBe('footway');
    expect(footway.widthMeters).toBe(2);
  });

  it('classifies railways with track specs', () => {
    const geom = lineString([
      [0, 0],
      [1, 1],
    ]).geometry;

    const railway = classifyOvertureRailway(
      'rw1',
      { class: 'light_rail' },
      geom
    )[0]!;

    expect(railway.type).toBe('light_rail');
    expect(railway.widthMeters).toBe(3);
    expect(railway.dash).toEqual([4, 3]);
    expect(railway.color).toBeDefined();
  });

  it('classifies water areas', () => {
    const geom = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]).geometry;

    const lake = classifyOvertureWater('w1', { class: 'lake' }, geom);

    expect(lake.type).toBe('lake');
    expect(lake.isArea).toBe(true);
    expect(lake.color).toBeDefined();
  });

  it('classifies waterways as lines', () => {
    const geom = lineString([
      [0, 0],
      [1, 1],
    ]).geometry;

    const river = classifyOvertureWater('w2', { class: 'river' }, geom);

    expect(river.type).toBe('river');
    expect(river.isArea).toBe(false);
    expect(river.widthMeters).toBe(20);
  });

  it('classifies aeroway features', () => {
    const geom = point([0, 0]).geometry;

    const airport = classifyOvertureAeroway('a1', { class: 'aerodrome' }, geom);

    expect(airport.type).toBe('aerodrome');
    expect(airport.color).toBeDefined();
  });

  it('classifies vegetation with height category', () => {
    const geom = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]).geometry;

    const forest = classifyOvertureVegetation(
      'v1',
      { class: 'forest', height: 25 },
      geom
    );

    expect(forest.type).toBe('forest');
    expect(forest.heightCategory).toBe('tall');
    expect(forest.color).toBeDefined();
  });

  it('classifies landuse features', () => {
    const geom = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]).geometry;

    const landuse = classifyOvertureLanduse(
      'l1',
      { class: 'residential' },
      geom
    );

    expect(landuse.type).toBe('residential');
    expect(landuse.color).toBeDefined();
  });

  it('classifies buildings with facade_material color', () => {
    const geom = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]).geometry;

    const building = classifyOvertureBuilding(
      'b3',
      { class: 'residential', facade_material: 'brick' },
      geom
    );

    expect(building.color).toBe('#c87060');
  });

  it('prefers facade_color over facade_material', () => {
    const geom = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]).geometry;

    const building = classifyOvertureBuilding(
      'b4',
      {
        class: 'residential',
        facade_color: '#ff0000',
        facade_material: 'brick',
      },
      geom
    );

    expect(building.color).toBe('#ff0000');
  });

  it('extracts has_parts from building properties', () => {
    const geom = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]).geometry;

    const building = classifyOvertureBuilding(
      'b5',
      { class: 'commercial', has_parts: true },
      geom
    );

    expect(building.hasParts).toBe(true);
  });

  it('classifies roads with road_surface property', () => {
    const geom = lineString([
      [0, 0],
      [1, 1],
    ]).geometry;

    const road = classifyOvertureRoad(
      'r3',
      { class: 'primary', road_surface: 'asphalt' },
      geom
    )[0]!;

    expect(road.surfaceColor).toBe('#777060');
  });

  it('returns empty array for fully-tunnelled road (road_flags)', () => {
    const geom = lineString([
      [0, 0],
      [1, 0],
    ]).geometry;

    const roads = classifyOvertureRoad(
      'r4',
      { class: 'primary', road_flags: '[{"values":["is_tunnel"]}]' },
      geom
    );

    expect(roads).toHaveLength(0);
  });

  it('returns cropped geometry for partial road tunnel (road_flags with between)', () => {
    const geom = lineString([
      [0, 0],
      [0.5, 0],
      [1, 0],
    ]).geometry;

    // Tunnel covers the last 70% — only first 30% should remain
    const roads = classifyOvertureRoad(
      'r5',
      {
        class: 'primary',
        road_flags: '[{"values":["is_tunnel"],"between":[0.3,1.0]}]',
      },
      geom
    );

    expect(roads).toHaveLength(1);
    const road0 = roads[0]!;
    const endX =
      road0.geometry.coordinates[road0.geometry.coordinates.length - 1]![0];
    expect(endX).toBeLessThan(0.5);
  });

  it('returns empty array for fully-tunnelled railway (rail_flags)', () => {
    const geom = lineString([
      [0, 0],
      [1, 0],
    ]).geometry;

    const railways = classifyOvertureRailway(
      'rw2',
      { class: 'rail', rail_flags: '[{"values":["is_tunnel"]}]' },
      geom
    );

    expect(railways).toHaveLength(0);
  });

  it('returns empty array for fully-underground road (level_rules)', () => {
    const geom = lineString([
      [0, 0],
      [1, 0],
    ]).geometry;

    const roads = classifyOvertureRoad(
      'r-lr1',
      { class: 'primary', level_rules: [{ level: -1 }] },
      geom
    );

    expect(roads).toHaveLength(0);
  });

  it('returns first half when level_rules marks second half underground', () => {
    const geom = lineString([
      [0, 0],
      [0.5, 0],
      [1, 0],
    ]).geometry;

    const roads = classifyOvertureRoad(
      'r-lr2',
      { class: 'primary', level_rules: [{ level: -1, between: [0.5, 1.0] }] },
      geom
    );

    expect(roads).toHaveLength(1);
    const endX =
      roads[0]!.geometry.coordinates[
        roads[0]!.geometry.coordinates.length - 1
      ]![0];
    expect(endX).toBeLessThan(0.6);
  });

  it('combines is_tunnel and negative level_rules as union exclusion', () => {
    const geom = lineString([
      [0, 0],
      [0.5, 0],
      [1, 0],
    ]).geometry;

    // road_flags covers [0, 0.4], level_rules covers [0.3, 1.0] — union is [0, 1]
    const roads = classifyOvertureRoad(
      'r-lr3',
      {
        class: 'primary',
        road_flags: '[{"values":["is_tunnel"],"between":[0.0,0.4]}]',
        level_rules: [{ level: -1, between: [0.3, 1.0] }],
      },
      geom
    );

    expect(roads).toHaveLength(0);
  });

  it('returns empty array for fully-underground railway (level_rules)', () => {
    const geom = lineString([
      [0, 0],
      [1, 0],
    ]).geometry;

    const railways = classifyOvertureRailway(
      'rw-lr1',
      { class: 'rail', level_rules: [{ level: -2 }] },
      geom
    );

    expect(railways).toHaveLength(0);
  });

  it('extracts is_intermittent for water', () => {
    const geom = lineString([
      [0, 0],
      [1, 1],
    ]).geometry;

    const water = classifyOvertureWater(
      'w3',
      { class: 'stream', is_intermittent: true },
      geom
    );

    expect(water.intermittent).toBe(true);
  });

  it('classifies barriers from infrastructure classes', () => {
    const geom = lineString([
      [0, 0],
      [1, 1],
    ]).geometry;

    const barrier = classifyOvertureBarrier('bar1', { class: 'wall' }, geom);

    expect(barrier).not.toBeNull();
    expect(barrier!.type).toBe('wall');
    expect(barrier!.width).toBe(0.3);
    expect(barrier!.color).toBeDefined();
  });

  it('returns null for unknown barrier classes', () => {
    const geom = lineString([
      [0, 0],
      [1, 1],
    ]).geometry;

    const barrier = classifyOvertureBarrier('bar2', { class: 'fence' }, geom);

    expect(barrier).toBeNull();
  });

  it('classifies structures from infrastructure classes', () => {
    const geom = point([0, 0]).geometry;

    const structure = classifyOvertureStructure(
      'str1',
      { class: 'tower' },
      geom
    );

    expect(structure).not.toBeNull();
    expect(structure!.type).toBe('tower');
    expect(structure!.color).toBeDefined();
  });

  it('extracts height for structures', () => {
    const geom = point([0, 0]).geometry;

    const structure = classifyOvertureStructure(
      'str2',
      { class: 'chimney', height: 50 },
      geom
    );

    expect(structure).not.toBeNull();
    expect(structure!.height).toBe(50);
  });

  it('returns null for unknown structure classes', () => {
    const geom = point([0, 0]).geometry;

    const structure = classifyOvertureStructure(
      'str3',
      { class: 'bench' },
      geom
    );

    expect(structure).toBeNull();
  });

  it('extracts 3D attributes from JSON string source_tags', () => {
    const geom = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]).geometry;

    const veg = classifyOvertureVegetation(
      'v-st1',
      {
        class: 'forest',
        source_tags: JSON.stringify({
          leaf_type: 'broadleaved',
          leaf_cycle: 'deciduous',
          diameter_crown: '8.5',
          circumference: '3.2',
        }),
      },
      geom
    );

    expect(veg.leafType).toBe('broadleaved');
    expect(veg.leafCycle).toBe('deciduous');
    expect(veg.crownDiameter).toBe(8.5);
    expect(veg.trunkCircumference).toBe(3.2);
  });

  it('extracts 3D attributes from object source_tags', () => {
    const geom = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]).geometry;

    const veg = classifyOvertureVegetation(
      'v-st2',
      {
        class: 'tree',
        source_tags: { leaf_type: 'needleleaved', circumference: '2.1' },
      },
      geom
    );

    expect(veg.leafType).toBe('needleleaved');
    expect(veg.leafCycle).toBeUndefined();
    expect(veg.crownDiameter).toBeUndefined();
    expect(veg.trunkCircumference).toBe(2.1);
  });

  it('handles missing source_tags without crashing', () => {
    const geom = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]).geometry;

    const veg = classifyOvertureVegetation('v-st3', { class: 'grass' }, geom);

    expect(veg.leafType).toBeUndefined();
    expect(veg.leafCycle).toBeUndefined();
    expect(veg.crownDiameter).toBeUndefined();
    expect(veg.trunkCircumference).toBeUndefined();
  });

  it('handles invalid JSON string source_tags gracefully', () => {
    const geom = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]).geometry;

    const veg = classifyOvertureVegetation(
      'v-st4',
      { class: 'scrub', source_tags: '{not valid json' },
      geom
    );

    expect(veg.leafType).toBeUndefined();
    expect(veg.crownDiameter).toBeUndefined();
  });

  it('handles non-numeric diameter_crown gracefully', () => {
    const geom = polygon([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]).geometry;

    const veg = classifyOvertureVegetation(
      'v-st5',
      {
        class: 'tree',
        source_tags: { diameter_crown: 'wide', leaf_type: 'broadleaved' },
      },
      geom
    );

    expect(veg.crownDiameter).toBeUndefined();
    expect(veg.leafType).toBe('broadleaved');
  });
});
