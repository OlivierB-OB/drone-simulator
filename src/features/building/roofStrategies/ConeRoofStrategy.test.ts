import { describe, it, expect } from 'vitest';
import { ConeRoofStrategy } from './ConeRoofStrategy';
import { PyramidalRoofStrategy } from './PyramidalRoofStrategy';

// n-gon approximating a circle of radius r (open ring)
function circularRing(r: number, n: number): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i * 2 * Math.PI) / n;
    return [Math.cos(angle) * r, Math.sin(angle) * r] as [number, number];
  });
}

// Axis-aligned rectangle ring (open)
function rectRing(w: number, d: number): [number, number][] {
  const hw = w / 2;
  const hd = d / 2;
  return [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];
}

const strategy = new ConeRoofStrategy();

const circleParams = {
  outerRing: circularRing(5, 16),
  roofShape: 'cone',
  roofHeight: 4,
  ridgeAngle: 0,
} as const;

describe('ConeRoofStrategy', () => {
  describe('circular footprint (Case A)', () => {
    it('apex is at roofHeight', () => {
      const geom = strategy.create(circleParams);
      const pos = geom.attributes.position!;
      let maxY = -Infinity;
      for (let i = 0; i < pos.count; i++) maxY = Math.max(maxY, pos.getY(i));
      expect(maxY).toBeCloseTo(4, 1);
    });

    it('base is at Y=0', () => {
      const geom = strategy.create(circleParams);
      const pos = geom.attributes.position!;
      let minY = Infinity;
      for (let i = 0; i < pos.count; i++) minY = Math.min(minY, pos.getY(i));
      expect(minY).toBeCloseTo(0, 5);
    });

    it('base vertices lie near the ring boundary', () => {
      const r = 5;
      const geom = strategy.create(circleParams);
      const pos = geom.attributes.position!;
      let allClose = true;
      for (let i = 0; i < pos.count; i++) {
        if (Math.abs(pos.getY(i)) > 0.01) continue; // only base vertices
        const dist = Math.sqrt(pos.getX(i) ** 2 + pos.getZ(i) ** 2);
        if (Math.abs(dist - r) > r * 0.2) {
          allClose = false;
          break;
        }
      }
      expect(allClose).toBe(true);
    });

    it('produces no NaN in position buffer', () => {
      const geom = strategy.create(circleParams);
      const arr = geom.attributes.position!.array;
      for (let i = 0; i < arr.length; i++) {
        expect(isNaN(arr[i]!)).toBe(false);
      }
    });

    it('roofHeight=0 does not throw and all Y≈0', () => {
      const geom = strategy.create({ ...circleParams, roofHeight: 0 });
      const pos = geom.attributes.position!;
      for (let i = 0; i < pos.count; i++) {
        expect(pos.getY(i)).toBeCloseTo(0, 5);
      }
    });
  });

  describe('elongated footprint (Case B — delegates to Pyramidal)', () => {
    // 20×5 rectangle: eccentricity = 10/2.5 = 4 >> 1.2
    const elongatedRing = rectRing(20, 5);
    const elongatedParams = {
      outerRing: elongatedRing,
      roofShape: 'cone',
      roofHeight: 3,
      ridgeAngle: 0,
    } as const;

    it('produces same vertex count as PyramidalRoofStrategy (4 edges × 3 = 12)', () => {
      const coneGeom = strategy.create(elongatedParams);
      expect(coneGeom.attributes.position!.count).toBe(12);
    });

    it('produces same geometry as PyramidalRoofStrategy for same params', () => {
      const coneGeom = strategy.create(elongatedParams);
      const pyramidGeom = new PyramidalRoofStrategy().create({
        ...elongatedParams,
        roofShape: 'pyramidal',
      });
      const conePos = coneGeom.attributes.position!.array;
      const pyramidPos = pyramidGeom.attributes.position!.array;
      expect(conePos.length).toBe(pyramidPos.length);
      for (let i = 0; i < conePos.length; i++) {
        expect(conePos[i]!).toBeCloseTo(pyramidPos[i]!, 5);
      }
    });
  });
});
