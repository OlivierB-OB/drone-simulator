import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Drone, createDrone } from './Drone';
import { droneConfig } from '../config';
import type { GeoCoordinates } from '../gis/GeoCoordinates';
import { EARTH_RADIUS } from '../gis/GeoCoordinates';

const TO_RAD = Math.PI / 180;

describe('Drone', () => {
  let drone: Drone;
  // Paris coordinates from config
  const testLocation: GeoCoordinates = { lat: 48.853, lng: 2.3499 };

  beforeEach(() => {
    drone = new Drone(testLocation, 0);
  });

  describe('constructor', () => {
    it('should initialize with given location and azimuth', () => {
      const location: GeoCoordinates = { lat: 48.5, lng: 2.0 };
      const azimuth = 45;
      const testDrone = new Drone(location, azimuth);

      expect(testDrone.getLocation()).toEqual(location);
      expect(testDrone.getAzimuth()).toEqual(azimuth);
    });

    it('should default azimuth to 0', () => {
      const location: GeoCoordinates = { lat: 48.5, lng: 2.0 };
      const testDrone = new Drone(location);

      expect(testDrone.getAzimuth()).toEqual(0);
    });

    it('should initialize with given elevation', () => {
      const location: GeoCoordinates = { lat: 48.5, lng: 2.0 };
      const azimuth = 45;
      const elevation = 10;
      const testDrone = new Drone(location, azimuth, elevation);

      expect(testDrone.getElevation()).toEqual(elevation);
    });

    it('should default elevation to 0', () => {
      const location: GeoCoordinates = { lat: 48.5, lng: 2.0 };
      const testDrone = new Drone(location);

      expect(testDrone.getElevation()).toEqual(0);
    });
  });

  describe('getLocation', () => {
    it('should return a copy of location', () => {
      const location = drone.getLocation();
      location.lat = 999;

      expect(drone.getLocation().lat).not.toEqual(999);
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

  describe('rotateAzimuth', () => {
    it('should increase azimuth with positive delta', () => {
      drone.rotateAzimuth(45);
      expect(drone.getAzimuth()).toEqual(45);
    });

    it('should decrease azimuth with negative delta', () => {
      const testDrone = new Drone(testLocation, 90);
      testDrone.rotateAzimuth(-30);
      expect(testDrone.getAzimuth()).toEqual(60);
    });

    it('should wrap around at 360 degrees', () => {
      const testDrone = new Drone(testLocation, 350);
      testDrone.rotateAzimuth(20);
      expect(testDrone.getAzimuth()).toEqual(10);
    });

    it('should handle large positive rotations', () => {
      drone.rotateAzimuth(450);
      expect(drone.getAzimuth()).toEqual(90);
    });

    it('should handle large negative rotations', () => {
      const testDrone = new Drone(testLocation, 45);
      testDrone.rotateAzimuth(-405);
      expect(testDrone.getAzimuth()).toEqual(0);
    });

    it('should handle zero delta', () => {
      const testDrone = new Drone(testLocation, 90);
      testDrone.rotateAzimuth(0);
      expect(testDrone.getAzimuth()).toEqual(90);
    });

    it('should wrap correctly from 359 to 0', () => {
      const testDrone = new Drone(testLocation, 359);
      testDrone.rotateAzimuth(1);
      expect(testDrone.getAzimuth()).toEqual(0);
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

  describe('changeElevation', () => {
    it('should increase elevation with positive delta', () => {
      const testDrone = new Drone(testLocation, 0, 10);
      testDrone.changeElevation(5);
      expect(testDrone.getElevation()).toEqual(15);
    });

    it('should decrease elevation with negative delta', () => {
      const testDrone = new Drone(testLocation, 0, 20);
      testDrone.changeElevation(-5);
      expect(testDrone.getElevation()).toEqual(15);
    });

    it('should respect minimum elevation bound', () => {
      const testDrone = new Drone(testLocation, 0, 2);
      testDrone.changeElevation(-5);
      expect(testDrone.getElevation()).toEqual(droneConfig.elevationMinimum);
    });

    it('should respect maximum elevation bound', () => {
      const testDrone = new Drone(testLocation, 0, 495);
      testDrone.changeElevation(10);
      expect(testDrone.getElevation()).toEqual(droneConfig.elevationMaximum);
    });

    it('should clamp at zero when going below minimum', () => {
      drone.changeElevation(-10);
      expect(drone.getElevation()).toEqual(0);
    });

    it('should clamp at maximum when exceeding limit', () => {
      const testDrone = new Drone(testLocation, 0, 450);
      testDrone.changeElevation(100);
      expect(testDrone.getElevation()).toEqual(500);
    });
  });

  describe('movement state methods', () => {
    describe('forward movement', () => {
      it('should start moving forward', () => {
        drone.startMovingForward();
        const initialLocation = drone.getLocation();

        drone.applyMove(1);

        const newLocation = drone.getLocation();
        // Forward at azimuth 0° moves North (increases lat)
        expect(newLocation.lat).toBeGreaterThan(initialLocation.lat);
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
        // Backward at azimuth 0° moves South (decreases lat)
        expect(newLocation.lat).toBeLessThan(initialLocation.lat);
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
        // Left at azimuth 0° moves West (decreases lng)
        expect(newLocation.lng).toBeLessThan(initialLocation.lng);
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
        // Right at azimuth 0° moves East (increases lng)
        expect(newLocation.lng).toBeGreaterThan(initialLocation.lng);
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
        lat: locationAfter1s.lat - initialLocation.lat,
        lng: locationAfter1s.lng - initialLocation.lng,
      };

      drone.stopMovingForward();
      const newInitialLocation = drone.getLocation();
      drone.startMovingForward();

      drone.applyMove(0.5);
      const locationAfter0_5s = drone.getLocation();
      const displacement0_5s = {
        lat: locationAfter0_5s.lat - newInitialLocation.lat,
        lng: locationAfter0_5s.lng - newInitialLocation.lng,
      };

      expect(displacement0_5s.lat).toBeCloseTo(displacement1s.lat / 2, 10);
      expect(displacement0_5s.lng).toBeCloseTo(displacement1s.lng / 2, 10);
    });

    it('should apply movement speed from config', () => {
      drone.startMovingForward();
      const initialLocation = drone.getLocation();

      const deltaTime = 1;
      drone.applyMove(deltaTime);

      const newLocation = drone.getLocation();

      // Convert lat/lng displacement to meters for verification
      const dLat = newLocation.lat - initialLocation.lat;
      const dLng = newLocation.lng - initialLocation.lng;

      const dNorthMeters = dLat * TO_RAD * EARTH_RADIUS;
      const dEastMeters =
        dLng * TO_RAD * EARTH_RADIUS * Math.cos(initialLocation.lat * TO_RAD);

      const displacementMeters = Math.sqrt(
        Math.pow(dNorthMeters, 2) + Math.pow(dEastMeters, 2)
      );

      const expectedDisplacement = droneConfig.movementSpeed * deltaTime;
      expect(displacementMeters).toBeCloseTo(expectedDisplacement, 3);
    });

    it('should move in direction of azimuth', () => {
      const northDrone = new Drone(
        { lat: testLocation.lat, lng: testLocation.lng },
        0
      );
      const eastDrone = new Drone(
        { lat: testLocation.lat, lng: testLocation.lng },
        90
      );
      const southDrone = new Drone(
        { lat: testLocation.lat, lng: testLocation.lng },
        180
      );
      const westDrone = new Drone(
        { lat: testLocation.lat, lng: testLocation.lng },
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

      // North: moving in positive lat (northward)
      expect(northLocation.lat).toBeGreaterThan(northInitial.lat);
      expect(Math.abs(northLocation.lng - northInitial.lng)).toBeLessThan(
        0.00001
      );

      // East: moving in positive lng (eastward)
      expect(eastLocation.lng).toBeGreaterThan(eastInitial.lng);
      expect(Math.abs(eastLocation.lat - eastInitial.lat)).toBeLessThan(
        0.00001
      );

      // South: moving in negative lat (southward)
      expect(southLocation.lat).toBeLessThan(southInitial.lat);
      expect(Math.abs(southLocation.lng - southInitial.lng)).toBeLessThan(
        0.00001
      );

      // West: moving in negative lng (westward)
      expect(westLocation.lng).toBeLessThan(westInitial.lng);
      expect(Math.abs(westLocation.lat - westInitial.lat)).toBeLessThan(
        0.00001
      );
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
      expect(newLocation.lng).toBeGreaterThan(initialLocation.lng); // Right increases lng (East)
      expect(newLocation.lat).toBeGreaterThan(initialLocation.lat); // Forward increases lat (North)
    });

    it('should combine forward and left movements', () => {
      drone.startMovingForward();
      drone.startMovingLeft();
      const initialLocation = drone.getLocation();

      drone.applyMove(1);

      const newLocation = drone.getLocation();
      expect(newLocation.lng).toBeLessThan(initialLocation.lng); // Left decreases lng (West)
      expect(newLocation.lat).toBeGreaterThan(initialLocation.lat); // Forward increases lat (North)
    });

    it('should combine backward and right movements', () => {
      drone.startMovingBackward();
      drone.startMovingRight();
      const initialLocation = drone.getLocation();

      drone.applyMove(1);

      const newLocation = drone.getLocation();
      expect(newLocation.lng).toBeGreaterThan(initialLocation.lng); // Right increases lng (East)
      expect(newLocation.lat).toBeLessThan(initialLocation.lat); // Backward decreases lat (South)
    });

    it('should combine backward and left movements', () => {
      drone.startMovingBackward();
      drone.startMovingLeft();
      const initialLocation = drone.getLocation();

      drone.applyMove(1);

      const newLocation = drone.getLocation();
      expect(newLocation.lng).toBeLessThan(initialLocation.lng); // Left decreases lng (West)
      expect(newLocation.lat).toBeLessThan(initialLocation.lat); // Backward decreases lat (South)
    });
  });

  describe('locationChanged event', () => {
    it('should emit when drone moves forward', () => {
      const handler = vi.fn();
      drone.on('locationChanged', handler);

      drone.startMovingForward();
      drone.applyMove(1);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(drone.getLocation());
    });

    it('should not emit when no movement flags are set', () => {
      const handler = vi.fn();
      drone.on('locationChanged', handler);

      drone.applyMove(1);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should not emit when opposite movements cancel out', () => {
      const handler = vi.fn();
      drone.on('locationChanged', handler);

      drone.startMovingForward();
      drone.startMovingBackward();
      drone.applyMove(1);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should emit a copy of location, not a reference', () => {
      const handler = vi.fn();
      drone.on('locationChanged', handler);

      drone.startMovingForward();
      drone.applyMove(1);

      const emittedLocation = handler.mock.calls[0]![0] as GeoCoordinates;
      emittedLocation.lat = 999999;

      expect(drone.getLocation().lat).not.toEqual(999999);
    });

    it('should stop receiving events after off()', () => {
      const handler = vi.fn();
      drone.on('locationChanged', handler);
      drone.off('locationChanged', handler);

      drone.startMovingForward();
      drone.applyMove(1);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should stop all events after removeAllListeners()', () => {
      const handler = vi.fn();
      drone.on('locationChanged', handler);
      drone.removeAllListeners();

      drone.startMovingForward();
      drone.applyMove(1);

      expect(handler).not.toHaveBeenCalled();
    });
  });
});

describe('createDrone', () => {
  it('should create a drone with initial config coordinates', () => {
    const drone = createDrone();

    const expectedLocation: GeoCoordinates = {
      lat: droneConfig.initialCoordinates.latitude,
      lng: droneConfig.initialCoordinates.longitude,
    };

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
