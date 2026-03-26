import type { BufferGeometry } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './roofStrategies/types';
import { PyramidalRoofStrategy } from './roofStrategies/PyramidalRoofStrategy';
import { GabledRoofStrategy } from './roofStrategies/GabledRoofStrategy';
import { HippedRoofStrategy } from './roofStrategies/HippedRoofStrategy';
import { SkillionRoofStrategy } from './roofStrategies/SkillionRoofStrategy';
import { ButterflyRoofStrategy } from './roofStrategies/ButterflyRoofStrategy';
import { DomeRoofStrategy } from './roofStrategies/DomeRoofStrategy';
import { OnionRoofStrategy } from './roofStrategies/OnionRoofStrategy';
import { ConeRoofStrategy } from './roofStrategies/ConeRoofStrategy';
import { CrosspitchedRoofStrategy } from './roofStrategies/CrosspitchedRoofStrategy';
import { GambrelRoofStrategy } from './roofStrategies/GambrelRoofStrategy';
import { HalfHippedRoofStrategy } from './roofStrategies/HalfHippedRoofStrategy';
import { MansardRoofStrategy } from './roofStrategies/MansardRoofStrategy';
import { RoundRoofStrategy } from './roofStrategies/RoundRoofStrategy';
import { SaltboxRoofStrategy } from './roofStrategies/SaltboxRoofStrategy';
import { SawtoothRoofStrategy } from './roofStrategies/SawtoothRoofStrategy';

export type { OBB, RoofParams } from './roofStrategies/types';
export {
  computeOBB,
  resolveRidgeAngle,
} from './roofStrategies/roofGeometryUtils';

/**
 * Creates roof BufferGeometry for non-flat roof shapes.
 * Geometry is built in Three.js local space:
 *   X = local Mercator X offset from centroid
 *   Y = height above wall top (0 at base, roofHeight at apex)
 *   Z = -local Mercator Y offset from centroid
 */
export class RoofGeometryFactory {
  private readonly strategies = new Map<string, IRoofGeometryStrategy>([
    ['pyramidal', new PyramidalRoofStrategy()],
    ['cone', new ConeRoofStrategy()],
    ['gabled', new GabledRoofStrategy()],
    ['hipped', new HippedRoofStrategy()],
    ['skillion', new SkillionRoofStrategy()],
    ['butterfly', new ButterflyRoofStrategy()],
    ['dome', new DomeRoofStrategy()],
    ['onion', new OnionRoofStrategy()],
    ['crosspitched', new CrosspitchedRoofStrategy()],
    ['gambrel', new GambrelRoofStrategy()],
    ['half-hipped', new HalfHippedRoofStrategy()],
    ['half_hipped', new HalfHippedRoofStrategy()],
    ['mansard', new MansardRoofStrategy()],
    ['round', new RoundRoofStrategy()],
    ['saltbox', new SaltboxRoofStrategy()],
    ['sawtooth', new SawtoothRoofStrategy()],
  ]);

  create(params: RoofParams): BufferGeometry | null {
    return this.strategies.get(params.roofShape)?.create(params) ?? null;
  }
}
