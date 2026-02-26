import { describe, it, expect } from 'vitest';
import { Group, Mesh } from 'three';
import { BuildingMeshFactory } from './BuildingMeshFactory';
import type { ElevationSampler } from '../util/ElevationSampler';
import type { BuildingVisual, Polygon } from '../../../data/contextual/types';

// Simple rectangle polygon for testing
const rectanglePolygon: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [100, 50],
      [120, 50],
      [120, 60],
      [100, 60],
      [100, 50],
    ],
  ],
};

const mockElevation: ElevationSampler = {
  sampleAt: () => 0,
} as unknown as ElevationSampler;

function makeBuilding(overrides: Partial<BuildingVisual> = {}): BuildingVisual {
  return {
    id: 'test-1',
    geometry: rectanglePolygon,
    type: 'house',
    height: 10,
    color: '#d0ccbc',
    ...overrides,
  };
}

describe('BuildingMeshFactory', () => {
  const factory = new BuildingMeshFactory(mockElevation);

  it('creates a single Mesh for flat roof (default)', () => {
    const result = factory.create([makeBuilding()]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Mesh);
    expect(result[0]).not.toBeInstanceOf(Group);
  });

  it('creates a single Mesh for explicit flat roof', () => {
    const result = factory.create([makeBuilding({ roofShape: 'flat' })]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Mesh);
  });

  it('creates a Group for gabled roof', () => {
    const result = factory.create([makeBuilding({ roofShape: 'gabled' })]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Group);
    const group = result[0] as Group;
    expect(group.children).toHaveLength(2); // wall mesh + roof mesh
  });

  it('creates a Group for hipped roof', () => {
    const result = factory.create([makeBuilding({ roofShape: 'hipped' })]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Group);
  });

  it('creates a Group for pyramidal roof', () => {
    const result = factory.create([makeBuilding({ roofShape: 'pyramidal' })]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Group);
  });

  it('creates a Group for dome roof', () => {
    const result = factory.create([makeBuilding({ roofShape: 'dome' })]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Group);
  });

  it('reduces wall height when roofHeight is provided', () => {
    const building = makeBuilding({
      height: 10,
      roofHeight: 3,
      roofShape: 'gabled',
    });
    const result = factory.create([building]);
    expect(result).toHaveLength(1);
    const group = result[0] as Group;
    // Roof mesh should be positioned at wallHeight = 10 - 3 = 7
    const roofMesh = group.children[1]!;
    expect(roofMesh.position.y).toBeCloseTo(7, 1);
  });

  it('clamps roofHeight to leave at least 1m wall', () => {
    const building = makeBuilding({
      height: 5,
      roofHeight: 6, // more than total height
      roofShape: 'gabled',
    });
    const result = factory.create([building]);
    expect(result).toHaveLength(1);
    const group = result[0] as Group;
    // roofHeight should be clamped so wall is at least 1m
    const roofMesh = group.children[1]!;
    // wallHeight = 5 - clampedRoofHeight, with extrudeDepth >= 1
    expect(roofMesh.position.y).toBeGreaterThanOrEqual(1);
  });

  it('skips buildings with degenerate polygons', () => {
    const degenerate: Polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [0, 0],
        ],
      ],
    };
    const result = factory.create([makeBuilding({ geometry: degenerate })]);
    expect(result).toHaveLength(0);
  });

  it('skips non-polygon geometries', () => {
    const result = factory.create([
      makeBuilding({
        geometry: { type: 'Point', coordinates: [0, 0] } as never,
      }),
    ]);
    expect(result).toHaveLength(0);
  });

  it('skips parent buildings when hasParts is true', () => {
    const parent = makeBuilding({
      id: 'parent-1',
      isPart: false,
      hasParts: true,
    });
    const result = factory.create([parent]);
    expect(result).toHaveLength(0);
  });

  it('renders building parts regardless of hasParts on other buildings', () => {
    const part = makeBuilding({ id: 'part-1', isPart: true });
    const result = factory.create([part]);
    expect(result).toHaveLength(1);
  });

  it('uses default roof height when roofShape is set but roofHeight is absent', () => {
    const building = makeBuilding({
      height: 10,
      roofShape: 'gabled',
      // no roofHeight
    });
    const result = factory.create([building]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Group);
    const group = result[0] as Group;
    // Roof mesh position should be less than total height (some portion used for roof)
    expect(group.children[1]!.position.y).toBeLessThan(10);
    expect(group.children[1]!.position.y).toBeGreaterThan(0);
  });
});
