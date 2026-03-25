# 2.1 Unified Vegetation Instancing

## Problem

Each forest/tree_row/orchard call to `createInstancedTrees()` creates its own `InstancedMesh` pair (trunk + canopy). `SingleTreeStrategy` creates individual `Mesh` objects with per-tree geometry and materials. A tile with 2 forests + 1 tree row + 5 single trees = ~16 draw calls.

All trees use the same 3 base geometries (cylinder trunk, sphere broadleaf canopy, cone needle canopy). Per-instance scale/position is already handled via `Matrix4`. They should all batch into one set of `InstancedMesh` per tile.

## Files to Modify

| File | Change |
|------|--------|
| `src/features/vegetation/VegetationMeshFactory.ts` | Two-pass batch: collect points then create InstancedMesh |
| `src/features/vegetation/meshStrategies/types.ts` | New interface for point collection |
| `src/features/vegetation/meshStrategies/vegetationUtils.ts` | Shared geometries/materials + batch functions |
| `src/features/vegetation/meshStrategies/SingleTreeStrategy.ts` | Convert to point collection |
| `src/features/vegetation/meshStrategies/ForestStrategy.ts` | Convert to point collection |
| `src/features/vegetation/meshStrategies/TreeRowStrategy.ts` | Convert to point collection |
| `src/features/vegetation/meshStrategies/OrchardStrategy.ts` | Convert to point collection |
| `src/features/vegetation/meshStrategies/ScrubStrategy.ts` | Convert to point collection |
| `src/features/vegetation/meshStrategies/VineyardStrategy.ts` | Convert to point collection |

## Approach

### New interfaces in `types.ts`

```typescript
interface TreePoint {
  lng: number; lat: number;
  trunkHeightMin: number; trunkHeightMax: number;
  crownRadiusMin: number; crownRadiusMax: number;
  isNeedle: boolean;
  colors: string[];
}

interface BushPoint {
  lng: number; lat: number;
  radiusMin: number; radiusMax: number;
  colors: string[];
}

interface IVegetationStrategy {
  collectPoints(veg: VegetationVisual, trees: TreePoint[], bushes: BushPoint[]): void;
}
```

### Two-pass batch in `VegetationMeshFactory`

```typescript
create(vegetation, origin): Object3D[] {
  const treePoints: TreePoint[] = [];
  const bushPoints: BushPoint[] = [];

  // Pass 1: collect all points
  for (const veg of vegetation) {
    this.strategies.get(veg.type)?.collectPoints(veg, treePoints, bushPoints);
  }

  // Pass 2: batch create
  return [
    ...batchInstancedTrees(treePoints, this.elevation, origin),
    ...batchInstancedBushes(bushPoints, this.elevation, origin),
  ];
}
```

### Shared module-level geometries and materials in `vegetationUtils.ts`

```typescript
const TRUNK_GEOM = new CylinderGeometry(0.15, 0.2, 1, 5);
const BROADLEAF_GEOM = new SphereGeometry(1, 6, 4);
const NEEDLE_GEOM = new ConeGeometry(1, 1, 6);
const BUSH_GEOM = new SphereGeometry(1, 6, 4);
```

### Strategy conversions

Each strategy's `create()` method becomes `collectPoints()` that pushes into the shared arrays instead of creating meshes:

- **ForestStrategy** — calls `distributePointsInPolygon()`, pushes TreePoints with forest config
- **ScrubStrategy** — calls `distributePointsInPolygon()`, pushes BushPoints with scrub config
- **OrchardStrategy** — calls `distributeGridInPolygon()`, pushes TreePoints with orchard config
- **VineyardStrategy** — calls `distributeGridInPolygon()`, pushes BushPoints with vineyard config
- **TreeRowStrategy** — interpolates along LineString, pushes TreePoints with tree_row config
- **SingleTreeStrategy** — pushes one TreePoint from the Point geometry

## Target State

2-4 draw calls for ALL vegetation per tile regardless of forest/tree count.

## Impact

Reduces vegetation draw calls by 5-10x in tree-heavy tiles. Eliminates SingleTreeStrategy per-tree Mesh/Material/Geometry allocations entirely.

## Verification

- `bun run test` — all tests pass
- `bun run type-check` — no type errors
- `bun run dev` — trees/bushes render identically to before
- Console: `renderer.info.render.calls` should decrease significantly in forested areas
