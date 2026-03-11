import { TypedEventEmitter } from '../core/TypedEventEmitter';

interface TileDataSource<TInput> {
  on(
    event: 'tileAdded',
    handler: (data: { key: string; tile: TInput }) => void
  ): void;
  on(event: 'tileRemoved', handler: (data: { key: string }) => void): void;
  off(
    event: 'tileAdded',
    handler: (data: { key: string; tile: TInput }) => void
  ): void;
  off(event: 'tileRemoved', handler: (data: { key: string }) => void): void;
}

interface RebuildTrigger {
  on(
    event: 'tileAdded',
    handler: (data: { key: string; tile: unknown }) => void
  ): void;
  off(
    event: 'tileAdded',
    handler: (data: { key: string; tile: unknown }) => void
  ): void;
}

/**
 * Abstract base class for managers that create/dispose typed objects
 * in response to tile lifecycle events from a data source.
 *
 * Subclasses implement `createObject` and `disposeObject`.
 * Optional hooks `onObjectAdded` / `onObjectRemoved` can emit events.
 *
 * Optional `secondarySources` trigger rebuilds (dispose + recreate) when they
 * emit `tileAdded` for a key that already has a primary-source object.
 * This is used to re-position meshes when elevation data arrives after context data.
 */
export abstract class TileObjectManager<
  TInput,
  TOutput,
  TEvents extends Record<string, unknown> = Record<string, never>,
> extends TypedEventEmitter<TEvents> {
  protected readonly objects = new Map<string, TOutput>();
  protected readonly inputs = new Map<string, TInput>();

  private readonly onTileAdded = ({
    key,
    tile,
  }: {
    key: string;
    tile: TInput;
  }) => {
    const obj = this.createObject(key, tile);
    this.objects.set(key, obj);
    this.inputs.set(key, tile);
    this.onObjectAdded(key, obj);
  };

  private readonly onTileRemoved = ({ key }: { key: string }) => {
    const obj = this.objects.get(key);
    if (obj !== undefined) this.disposeObject(obj);
    this.objects.delete(key);
    this.inputs.delete(key);
    this.onObjectRemoved(key);
  };

  private readonly onSecondaryTileAdded = ({ key }: { key: string }) => {
    const input = this.inputs.get(key);
    if (input === undefined) return;
    const existing = this.objects.get(key);
    if (existing !== undefined) this.disposeObject(existing);
    const obj = this.createObject(key, input);
    this.objects.set(key, obj);
  };

  constructor(
    private readonly dataSource: TileDataSource<TInput>,
    private readonly secondarySources: RebuildTrigger[] = []
  ) {
    super();
    dataSource.on('tileAdded', this.onTileAdded);
    dataSource.on('tileRemoved', this.onTileRemoved);
    for (const source of secondarySources) {
      source.on('tileAdded', this.onSecondaryTileAdded);
    }
  }

  protected abstract createObject(key: string, tile: TInput): TOutput;
  protected abstract disposeObject(obj: TOutput): void;
  protected onObjectAdded(_key: string, _obj: TOutput): void {}
  protected onObjectRemoved(_key: string): void {}

  dispose(): void {
    this.dataSource.off('tileAdded', this.onTileAdded);
    this.dataSource.off('tileRemoved', this.onTileRemoved);
    for (const source of this.secondarySources) {
      source.off('tileAdded', this.onSecondaryTileAdded);
    }
    for (const obj of this.objects.values()) this.disposeObject(obj);
    this.objects.clear();
    this.inputs.clear();
    this.removeAllListeners();
  }
}
