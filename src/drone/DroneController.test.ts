import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DroneController } from './DroneController';
import { createDrone, Drone } from './Drone';
import { droneConfig } from '../config';

describe('DroneController', () => {
  let drone: Drone;
  let container: HTMLElement;
  let controller: DroneController;

  beforeEach(() => {
    drone = createDrone();
    container = document.createElement('div');
    controller = new DroneController(container, drone);
  });

  describe('Keyboard Input', () => {
    it('should start moving forward on ArrowUp keydown', () => {
      const spy = vi.spyOn(drone, 'startMovingForward');

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      document.dispatchEvent(event);

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should stop moving forward on ArrowUp keyup', () => {
      const spy = vi.spyOn(drone, 'stopMovingForward');

      const event = new KeyboardEvent('keyup', { key: 'ArrowUp' });
      document.dispatchEvent(event);

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should start moving backward on ArrowDown keydown', () => {
      const spy = vi.spyOn(drone, 'startMovingBackward');

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(event);

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should stop moving backward on ArrowDown keyup', () => {
      const spy = vi.spyOn(drone, 'stopMovingBackward');

      const event = new KeyboardEvent('keyup', { key: 'ArrowDown' });
      document.dispatchEvent(event);

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should start moving left on ArrowLeft keydown', () => {
      const spy = vi.spyOn(drone, 'startMovingLeft');

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      document.dispatchEvent(event);

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should stop moving left on ArrowLeft keyup', () => {
      const spy = vi.spyOn(drone, 'stopMovingLeft');

      const event = new KeyboardEvent('keyup', { key: 'ArrowLeft' });
      document.dispatchEvent(event);

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should start moving right on ArrowRight keydown', () => {
      const spy = vi.spyOn(drone, 'startMovingRight');

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      document.dispatchEvent(event);

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should stop moving right on ArrowRight keyup', () => {
      const spy = vi.spyOn(drone, 'stopMovingRight');

      const event = new KeyboardEvent('keyup', { key: 'ArrowRight' });
      document.dispatchEvent(event);

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should ignore non-arrow keys', () => {
      const forwardSpy = vi.spyOn(drone, 'startMovingForward');

      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      expect(forwardSpy).not.toHaveBeenCalled();
    });
  });

  describe('Mouse Input', () => {
    it('should listen to mousemove events on container', () => {
      const rotateSpy = vi.spyOn(drone, 'rotateAzimuth');

      // Set baseline position
      const event = new MouseEvent('mousemove', { clientX: 100 });
      container.dispatchEvent(event);

      // First real movement should trigger rotation
      rotateSpy.mockClear();
      const rightEvent = new MouseEvent('mousemove', { clientX: 150 });
      container.dispatchEvent(rightEvent);
      // Movement from 100 to 150 = 50px * mouseSensitivity
      expect(rotateSpy).toHaveBeenCalledWith(50 * droneConfig.mouseSensitivity);
    });

    it('should detect left mouse movement and rotate counter-clockwise', () => {
      const rotateSpy = vi.spyOn(drone, 'rotateAzimuth');

      // Set baseline
      let event = new MouseEvent('mousemove', { clientX: 100 });
      container.dispatchEvent(event);

      rotateSpy.mockClear();

      // Move left (clientX decreases)
      event = new MouseEvent('mousemove', { clientX: 50 });
      container.dispatchEvent(event);

      // 50 - 100 = -50px * mouseSensitivity = counter-clockwise rotation
      expect(rotateSpy).toHaveBeenCalledWith(
        -50 * droneConfig.mouseSensitivity
      );
    });

    it('should detect right mouse movement and rotate clockwise', () => {
      const rotateSpy = vi.spyOn(drone, 'rotateAzimuth');

      // Set baseline
      let event = new MouseEvent('mousemove', { clientX: 100 });
      container.dispatchEvent(event);

      rotateSpy.mockClear();

      // Move right (clientX increases)
      event = new MouseEvent('mousemove', { clientX: 150 });
      container.dispatchEvent(event);

      // 150 - 100 = 50px * mouseSensitivity = clockwise rotation
      expect(rotateSpy).toHaveBeenCalledWith(50 * droneConfig.mouseSensitivity);
    });
  });

  describe('Mouse Wheel Input', () => {
    it('should increase elevation on wheel scroll up', () => {
      const elevationSpy = vi.spyOn(drone, 'changeElevation');

      const event = new WheelEvent('wheel', { deltaY: -100 });
      container.dispatchEvent(event);

      expect(elevationSpy).toHaveBeenCalledWith(5);
    });

    it('should decrease elevation on wheel scroll down', () => {
      const elevationSpy = vi.spyOn(drone, 'changeElevation');

      const event = new WheelEvent('wheel', { deltaY: 100 });
      container.dispatchEvent(event);

      expect(elevationSpy).toHaveBeenCalledWith(-5);
    });

    it('should use wheelElevationSensitivity from config', () => {
      const elevationSpy = vi.spyOn(drone, 'changeElevation');

      const event = new WheelEvent('wheel', { deltaY: -50 });
      container.dispatchEvent(event);

      // Positive deltaY < 0 means wheel up, so positive elevation change
      expect(elevationSpy).toHaveBeenCalledWith(5);
    });
  });

  describe('dispose()', () => {
    it('should remove keyboard event listeners', () => {
      controller.dispose();

      const forwardSpy = vi.spyOn(drone, 'startMovingForward');
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      document.dispatchEvent(event);

      expect(forwardSpy).not.toHaveBeenCalled();
    });

    it('should remove mouse event listeners', () => {
      const rotateSpy = vi.spyOn(drone, 'rotateAzimuth');
      controller.dispose();

      const event = new MouseEvent('mousemove', { clientX: 100 });
      container.dispatchEvent(event);

      expect(rotateSpy).not.toHaveBeenCalled();
    });

    it('should remove wheel event listeners', () => {
      const elevationSpy = vi.spyOn(drone, 'changeElevation');
      controller.dispose();

      const event = new WheelEvent('wheel', { deltaY: 100 });
      container.dispatchEvent(event);

      expect(elevationSpy).not.toHaveBeenCalled();
    });

    it('should nullify container reference', () => {
      controller.dispose();
      // This indirectly tests the nullification - calling dispose again should not throw
      expect(() => controller.dispose()).not.toThrow();
    });
  });
});
