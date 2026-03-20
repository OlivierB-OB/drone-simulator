import type { TileKey } from './geometry/types';
import type { GeoBounds } from '../../gis/GeoCoordinates';

export type TileResource<T> = {
  tileKey: TileKey;
  resource: T;
  bounds: GeoBounds;
  dispose(): void;
};
