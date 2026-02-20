import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OverpassStatusManager } from './OverpassStatusManager';

describe('OverpassStatusManager', () => {
  let manager: OverpassStatusManager;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    manager?.dispose();
    fetchSpy.mockRestore();
    vi.useRealTimers();
  });

  it('should initialize without crashing', () => {
    manager = new OverpassStatusManager(
      'https://test.example.com/status',
      1000,
      1000,
      1000
    );
    expect(manager).toBeDefined();
    expect(manager.isHealthy()).toBe(false); // No status yet
  });

  it('should parse status response correctly', async () => {
    const statusText = `Connected as: 2152559756
Current time: 2026-02-18T14:00:39Z
Announced endpoint: gall.openstreetmap.de/
Rate limit: 4
Slot available after: 2026-02-18T14:01:07Z, in 28 seconds.
Slot available after: 2026-02-18T14:01:12Z, in 33 seconds.
Currently running queries (pid, space limit, time limit, start time):
3756 262144 180 2026-02-18T13:59:43Z
5432 262144 180 2026-02-18T13:59:50Z`;

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      text: async () => statusText,
    } as any);

    manager = new OverpassStatusManager(
      'https://test.example.com/status',
      10000, // Long poll interval
      1000,
      1000
    );

    // Trigger immediate fetch
    await manager.poll();

    const status = await manager.getStatus();
    expect(status).toBeDefined();
    if (status) {
      expect(status.currentTime).toEqual(new Date('2026-02-18T14:00:39Z'));
      expect(status.slots).toHaveLength(2);
      if (status.slots[0]) {
        expect(status.slots[0].availableAfter).toEqual(
          new Date('2026-02-18T14:01:07Z')
        );
      }
      if (status.slots[1]) {
        expect(status.slots[1].availableAfter).toEqual(
          new Date('2026-02-18T14:01:12Z')
        );
      }
      expect(status.currentlyRunningQueries).toBe(2);
    }
  });

  it('should return earliest available slot', async () => {
    const statusText = `Current time: 2026-02-18T14:00:39Z
Slot available after: 2026-02-18T14:01:12Z, in 33 seconds.
Slot available after: 2026-02-18T14:01:07Z, in 28 seconds.
Slot available after: 2026-02-18T14:02:00Z, in 60 seconds.
Currently running queries (pid, space limit, time limit, start time):`;

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      text: async () => statusText,
    } as any);

    manager = new OverpassStatusManager(
      'https://test.example.com/status',
      10000,
      1000,
      1000
    );

    await manager.poll();

    const nextSlot = await manager.getNextAvailableSlot();
    // Should return the earliest slot
    expect(nextSlot).toEqual(new Date('2026-02-18T14:01:07Z'));
  });

  it('should cache status for the configured TTL', async () => {
    const statusText = `Current time: 2026-02-18T14:00:39Z
Slot available after: 2026-02-18T14:01:07Z, in 28 seconds.
Currently running queries (pid, space limit, time limit, start time):`;

    fetchSpy.mockResolvedValue({
      ok: true,
      text: async () => statusText,
    } as any);

    manager = new OverpassStatusManager(
      'https://test.example.com/status',
      10000,
      1000,
      5000 // 5 second cache TTL
    );

    await manager.poll();
    const firstFetch = fetchSpy.mock.calls.length;

    // Advance time but stay within cache TTL
    vi.advanceTimersByTime(2000);
    await manager.getStatus();

    // Should not have fetched again (using cache)
    expect(fetchSpy.mock.calls.length).toBe(firstFetch);

    // Advance past cache TTL
    vi.advanceTimersByTime(4000);
    await manager.getStatus();

    // Now should schedule a new fetch (poll will be triggered)
    // But we need to wait for the scheduled poll
    vi.advanceTimersByTime(10000);
  });

  it('should handle network errors gracefully', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'));

    manager = new OverpassStatusManager(
      'https://test.example.com/status',
      10000,
      1000,
      1000
    );

    await manager.poll();

    const status = await manager.getStatus();
    expect(status).toBeNull();
    expect(manager.isHealthy()).toBe(false);
  });

  it('should handle HTTP errors gracefully', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => '',
    } as any);

    manager = new OverpassStatusManager(
      'https://test.example.com/status',
      10000,
      1000,
      1000
    );

    await manager.poll();

    const status = await manager.getStatus();
    expect(status).toBeNull();
  });

  it('should return null for next available slot when status unavailable', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'));

    manager = new OverpassStatusManager(
      'https://test.example.com/status',
      10000,
      1000,
      1000
    );

    await manager.poll();

    const nextSlot = await manager.getNextAvailableSlot();
    expect(nextSlot).toBeNull();
  });

  it('should return current load from status', async () => {
    const statusText = `Current time: 2026-02-18T14:00:39Z
Slot available after: 2026-02-18T14:01:07Z, in 28 seconds.
Currently running queries (pid, space limit, time limit, start time):
3756 262144 180 2026-02-18T13:59:43Z
5432 262144 180 2026-02-18T13:59:50Z
1234 262144 180 2026-02-18T13:59:55Z`;

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      text: async () => statusText,
    } as any);

    manager = new OverpassStatusManager(
      'https://test.example.com/status',
      10000,
      1000,
      1000
    );

    await manager.poll();

    expect(manager.getCurrentLoad()).toBe(3);
  });

  it('should return 0 load when status unavailable', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'));

    manager = new OverpassStatusManager(
      'https://test.example.com/status',
      10000,
      1000,
      1000
    );

    await manager.poll();

    expect(manager.getCurrentLoad()).toBe(0);
  });

  it('should stop polling after dispose', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      text: async () => `Current time: 2026-02-18T14:00:39Z
Slot available after: 2026-02-18T14:01:07Z, in 28 seconds.
Currently running queries (pid, space limit, time limit, start time):`,
    } as any);

    manager = new OverpassStatusManager(
      'https://test.example.com/status',
      1000,
      1000,
      1000
    );

    const initialCallCount = fetchSpy.mock.calls.length;

    manager.dispose();

    // Advance time past poll interval
    vi.advanceTimersByTime(2000);

    // Should not have made any new fetch calls
    expect(fetchSpy.mock.calls.length).toBe(initialCallCount);
  });

  it('should return null for slot when disposed', async () => {
    manager = new OverpassStatusManager(
      'https://test.example.com/status',
      10000,
      1000,
      1000
    );

    manager.dispose();

    const slot = await manager.getNextAvailableSlot();
    expect(slot).toBeNull();
  });

  it('should be unhealthy when cache is stale', async () => {
    const statusText = `Current time: 2026-02-18T14:00:39Z
Slot available after: 2026-02-18T14:01:07Z, in 28 seconds.
Currently running queries (pid, space limit, time limit, start time):`;

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      text: async () => statusText,
    } as any);

    manager = new OverpassStatusManager(
      'https://test.example.com/status',
      10000,
      1000,
      5000 // 5 second cache TTL
    );

    await manager.poll();
    expect(manager.isHealthy()).toBe(true);

    // Advance past 2x cache TTL (health check uses 2x TTL)
    vi.advanceTimersByTime(11000);

    expect(manager.isHealthy()).toBe(false);
  });
});
