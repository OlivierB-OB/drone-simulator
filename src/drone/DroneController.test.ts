import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DroneController } from './DroneController';
import { createDrone, Drone } from './Drone';

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
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // First event initializes lastX and logs movement from 0
      const event = new MouseEvent('mousemove', { clientX: 100 });
      container.dispatchEvent(event);

      // First event from lastX=0 to clientX=100 logs right movement
      expect(consoleSpy).toHaveBeenCalledWith('Mouse moved: toward the right');

      consoleSpy.mockClear();

      // Second event with movement logs
      const rightEvent = new MouseEvent('mousemove', { clientX: 150 });
      container.dispatchEvent(rightEvent);
      expect(consoleSpy).toHaveBeenCalledWith('Mouse moved: toward the right');

      consoleSpy.mockRestore();
    });

    it('should detect left mouse movement', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Set baseline
      let event = new MouseEvent('mousemove', { clientX: 100 });
      container.dispatchEvent(event);

      // Move left
      event = new MouseEvent('mousemove', { clientX: 50 });
      container.dispatchEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith('Mouse moved: toward the left');

      consoleSpy.mockRestore();
    });

    it('should detect right mouse movement', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Set baseline
      let event = new MouseEvent('mousemove', { clientX: 100 });
      container.dispatchEvent(event);

      // Move right
      event = new MouseEvent('mousemove', { clientX: 150 });
      container.dispatchEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith('Mouse moved: toward the right');

      consoleSpy.mockRestore();
    });
  });

  describe('Mouse Wheel Input', () => {
    it('should detect wheel scroll up', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const event = new WheelEvent('wheel', { deltaY: -100 });
      container.dispatchEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith('Mouse wheel moved: up');

      consoleSpy.mockRestore();
    });

    it('should detect wheel scroll down', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const event = new WheelEvent('wheel', { deltaY: 100 });
      container.dispatchEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith('Mouse wheel moved: down');

      consoleSpy.mockRestore();
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
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      controller.dispose();

      const event = new MouseEvent('mousemove', { clientX: 100 });
      container.dispatchEvent(event);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should remove wheel event listeners', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      controller.dispose();

      const event = new WheelEvent('wheel', { deltaY: 100 });
      container.dispatchEvent(event);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should nullify container reference', () => {
      controller.dispose();
      // This indirectly tests the nullification - calling dispose again should not throw
      expect(() => controller.dispose()).not.toThrow();
    });
  });
});
