import { describe, it, expect, beforeEach } from 'vitest';
import { ContextDataManager } from './ContextDataManager';
import type { MercatorCoordinates } from '../../gis/types';

describe('ContextDataManager', () => {
  let contextManager: ContextDataManager;
  const initialLocation: MercatorCoordinates = {
    x: 0,
    y: 0,
  };

  beforeEach(() => {
    contextManager = new ContextDataManager(initialLocation);
  });

  it('initializes with a tile ring around the initial location', () => {
    const ringTiles = contextManager.getRingTiles();
    // With ringRadius=1, we expect a 3×3 grid = 9 tiles
    expect(ringTiles).toHaveLength(9);
  });

  it('returns an empty array for tiles when cache is empty', () => {
    const allTiles = contextManager.getAllTiles();
    expect(allTiles).toEqual([]);
  });

  it('gets a tile by key (returns null if not cached)', () => {
    const tile = contextManager.getTile('14:8192:8192');
    expect(tile).toBeNull();
  });

  it('tracks ring tiles correctly', () => {
    const ringTiles = contextManager.getRingTiles();
    // With zoom 14, ringRadius 1, expect 3×3 = 9 tiles
    expect(ringTiles.length).toBe(9);

    // Each tile should be in format "z:x:y"
    for (const key of ringTiles) {
      const parts = key.split(':');
      expect(parts).toHaveLength(3);
      expect(Number.isInteger(parseInt(parts[0]!, 10))).toBe(true);
      expect(Number.isInteger(parseInt(parts[1]!, 10))).toBe(true);
      expect(Number.isInteger(parseInt(parts[2]!, 10))).toBe(true);
    }
  });

  it('updates ring when moving to a different tile', () => {
    const ringBefore = contextManager.getRingTiles();
    // Move to a significantly different location (different tile)
    contextManager.setLocation({ x: 1000000, y: 1000000 });
    const ringAfter = contextManager.getRingTiles();
    // Ring should be different after moving tiles
    expect(ringAfter).not.toEqual(ringBefore);
  });

  it('cleans up on dispose', () => {
    const ringTiles = contextManager.getRingTiles();
    expect(ringTiles.length).toBeGreaterThan(0);

    contextManager.dispose();

    // After dispose, should return empty tiles
    const allTiles = contextManager.getAllTiles();
    expect(allTiles).toEqual([]);
  });
});
