# 1.1 Origin Change Deduplication

## Problem

`OriginManager.setOrigin()` fires change handlers on every call even when lat/lng are unchanged. Called every frame via `App.tsx:61-62`. Both `TerrainObjectManager:76-87` and `MeshObjectManager:92-103` iterate all tiles calling `geoToLocal()` + `position.set()` unconditionally.

## File

`src/gis/OriginManager.ts:28-31`

## Fix

Add equality check in `setOrigin()` before notifying. Single fix at the source — all consumers benefit.

```typescript
setOrigin(geo: GeoCoordinates): void {
  if (this.origin.lat === geo.lat && this.origin.lng === geo.lng) return;
  const prev = this.origin;
  this.origin = { ...geo };
  for (const handler of this.changeHandlers) handler(this.origin, prev);
}
```

## Impact

Eliminates redundant `geoToLocal()` x ~18 tiles per idle frame. ~5-10% CPU savings.

## Verification

- `bun run test` — all tests pass
- `bun run dev` — tiles still reposition correctly when drone moves
