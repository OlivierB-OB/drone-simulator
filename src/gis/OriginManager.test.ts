import { describe, it, expect } from 'vitest';
import { OriginManager } from './OriginManager';
import type { GeoCoordinates } from './GeoCoordinates';

const paris: GeoCoordinates = { lat: 48.853, lng: 2.3499 };
const lyon: GeoCoordinates = { lat: 45.748, lng: 4.847 };

describe('OriginManager.setOrigin', () => {
  it('does not notify handlers when coords are unchanged', () => {
    const manager = new OriginManager(paris);
    let callCount = 0;
    manager.onChange(() => {
      callCount++;
    });

    manager.setOrigin({ ...paris });

    expect(callCount).toBe(0);
  });

  it('notifies handlers with correct args when coords change', () => {
    const manager = new OriginManager(paris);
    const calls: Array<[GeoCoordinates, GeoCoordinates]> = [];
    manager.onChange((next, prev) => calls.push([next, prev]));

    manager.setOrigin(lyon);

    expect(calls).toHaveLength(1);
    const [next, prev] = calls[0]!;
    expect(next).toEqual(lyon);
    expect(prev).toEqual(paris);
  });

  it('notifies handlers on first setOrigin call', () => {
    const manager = new OriginManager(paris);
    let callCount = 0;
    manager.onChange(() => {
      callCount++;
    });

    manager.setOrigin(lyon);

    expect(callCount).toBe(1);
  });

  it('notifies when only lat changes', () => {
    const manager = new OriginManager(paris);
    let callCount = 0;
    manager.onChange(() => {
      callCount++;
    });

    manager.setOrigin({ lat: paris.lat + 0.001, lng: paris.lng });

    expect(callCount).toBe(1);
  });

  it('notifies when only lng changes', () => {
    const manager = new OriginManager(paris);
    let callCount = 0;
    manager.onChange(() => {
      callCount++;
    });

    manager.setOrigin({ lat: paris.lat, lng: paris.lng + 0.001 });

    expect(callCount).toBe(1);
  });

  it('does not notify a deregistered handler', () => {
    const manager = new OriginManager(paris);
    let callCount = 0;
    const handler = () => {
      callCount++;
    };
    manager.onChange(handler);
    manager.offChange(handler);

    manager.setOrigin(lyon);

    expect(callCount).toBe(0);
  });
});
