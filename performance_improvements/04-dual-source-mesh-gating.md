# 3.1 Dual-Source Gating for MeshObjectManager

## Problem

`MeshObjectManager` uses the secondary-source rebuild pattern from `TileObjectManager`:

1. Context data arrives -> meshes created at elevation=0 (if elevation not loaded yet)
2. Elevation arrives -> `onSecondaryTileAdded` destroys ALL meshes and recreates with correct elevation

This wastes CPU (double mesh creation) and causes visible height jumps.

## Files to Modify

| File | Change |
|------|--------|
| `src/visualization/mesh/MeshObjectManager.ts` | Dual-source gating: wait for both context + elevation |

## Fix

`MeshObjectManager` listens to both `contextData.tileAdded` and `elevationData.tileAdded`, and only creates meshes when both are available for a tile key. No secondary-source rebuild needed.

```typescript
private pendingContext = new Map<string, ContextDataTile>();

// On contextData.tileAdded:
private onContextAdded = ({ key, tile }) => {
  this.pendingContext.set(key, tile);
  if (this.elevationReady(key)) this.buildTile(key, tile);
};

// On elevationData.tileAdded:
private onElevationAdded = ({ key }) => {
  const ctx = this.pendingContext.get(key);
  if (ctx) this.buildTile(key, ctx);
};

private elevationReady(key: string): boolean {
  // Check if elevation tile exists for this key's geographic bounds
  return this.elevationData.getTileAt(...) !== null;
}

private buildTile(key: string, tile: ContextDataTile): void {
  // Create meshes with correct elevation — built once, correctly
  const group = this.createMeshGroup(tile);
  this.objects.set(key, group);
  this.scene.add(group);
}
```

No destroy+recreate cycle. Each mesh built correctly the first time. Simpler code.

**Note:** `TerrainObjectManager` keeps the secondary-source rebuild — showing solid green terrain before texture is ready is valid progressive rendering.

## Impact

Eliminates double mesh creation per tile. ~50% fewer building/vegetation allocations during initial load.

## Verification

- `bun run test` — all tests pass
- `bun run dev` — buildings/trees appear at correct elevation immediately (no height jump)
- Verify that meshes still appear even when elevation loads before context data
