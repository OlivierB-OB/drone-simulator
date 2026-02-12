/**
 * Drone Simulator Configuration
 */

export const droneConfig = {
  // Initial position: Paris Île de la Cité: 48.8530°N, 2.3499°E
  initialCoordinates: {
    latitude: 48.853,
    longitude: 2.3499,
  },

  // Movement speed in meters per second (realistic drone cruising speed: 10-15 m/s)
  movementSpeed: 12,

  // Rotation speed in degrees per second (realistic drone rotation: 30-90°/s)
  rotationSpeed: 60,
};
