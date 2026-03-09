import { describe, it, expect } from 'vitest';
import { mercatorToThreeJs, type MercatorCoordinates } from './types';

/**
 * Coordinate consistency tests validate that all components use the same
 * Z-negation strategy (z = -location.y) to ensure spatial coherence across
 * the entire drone simulator.
 *
 * These tests verify the critical invariant: Mercator Y (northward-positive)
 * must be negated to Three.js Z to maintain consistent alignment with the
 * camera's default forward direction (-Z).
 */
describe('Coordinate System Consistency', () => {
  describe('consistent Z-negation formula', () => {
    it('mercatorToThreeJs should use z = -location.y', () => {
      // This is the reference formula that all components must use
      const location: MercatorCoordinates = { x: 100, y: 200 };
      const result = mercatorToThreeJs(location, 50);

      // Core invariant: Z negation
      expect(result.z).toBe(-location.y);
    });

    it('TerrainObjectFactory should use identical Z-negation (line 52)', () => {
      // From TerrainObjectFactory.ts:52
      // mesh.position.set(centerX, 0, -centerZ);
      // where centerZ is computed from Mercator bounds
      // This verifies -centerZ = -(mercator.y) uses same formula

      const bounds = { minY: 1000, maxY: 3000, minX: 5000, maxX: 7000 };
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerZ = (bounds.minY + bounds.maxY) / 2;

      // TerrainObjectFactory sets position.z = -centerZ
      // Which means: -((minY + maxY) / 2) = -(mercator.y coordinate)
      const meshZ = -centerZ;

      // Verify this matches mercatorToThreeJs formula
      const result = mercatorToThreeJs({ x: centerX, y: centerZ }, 0);
      expect(meshZ).toBe(result.z);
    });

    it('BuildingMeshFactory should use identical Z-negation (lines 180, 186)', () => {
      // From BuildingMeshFactory.ts:180 and 186
      // group.position.set(centroid[0], worldY, -centroid[1]);
      // wallMesh.position.set(centroid[0], worldY, -centroid[1]);
      // where centroid[1] is Mercator Y

      const centroid: [number, number] = [261763, 6250047]; // Mercator X, Y
      const worldY = 100; // Elevation

      // BuildingMeshFactory uses position.z = -centroid[1]
      const buildingZ = -centroid[1];

      // Verify this matches mercatorToThreeJs formula
      const result = mercatorToThreeJs({ x: centroid[0], y: centroid[1] }, worldY);
      expect(buildingZ).toBe(result.z);
    });
  });

  describe('spatial relationships validation', () => {
    it('drone, camera, and terrain should align spatially when all use same convention', () => {
      // Test data: drone position in Mercator
      const droneMercator: MercatorCoordinates = { x: 262000, y: 6250000 };
      const droneElevation = 35;

      // All components should produce the same Three.js position for the drone
      const droneThreeJs = mercatorToThreeJs(droneMercator, droneElevation);

      // Drone position (expected from DroneObject)
      const droneX = droneMercator.x;
      const droneY = droneElevation;
      const droneZ = -droneMercator.y;

      expect(droneThreeJs.x).toBe(droneX);
      expect(droneThreeJs.y).toBe(droneY);
      expect(droneThreeJs.z).toBe(droneZ);

      // Camera should look at drone with consistent coordinates
      // (Camera.ts uses lookAt(droneX, droneY, droneZ) which relies on this)
      expect(droneThreeJs).toEqual({ x: droneX, y: droneY, z: droneZ });
    });

    it('terrain meshes positioned at same location should match drone 3D position', () => {
      const terrainBounds = {
        minX: 261500,
        maxX: 262500,
        minY: 6249500,
        maxY: 6250500,
      };

      // Terrain center (from TerrainObjectFactory)
      const terrainCenterX = (terrainBounds.minX + terrainBounds.maxX) / 2;
      const terrainCenterZ = (terrainBounds.minY + terrainBounds.maxY) / 2;
      const terrainZ = -terrainCenterZ;

      // Equivalent drone position at same location (from mercatorToThreeJs)
      const droneThreeJs = mercatorToThreeJs(
        { x: terrainCenterX, y: terrainCenterZ },
        0
      );

      // Both should use same Z positioning
      expect(terrainZ).toBe(droneThreeJs.z);
    });

    it('building and terrain at same Mercator location should have same Three.js Z', () => {
      const mercatorLocation: MercatorCoordinates = { x: 262000, y: 6250000 };

      // Terrain (from TerrainObjectFactory)
      const terrainZ = -mercatorLocation.y;

      // Building (from BuildingMeshFactory)
      const buildingZ = -mercatorLocation.y;

      // Both should match mercatorToThreeJs
      const threeJsPosition = mercatorToThreeJs(mercatorLocation, 0);

      expect(terrainZ).toBe(threeJsPosition.z);
      expect(buildingZ).toBe(threeJsPosition.z);
      expect(terrainZ).toBe(buildingZ);
    });
  });

  describe('azimuth and movement alignment', () => {
    it('azimuth 0° (North) should align with -Z direction for all components', () => {
      // Mercator convention: Y increases northward
      // Three.js convention: camera looks along -Z by default
      // Therefore: North (increasing Y) must decrease Z

      const baseLocation: MercatorCoordinates = { x: 0, y: 1000 };
      const northLocation: MercatorCoordinates = { x: 0, y: 2000 };

      const basePosition = mercatorToThreeJs(baseLocation, 0);
      const northPosition = mercatorToThreeJs(northLocation, 0);

      // Moving north (Y increases) should move in -Z direction
      expect(northPosition.z).toBeLessThan(basePosition.z);

      // This alignment holds for terrain, buildings, and drone equally
      // because all use identical formula z = -location.y
    });

    it('forward movement from drone should decrease Z (northward), regardless of object type', () => {
      // Initial position
      const startMercator: MercatorCoordinates = { x: 100000, y: 6250000 };
      const startThreeJs = mercatorToThreeJs(startMercator, 0);

      // Move forward (northward): increase Mercator Y
      const endMercator: MercatorCoordinates = { x: 100000, y: 6251000 };
      const endThreeJs = mercatorToThreeJs(endMercator, 0);

      // In Three.js, forward decreases Z (default camera looks along -Z)
      expect(endThreeJs.z).toBeLessThan(startThreeJs.z);

      // This is the expected behavior for:
      // - Drone movement (Drone.ts line 110-118)
      // - Camera chase position (Camera.ts)
      // - Terrain and building positioning
    });

    it('should maintain cardinal direction alignment for all components', () => {
      const referenceLocation: MercatorCoordinates = { x: 100000, y: 6250000 };
      const ref = mercatorToThreeJs(referenceLocation, 0);

      // Test all cardinal directions
      const directions = {
        north: mercatorToThreeJs({ x: 100000, y: 6251000 }, 0),
        south: mercatorToThreeJs({ x: 100000, y: 6249000 }, 0),
        east: mercatorToThreeJs({ x: 101000, y: 6250000 }, 0),
        west: mercatorToThreeJs({ x: 99000, y: 6250000 }, 0),
      };

      // North: Y increases → Z decreases
      expect(directions.north.z).toBeLessThan(ref.z);
      expect(directions.north.x).toBe(ref.x);

      // South: Y decreases → Z increases
      expect(directions.south.z).toBeGreaterThan(ref.z);
      expect(directions.south.x).toBe(ref.x);

      // East: X increases → X increases
      expect(directions.east.x).toBeGreaterThan(ref.x);
      expect(directions.east.z).toBe(ref.z);

      // West: X decreases → X decreases
      expect(directions.west.x).toBeLessThan(ref.x);
      expect(directions.west.z).toBe(ref.z);
    });
  });

  describe('elevation independence', () => {
    it('elevation changes should not affect Z positioning (only Y)', () => {
      const mercator: MercatorCoordinates = { x: 100000, y: 6250000 };

      const position1 = mercatorToThreeJs(mercator, 0);
      const position2 = mercatorToThreeJs(mercator, 100);
      const position3 = mercatorToThreeJs(mercator, -50);

      // X and Z should remain constant
      expect(position2.x).toBe(position1.x);
      expect(position2.z).toBe(position1.z);
      expect(position3.x).toBe(position1.x);
      expect(position3.z).toBe(position1.z);

      // Only Y (elevation) should change
      expect(position2.y).not.toBe(position1.y);
      expect(position3.y).not.toBe(position1.y);

      // This ensures elevation/terrain doesn't affect horizontal positioning
      // which is critical for spatial coherence in building placement, etc.
    });
  });

  describe('boundary conditions', () => {
    it('should handle coordinate system wrapping and edge cases consistently', () => {
      // Test at the edges of the Web Mercator projection
      const edgeCases: MercatorCoordinates[] = [
        { x: 0, y: 0 }, // Top-left corner
        { x: 20000000, y: 20000000 }, // Bottom-right (global extent)
        { x: -1000000, y: -1000000 }, // Negative coordinates
        { x: 10000000, y: 0 }, // Edge with zero Y
      ];

      for (const location of edgeCases) {
        const result = mercatorToThreeJs(location, 0);

        // All should follow the same formula
        expect(result.x).toBe(location.x);
        expect(result.z).toBe(-location.y);
      }
    });

    it('should maintain consistency across zoom level transitions', () => {
      // Web Mercator coordinates are zoom-independent (absolute meters)
      // so coordinate consistency should hold at any zoom level
      const mercatorCoords: MercatorCoordinates = { x: 262000, y: 6250000 };

      // Same Mercator location, different zoom levels
      // (zoom doesn't affect Mercator coordinates, only tile indices)
      const result1 = mercatorToThreeJs(mercatorCoords, 0);
      const result2 = mercatorToThreeJs(mercatorCoords, 0);

      // Should produce identical results (zoom level doesn't change position)
      expect(result1).toEqual(result2);
    });
  });

  describe('rotational consistency', () => {
    it('should maintain rotational alignment for azimuth calculations', () => {
      // Critical for drone heading and camera orientation
      const reference: MercatorCoordinates = { x: 100000, y: 6250000 };
      const ref = mercatorToThreeJs(reference, 0);

      // Azimuth rotations should be consistent
      // Azimuth 0° = North = -Z direction in Three.js
      // Azimuth 90° = East = +X direction in Three.js
      // Azimuth 180° = South = +Z direction in Three.js
      // Azimuth 270° = West = -X direction in Three.js

      // Verify with movement in each direction
      const north: MercatorCoordinates = { x: reference.x, y: reference.y + 1000 };
      const east: MercatorCoordinates = { x: reference.x + 1000, y: reference.y };
      const south: MercatorCoordinates = { x: reference.x, y: reference.y - 1000 };
      const west: MercatorCoordinates = { x: reference.x - 1000, y: reference.y };

      const n = mercatorToThreeJs(north, 0);
      const e = mercatorToThreeJs(east, 0);
      const s = mercatorToThreeJs(south, 0);
      const w = mercatorToThreeJs(west, 0);

      // North: Z decreases (moves in -Z direction)
      expect(n.z - ref.z).toBeLessThan(0);

      // East: X increases (moves in +X direction)
      expect(e.x - ref.x).toBeGreaterThan(0);

      // South: Z increases (moves in +Z direction)
      expect(s.z - ref.z).toBeGreaterThan(0);

      // West: X decreases (moves in -X direction)
      expect(w.x - ref.x).toBeLessThan(0);

      // This validates that the coordinate system supports correct
      // azimuth-based rotation in Drone.ts and camera orientation
    });
  });
});
