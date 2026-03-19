import { describe, it, expect } from 'vitest';
import { classifyOvertureBuilding } from '../../features/building/overtureClassify';
import { classifyOvertureRoad } from '../../features/road/overtureClassify';
import { classifyOvertureRailway } from '../../features/railway/overtureClassify';
import { classifyOvertureWater } from '../../features/water/overtureClassify';
import { classifyOvertureAeroway } from '../../features/aeroway/overtureClassify';
import { classifyOvertureVegetation } from '../../features/vegetation/overtureClassify';
import { classifyOvertureLanduse } from '../../features/landuse/overtureClassify';
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
    );

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

    const footway = classifyOvertureRoad('r2', { class: 'footway' }, geom);

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
    );

    expect(railway.type).toBe('light_rail');
    expect(railway.trackCount).toBeDefined();
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
});
