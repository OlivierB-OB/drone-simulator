import { describe, it, expect, beforeEach } from 'vitest';
import { Drone, createDrone } from './Drone';
import type { MercatorCoordinates } from './Drone';
import { droneConfig } from '../config';

describe('Drone', () => {
  let drone: Drone;
  const testLocation: MercatorCoordinates = { x: 261763, y: 6250047 };

  beforeEach(() => {
    drone = new Drone(testLocation, 0);
  });

  describe('constructor', () => {
    it('should initialize with given location and azimuth', () => {
      const location: MercatorCoordinates = { x: 100, y: 200 };
      const azimuth = 45;
      const testDrone = new Drone(location, azimuth);

      expect(testDrone.getLocation()).toEqual(location);
      expect(testDrone.getAzimuth()).toEqual(azimuth);
    });

    it('should default azimuth to 0', () => {
      const location: MercatorCoordinates = { x: 100, y: 200 };
      const testDrone = new Drone(location);

      expect(testDrone.getAzimuth()).toEqual(0);
    });

    it('should initialize with given elevation', () => {
      const location: MercatorCoordinates = { x: 100, y: 200 };
      const azimuth = 45;
      const elevation = 10;
      const testDrone = new Drone(location, azimuth, elevation);

      expect(testDrone.getElevation()).toEqual(elevation);
    });

    it('should default elevation to 0', () => {
      const location: MercatorCoordinates = { x: 100, y: 200 };
      const testDrone = new Drone(location);

      expect(testDrone.getElevation()).toEqual(0);
    });
  });

  describe('getLocation', () => {
    it('should return a copy of location', () => {
      const location = drone.getLocation();
      location.x = 999;

      expect(drone.getLocation().x).not.toEqual(999);
    });

    it('should return correct coordinates', () => {
      expect(drone.getLocation()).toEqual(testLocation);
    });
  });

  describe('getAzimuth', () => {
    it('should return the azimuth', () => {
      expect(drone.getAzimuth()).toEqual(0);
    });

    it('should return correct azimuth when initialized with angle', () => {
      const testDrone = new Drone(testLocation, 180);
      expect(testDrone.getAzimuth()).toEqual(180);
    });
  });

  describe('getElevation', () => {
    it('should return the elevation', () => {
      expect(drone.getElevation()).toEqual(0);
    });

    it('should return correct elevation when initialized with value', () => {
      const testDrone = new Drone(testLocation, 0, 5);
      expect(testDrone.getElevation()).toEqual(5);
    });

    it('should not change elevation during movement', () => {
      const testDrone = new Drone(testLocation, 0, 5);
      testDrone.startMovingForward();
      testDrone.applyMove(1);

      expect(testDrone.getElevation()).toEqual(5);
    });
  });

  describe('movement state methods', () => {
    describe('forward movement', () => {
      it('should start moving forward', () => {
        drone.startMovingForward();
        const initialLocation = drone.getLocation();

        drone.applyMove(1);

        const newLocation = drone.getLocation();
        expect(newLocation.y).toBeGreaterThan(initialLocation.y);
      });

      it('should stop moving forward', () => {
        drone.startMovingForward();
        drone.applyMove(0.5);
        const locationAfterMovement = drone.getLocation();

        drone.stopMovingForward();
        drone.applyMove(0.5);
        const locationAfterStop = drone.getLocation();

        expect(locationAfterStop).toEqual(locationAfterMovement);
      });
    });

    describe('backward movement', () => {
      it('should start moving backward', () => {
        drone.startMovingBackward();
        const initialLocation = drone.getLocation();

        drone.applyMove(1);

        const newLocation = drone.getLocation();
        expect(newLocation.y).toBeLessThan(initialLocation.y);
      });

      it('should stop moving backward', () => {
        drone.startMovingBackward();
        drone.applyMove(0.5);
        const locationAfterMovement = drone.getLocation();

        drone.stopMovingBackward();
        drone.applyMove(0.5);
        const locationAfterStop = drone.getLocation();

        expect(locationAfterStop).toEqual(locationAfterMovement);
      });
    });

    describe('left movement', () => {
      it('should start moving left', () => {
        drone.startMovingLeft();
        const initialLocation = drone.getLocation();

        drone.applyMove(1);

        const newLocation = drone.getLocation();
        expect(newLocation.x).toBeLessThan(initialLocation.x);
      });

      it('should stop moving left', () => {
        drone.startMovingLeft();
        drone.applyMove(0.5);
        const locationAfterMovement = drone.getLocation();

        drone.stopMovingLeft();
        drone.applyMove(0.5);
        const locationAfterStop = drone.getLocation();

        expect(locationAfterStop).toEqual(locationAfterMovement);
      });
    });

    describe('right movement', () => {
      it('should start moving right', () => {
        drone.startMovingRight();
        const initialLocation = drone.getLocation();

        drone.applyMove(1);

        const newLocation = drone.getLocation();
        expect(newLocation.x).toBeGreaterThan(initialLocation.x);
      });

      it('should stop moving right', () => {
        drone.startMovingRight();
        drone.applyMove(0.5);
        const locationAfterMovement = drone.getLocation();

        drone.stopMovingRight();
        drone.applyMove(0.5);
        const locationAfterStop = drone.getLocation();

        expect(locationAfterStop).toEqual(locationAfterMovement);
      });
    });
  });

  describe('applyMove', () => {
    it('should not move when no movement flags are set', () => {
      const initialLocation = drone.getLocation();

      drone.applyMove(1);

      expect(drone.getLocation()).toEqual(initialLocation);
    });

    it('should respect delta time for consistent movement', () => {
      drone.startMovingForward();
      const initialLocation = drone.getLocation();

      drone.applyMove(1);
      const locationAfter1s = drone.getLocation();
      const displacement1s = {
        x: locationAfter1s.x - initialLocation.x,
        y: locationAfter1s.y - initialLocation.y,
      };

      drone.stopMovingForward();
      const newInitialLocation = drone.getLocation();
      drone.startMovingForward();

      drone.applyMove(0.5);
      const locationAfter0_5s = drone.getLocation();
      const displacement0_5s = {
        x: locationAfter0_5s.x - newInitialLocation.x,
        y: locationAfter0_5s.y - newInitialLocation.y,
      };

      expect(displacement0_5s.x).toBeCloseTo(displacement1s.x / 2, 5);
      expect(displacement0_5s.y).toBeCloseTo(displacement1s.y / 2, 5);
    });

    it('should apply movement speed from config', () => {
      drone.startMovingForward();
      const initialLocation = drone.getLocation();

      const deltaTime = 1;
      drone.applyMove(deltaTime);

      const newLocation = drone.getLocation();
      const displacement = Math.sqrt(
        Math.pow(newLocation.x - initialLocation.x, 2) +
          Math.pow(newLocation.y - initialLocation.y, 2)
      );

      const expectedDisplacement = droneConfig.movementSpeed * deltaTime;
      expect(displacement).toBeCloseTo(expectedDisplacement, 5);
    });

    it('should move in direction of azimuth', () => {
      const northDrone = new Drone({ x: testLocation.x, y: testLocation.y }, 0);
      const eastDrone = new Drone({ x: testLocation.x, y: testLocation.y }, 90);
      const southDrone = new Drone(
        { x: testLocation.x, y: testLocation.y },
        180
      );
      const westDrone = new Drone(
        { x: testLocation.x, y: testLocation.y },
        270
      );

      const northInitial = northDrone.getLocation();
      const eastInitial = eastDrone.getLocation();
      const southInitial = southDrone.getLocation();
      const westInitial = westDrone.getLocation();

      northDrone.startMovingForward();
      eastDrone.startMovingForward();
      southDrone.startMovingForward();
      westDrone.startMovingForward();

      const deltaTime = 1;
      northDrone.applyMove(deltaTime);
      eastDrone.applyMove(deltaTime);
      southDrone.applyMove(deltaTime);
      westDrone.applyMove(deltaTime);

      const northLocation = northDrone.getLocation();
      const eastLocation = eastDrone.getLocation();
      const southLocation = southDrone.getLocation();
      const westLocation = westDrone.getLocation();

      // North: moving mostly in positive Y
      expect(northLocation.y).toBeGreaterThan(northInitial.y);
      expect(Math.abs(northLocation.x - northInitial.x)).toBeLessThan(5);

      // East: moving mostly in positive X
      expect(eastLocation.x).toBeGreaterThan(eastInitial.x);
      expect(Math.abs(eastLocation.y - eastInitial.y)).toBeLessThan(5);

      // South: moving mostly in negative Y
      expect(southLocation.y).toBeLessThan(southInitial.y);
      expect(Math.abs(southLocation.x - southInitial.x)).toBeLessThan(5);

      // West: moving mostly in negative X
      expect(westLocation.x).toBeLessThan(westInitial.x);
      expect(Math.abs(westLocation.y - westInitial.y)).toBeLessThan(5);
    });

    it('should cancel opposite directions (forward and backward)', () => {
      const initialLocation = drone.getLocation();

      drone.startMovingForward();
      drone.startMovingBackward();
      drone.applyMove(1);

      expect(drone.getLocation()).toEqual(initialLocation);
    });

    it('should cancel opposite directions (left and right)', () => {
      const initialLocation = drone.getLocation();

      drone.startMovingLeft();
      drone.startMovingRight();
      drone.applyMove(1);

      expect(drone.getLocation()).toEqual(initialLocation);
    });

    it('should combine forward and right movements', () => {
      drone.startMovingForward();
      drone.startMovingRight();
      const initialLocation = drone.getLocation();

      drone.applyMove(1);

      const newLocation = drone.getLocation();
      expect(newLocation.x).toBeGreaterThan(initialLocation.x);
      expect(newLocation.y).toBeGreaterThan(initialLocation.y);
    });

    it('should combine forward and left movements', () => {
      drone.startMovingForward();
      drone.startMovingLeft();
      const initialLocation = drone.getLocation();

      drone.applyMove(1);

      const newLocation = drone.getLocation();
      expect(newLocation.x).toBeLessThan(initialLocation.x);
      expect(newLocation.y).toBeGreaterThan(initialLocation.y);
    });

    it('should combine backward and right movements', () => {
      drone.startMovingBackward();
      drone.startMovingRight();
      const initialLocation = drone.getLocation();

      drone.applyMove(1);

      const newLocation = drone.getLocation();
      expect(newLocation.x).toBeGreaterThan(initialLocation.x);
      expect(newLocation.y).toBeLessThan(initialLocation.y);
    });

    it('should combine backward and left movements', () => {
      drone.startMovingBackward();
      drone.startMovingLeft();
      const initialLocation = drone.getLocation();

      drone.applyMove(1);

      const newLocation = drone.getLocation();
      expect(newLocation.x).toBeLessThan(initialLocation.x);
      expect(newLocation.y).toBeLessThan(initialLocation.y);
    });
  });

  describe('latLonToMercator', () => {
    it('should convert Paris coordinates correctly', () => {
      // Paris Île de la Cité: 48.8530°N, 2.3499°E
      const result = Drone.latLonToMercator(48.853, 2.3499);

      // Verify the result is reasonable (within expected range for Web Mercator)
      expect(result.x).toBeGreaterThan(260000);
      expect(result.x).toBeLessThan(263000);
      expect(result.y).toBeGreaterThan(6249000);
      expect(result.y).toBeLessThan(6251000);
    });

    it('should handle equator coordinates', () => {
      const result = Drone.latLonToMercator(0, 0);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });

    it('should handle prime meridian with latitude', () => {
      const result = Drone.latLonToMercator(45, 0);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeGreaterThan(0);
    });

    it('should handle negative longitude', () => {
      const result = Drone.latLonToMercator(40, -74); // New York

      expect(result.x).toBeLessThan(0);
      expect(result.y).toBeGreaterThan(0);
    });

    it('should handle southern hemisphere', () => {
      const result = Drone.latLonToMercator(-33.8688, 151.2093); // Sydney

      expect(result.x).toBeGreaterThan(0);
      expect(result.y).toBeLessThan(0);
    });

    it('should return new object each time', () => {
      const result1 = Drone.latLonToMercator(48.853, 2.3499);
      const result2 = Drone.latLonToMercator(48.853, 2.3499);

      expect(result1).toEqual(result2);
      expect(result1).not.toBe(result2);
    });
  });
});

describe('createDrone', () => {
  it('should create a drone with initial config coordinates', () => {
    const drone = createDrone();

    const expectedLocation = Drone.latLonToMercator(
      droneConfig.initialCoordinates.latitude,
      droneConfig.initialCoordinates.longitude
    );

    expect(drone.getLocation()).toEqual(expectedLocation);
  });

  it('should initialize with azimuth 0 (North)', () => {
    const drone = createDrone();

    expect(drone.getAzimuth()).toEqual(0);
  });

  it('should create drones with initial config coordinates', () => {
    const drone1 = createDrone();
    const drone2 = createDrone();

    // Both should have the same initial location from config
    expect(drone1.getLocation()).toEqual(drone2.getLocation());
    expect(drone1.getAzimuth()).toEqual(0);
    expect(drone2.getAzimuth()).toEqual(0);
  });
});
