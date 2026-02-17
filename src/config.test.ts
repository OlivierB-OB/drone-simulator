import { describe, it, expect } from 'vitest';
import { droneConfig } from './config';

describe('droneConfig', () => {
  describe('structure', () => {
    it('should have initialCoordinates property', () => {
      expect(droneConfig.initialCoordinates).toBeDefined();
      expect(typeof droneConfig.initialCoordinates).toBe('object');
    });

    it('should have movementSpeed property', () => {
      expect(droneConfig.movementSpeed).toBeDefined();
      expect(typeof droneConfig.movementSpeed).toBe('number');
    });

    it('should have mouseSensitivity property', () => {
      expect(droneConfig.mouseSensitivity).toBeDefined();
      expect(typeof droneConfig.mouseSensitivity).toBe('number');
    });
  });

  describe('initialCoordinates', () => {
    it('should have latitude property', () => {
      expect(droneConfig.initialCoordinates.latitude).toBeDefined();
      expect(typeof droneConfig.initialCoordinates.latitude).toBe('number');
    });

    it('should have longitude property', () => {
      expect(droneConfig.initialCoordinates.longitude).toBeDefined();
      expect(typeof droneConfig.initialCoordinates.longitude).toBe('number');
    });

    it('should have valid latitude value (Paris)', () => {
      const lat = droneConfig.initialCoordinates.latitude;
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
      expect(lat).toBeCloseTo(48.853, 2); // Paris latitude
    });

    it('should have valid longitude value (Paris)', () => {
      const lon = droneConfig.initialCoordinates.longitude;
      expect(lon).toBeGreaterThanOrEqual(-180);
      expect(lon).toBeLessThanOrEqual(180);
      expect(lon).toBeCloseTo(2.3499, 2); // Paris longitude
    });

    it('should represent Île de la Cité location', () => {
      // Verify the coordinates are close to Île de la Cité, Paris
      const { latitude, longitude } = droneConfig.initialCoordinates;
      expect(latitude).toBeCloseTo(48.853, 3);
      expect(longitude).toBeCloseTo(2.3499, 3);
    });
  });

  describe('movementSpeed', () => {
    it('should be a positive number', () => {
      expect(droneConfig.movementSpeed).toBeGreaterThan(0);
    });

    it('should be realistic for a drone', () => {
      // Realistic drone cruising speed: 10-15 m/s
      expect(droneConfig.movementSpeed).toBeGreaterThanOrEqual(10);
      expect(droneConfig.movementSpeed).toBeLessThanOrEqual(15);
    });

    it('should be 12 m/s', () => {
      expect(droneConfig.movementSpeed).toBe(12);
    });
  });

  describe('mouseSensitivity', () => {
    it('should be a positive number', () => {
      expect(droneConfig.mouseSensitivity).toBeGreaterThan(0);
    });

    it('should be reasonable for mouse input', () => {
      // Mouse sensitivity should be between 0.1 and 2.0 degrees per pixel
      expect(droneConfig.mouseSensitivity).toBeGreaterThanOrEqual(0.1);
      expect(droneConfig.mouseSensitivity).toBeLessThanOrEqual(2.0);
    });

    it('should be 0.5 degrees per pixel', () => {
      expect(droneConfig.mouseSensitivity).toBe(0.5);
    });
  });

  describe('consistency', () => {
    it('should be consistent across multiple accesses', () => {
      const config1 = droneConfig;
      const config2 = droneConfig;

      expect(config1).toBe(config2); // Same reference
      expect(config1.movementSpeed).toBe(config2.movementSpeed);
      expect(config1.mouseSensitivity).toBe(config2.mouseSensitivity);
      expect(config1.initialCoordinates).toBe(config2.initialCoordinates);
    });

    it('should have all required properties defined', () => {
      const requiredProps = [
        'initialCoordinates',
        'movementSpeed',
        'mouseSensitivity',
      ];

      requiredProps.forEach((prop) => {
        expect(Object.prototype.hasOwnProperty.call(droneConfig, prop)).toBe(
          true
        );
      });
    });
  });
});
