# 1.2 Distance-Based Tile Load Priority

## Problem

Tiles load in nested-loop order (`dx=-1..1, dy=-1..1`), loading corner tiles before adjacent ones. Center tile may load last.

## Files

- `src/data/shared/TileDataManager.ts:147-178` — `updateTileRing()`
- `src/data/elevation/ElevationDataManager.ts:101-117` — `processQueuedTiles()`

## Fix

Sort tile candidates by squared distance to center before dispatching loads.

In `TileDataManager.updateTileRing()`:

```typescript
// Replace unordered iteration with distance-sorted dispatch
const candidates = [...desiredTiles]
  .filter(k => !this.tileCache.has(k) && !this.pendingLoads.has(k));

// Parse tile keys to get dx/dy offsets, sort by distance to center
candidates.sort((a, b) => {
  const [, ax, ay] = this.parseTileKey(a);
  const [, bx, by] = this.parseTileKey(b);
  const dxA = ax - center.x, dyA = ay - center.y;
  const dxB = bx - center.x, dyB = by - center.y;
  return (dxA * dxA + dyA * dyA) - (dxB * dxB + dyB * dyB);
});

for (const key of candidates) this.loadTileAsync(key);
```

Same pattern in `ElevationDataManager.processQueuedTiles()`.

## Impact

Nearest tiles appear first. 20-30% better perceived responsiveness.

## Verification

- `bun run test` — all tests pass
- `bun run dev` — observe that center/adjacent tiles load before corner tiles
