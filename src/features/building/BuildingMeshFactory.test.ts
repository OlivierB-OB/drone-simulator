import { describe, it, expect } from 'vitest';
import { Group, Mesh } from 'three';
import { BuildingMeshFactory } from './BuildingMeshFactory';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import type { Polygon } from 'geojson';
import type { BuildingVisual } from './types';

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

// Small child polygon covering ~25% of parent
const smallChildPolygon: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [100, 50],
      [110, 50],
      [110, 55],
      [100, 55],
      [100, 50],
    ],
  ],
};

// Large child polygon covering ~95% of parent
const largeChildPolygon: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [100.5, 50.2],
      [119.5, 50.2],
      [119.5, 59.8],
      [100.5, 59.8],
      [100.5, 50.2],
    ],
  ],
};

const mockElevation: ElevationSampler = {
  sampleAt: () => 0,
} as unknown as ElevationSampler;

function makeSampler(
  fn: (lat: number, lng: number) => number
): ElevationSampler {
  return { sampleAt: fn } as unknown as ElevationSampler;
}

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
  const origin = { lat: 48.853, lng: 2.3499 };

  it('creates a single Mesh for flat roof (default)', () => {
    const result = factory.create([makeBuilding()], origin);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Mesh);
    expect(result[0]).not.toBeInstanceOf(Group);
  });

  it('creates a single Mesh for explicit flat roof', () => {
    const result = factory.create(
      [makeBuilding({ roofShape: 'flat' })],
      origin
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Mesh);
  });

  it('creates a Group for gabled roof', () => {
    const result = factory.create(
      [makeBuilding({ roofShape: 'gabled' })],
      origin
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Group);
    const group = result[0] as Group;
    expect(group.children).toHaveLength(2); // wall mesh + roof mesh
  });

  it('creates a Group for hipped roof', () => {
    const result = factory.create(
      [makeBuilding({ roofShape: 'hipped' })],
      origin
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Group);
  });

  it('creates a Group for pyramidal roof', () => {
    const result = factory.create(
      [makeBuilding({ roofShape: 'pyramidal' })],
      origin
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Group);
  });

  it('creates a Group for dome roof', () => {
    const result = factory.create(
      [makeBuilding({ roofShape: 'dome' })],
      origin
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Group);
  });

  it('reduces wall height when roofHeight is provided', () => {
    const building = makeBuilding({
      height: 10,
      roofHeight: 3,
      roofShape: 'gabled',
    });
    const result = factory.create([building], origin);
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
    const result = factory.create([building], origin);
    expect(result).toHaveLength(1);
    const group = result[0] as Group;
    // roofHeight should be clamped so wall is at least 1m
    const roofMesh = group.children[1]!;
    // wallHeight = 5 - clampedRoofHeight, with extrudeDepth >= 1
    expect(roofMesh.position.y).toBeGreaterThanOrEqual(1);
  });

  it('renders parent when children cover less than 90% area', () => {
    const child = makeBuilding({
      id: 'child-1',
      geometry: smallChildPolygon,
      isPart: true,
      parentId: 'parent-1',
    });
    const parent = makeBuilding({
      id: 'parent-1',
      isPart: false,
      hasParts: true,
      children: [child],
    });
    const result = factory.create([parent, child], origin);
    // parent + child = 2 meshes
    expect(result).toHaveLength(2);
  });

  it('skips parent when children cover 90% or more area', () => {
    const child = makeBuilding({
      id: 'child-1',
      geometry: largeChildPolygon,
      isPart: true,
      parentId: 'parent-1',
    });
    const parent = makeBuilding({
      id: 'parent-1',
      isPart: false,
      hasParts: true,
      children: [child],
    });
    const result = factory.create([parent, child], origin);
    // only child rendered
    expect(result).toHaveLength(1);
  });

  it('skips linked parts in flat iteration (rendered via parent)', () => {
    const part = makeBuilding({
      id: 'part-1',
      isPart: true,
      parentId: 'parent-1',
    });
    // Part alone in list without parent — should be skipped because parentId is set
    const result = factory.create([part], origin);
    expect(result).toHaveLength(0);
  });

  it('renders orphan parts normally', () => {
    const part = makeBuilding({ id: 'part-1', isPart: true });
    const result = factory.create([part], origin);
    expect(result).toHaveLength(1);
  });

  it('uses default roof height when roofShape is set but roofHeight is absent', () => {
    const building = makeBuilding({
      height: 10,
      roofShape: 'gabled',
      // no roofHeight
    });
    const result = factory.create([building], origin);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Group);
    const group = result[0] as Group;
    // Roof mesh position should be less than total height (some portion used for roof)
    expect(group.children[1]!.position.y).toBeLessThan(10);
    expect(group.children[1]!.position.y).toBeGreaterThan(0);
  });

  it('uses centroid elevation for standalone buildings', () => {
    // rectanglePolygon centroid ≈ lat=55 → sampler returns 100
    const sampler = makeSampler((lat, _lng) => (lat > 53 ? 100 : 200));
    const elevFactory = new BuildingMeshFactory(sampler);
    const building = makeBuilding();
    const result = elevFactory.create([building], origin);
    expect(result).toHaveLength(1);
    expect(result[0]!.position.y).toBeCloseTo(100, 0);
  });

  it('children use parent elevation, not their own', () => {
    // Parent (rectanglePolygon) centroid ≈ lat=55 → sampler returns 100
    // Child (smallChildPolygon) centroid ≈ lat=52.5 → sampler would return 200
    // Both should use parent centroid elevation (100)
    const sampler = makeSampler((lat, _lng) => (lat > 53 ? 100 : 200));
    const elevFactory = new BuildingMeshFactory(sampler);

    const child = makeBuilding({
      id: 'child-1',
      geometry: smallChildPolygon,
      isPart: true,
      parentId: 'parent-1',
    });
    const parent = makeBuilding({
      id: 'parent-1',
      isPart: false,
      hasParts: true,
      children: [child],
    });
    const result = elevFactory.create([parent, child], origin);
    for (const mesh of result) {
      expect(mesh.position.y).toBeCloseTo(100, 0);
    }
  });
});
