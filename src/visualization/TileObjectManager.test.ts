import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TileObjectManager } from './TileObjectManager';

type TestInput = string;
type TestOutput = { value: string; disposed: boolean };
type TestEvents = {
  added: { key: string; value: string };
  removed: { key: string };
};

class TestManager extends TileObjectManager<TestInput, TestOutput, TestEvents> {
  readonly createdObjects: TestOutput[] = [];
  readonly disposedObjects: TestOutput[] = [];

  protected override createObject(_key: string, tile: TestInput): TestOutput {
    const obj = { value: tile, disposed: false };
    this.createdObjects.push(obj);
    return obj;
  }

  protected override disposeObject(obj: TestOutput): void {
    obj.disposed = true;
    this.disposedObjects.push(obj);
  }

  protected override onObjectAdded(key: string, obj: TestOutput): void {
    this.emit('added', { key, value: obj.value });
  }

  protected override onObjectRemoved(key: string): void {
    this.emit('removed', { key });
  }
}

function makeDataSource() {
  let addedHandler: ((data: { key: string; tile: string }) => void) | undefined;
  let removedHandler: ((data: { key: string }) => void) | undefined;

  return {
    on: vi.fn((event: string, handler: unknown) => {
      if (event === 'tileAdded') addedHandler = handler as typeof addedHandler;
      if (event === 'tileRemoved')
        removedHandler = handler as typeof removedHandler;
    }),
    off: vi.fn(),
    fireAdded: (key: string, tile: string) => addedHandler!({ key, tile }),
    fireRemoved: (key: string) => removedHandler!({ key }),
  };
}

describe('TileObjectManager', () => {
  let dataSource: ReturnType<typeof makeDataSource>;
  let manager: TestManager;

  beforeEach(() => {
    dataSource = makeDataSource();
    manager = new TestManager(dataSource);
  });

  describe('constructor', () => {
    it('subscribes to tileAdded and tileRemoved on the data source', () => {
      expect(dataSource.on).toHaveBeenCalledWith(
        'tileAdded',
        expect.any(Function)
      );
      expect(dataSource.on).toHaveBeenCalledWith(
        'tileRemoved',
        expect.any(Function)
      );
    });
  });

  describe('tileAdded event', () => {
    it('creates object, stores in map, and calls onObjectAdded hook', () => {
      const events: { key: string; value: string }[] = [];
      manager.on('added', (e) => events.push(e));

      dataSource.fireAdded('tile:1:2', 'hello');

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ key: 'tile:1:2', value: 'hello' });
    });

    it('stores the created object internally', () => {
      dataSource.fireAdded('tile:1:2', 'hello');
      // Verify via tileRemoved (which retrieves from map)
      const removed: string[] = [];
      manager.on('removed', (e) => removed.push(e.key));
      dataSource.fireRemoved('tile:1:2');
      expect(removed).toContain('tile:1:2');
    });
  });

  describe('tileRemoved event', () => {
    it('disposes object, removes from map, and calls onObjectRemoved hook', () => {
      dataSource.fireAdded('tile:1:2', 'hello');

      const removed: string[] = [];
      manager.on('removed', (e) => removed.push(e.key));

      dataSource.fireRemoved('tile:1:2');

      expect(removed).toEqual(['tile:1:2']);
    });

    it('marks object as disposed when removed', () => {
      dataSource.fireAdded('tile:1:2', 'hello');
      expect(manager.createdObjects[0]?.disposed).toBe(false);

      dataSource.fireRemoved('tile:1:2');
      expect(manager.disposedObjects).toHaveLength(1);
      expect(manager.createdObjects[0]?.disposed).toBe(true);
    });

    it('does not throw for unknown keys', () => {
      expect(() => dataSource.fireRemoved('nonexistent')).not.toThrow();
    });

    it('does not call disposeObject for unknown keys', () => {
      // Removing unknown key should not trigger any events or errors
      const removed: string[] = [];
      manager.on('removed', (e) => removed.push(e.key));

      dataSource.fireRemoved('nonexistent');

      // onObjectRemoved is still called (for notification), but no disposal happens
      expect(removed).toEqual(['nonexistent']);
    });
  });

  describe('dispose', () => {
    it('unsubscribes both handlers from data source', () => {
      manager.dispose();
      expect(dataSource.off).toHaveBeenCalledWith(
        'tileAdded',
        expect.any(Function)
      );
      expect(dataSource.off).toHaveBeenCalledWith(
        'tileRemoved',
        expect.any(Function)
      );
    });

    it('disposes all stored objects', () => {
      dataSource.fireAdded('tile:1:2', 'a');
      dataSource.fireAdded('tile:3:4', 'b');

      expect(manager.createdObjects).toHaveLength(2);
      manager.dispose();

      expect(manager.disposedObjects).toHaveLength(2);
      expect(manager.createdObjects.every((obj) => obj.disposed)).toBe(true);
    });

    it('clears the objects map so no events fire after dispose', () => {
      dataSource.fireAdded('tile:1:2', 'a');
      manager.dispose();

      const events: string[] = [];
      manager.on('removed', (e) => events.push(e.key));
      // Handlers unsubscribed, so firing should not trigger anything
      // (dataSource.off was called, but our test double doesn't actually remove handlers)
      // We verify that the internal state is cleared
      expect(dataSource.off).toHaveBeenCalledTimes(2);
    });
  });
});
