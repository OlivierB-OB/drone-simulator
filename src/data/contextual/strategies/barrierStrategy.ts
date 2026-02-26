import type { ContextDataTile, BarrierVisual } from '../types';
import type { ClassifiedGeometry } from './parserUtils';
import { barrierDefaults } from '../../../config';

const BARRIER_TYPES = new Set(['wall', 'city_wall', 'retaining_wall', 'hedge']);

export { BARRIER_TYPES };

export function classifyBarrier(
  id: string,
  tags: Record<string, string>,
  geometry: ClassifiedGeometry,
  features: ContextDataTile['features']
): void {
  const barrierType = tags.barrier;
  if (!barrierType || !BARRIER_TYPES.has(barrierType)) return;
  if (!geometry.line) return;

  const defaults = barrierDefaults[barrierType];
  if (!defaults) return;

  const barrier: BarrierVisual = {
    id,
    geometry: geometry.line,
    type: barrierType,
    height: tags.height ? parseFloat(tags.height) : undefined,
    width: defaults.width,
    color: defaults.color,
    material: tags.material,
  };
  features.barriers.push(barrier);
}
