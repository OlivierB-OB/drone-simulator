import { describe, it, expect, vi } from 'vitest';
import { TypedEventEmitter } from './TypedEventEmitter';

type TestEvents = {
  change: { value: number };
  reset: void;
};

describe('TypedEventEmitter', () => {
  describe('on() and emit()', () => {
    it('should call handler when event is emitted', () => {
      const emitter = new TypedEventEmitter<TestEvents>();
      const handler = vi.fn();

      emitter.on('change', handler);
      emitter.emit('change', { value: 42 });

      expect(handler).toHaveBeenCalledWith({ value: 42 });
    });

    it('should support multiple handlers for the same event', () => {
      const emitter = new TypedEventEmitter<TestEvents>();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('change', handler1);
      emitter.on('change', handler2);
      emitter.emit('change', { value: 1 });

      expect(handler1).toHaveBeenCalledWith({ value: 1 });
      expect(handler2).toHaveBeenCalledWith({ value: 1 });
    });

    it('should not call handlers for other events', () => {
      const emitter = new TypedEventEmitter<TestEvents>();
      const changeHandler = vi.fn();
      const resetHandler = vi.fn();

      emitter.on('change', changeHandler);
      emitter.on('reset', resetHandler);
      emitter.emit('change', { value: 5 });

      expect(changeHandler).toHaveBeenCalled();
      expect(resetHandler).not.toHaveBeenCalled();
    });

    it('should handle emit with no handlers registered', () => {
      const emitter = new TypedEventEmitter<TestEvents>();
      expect(() => emitter.emit('change', { value: 1 })).not.toThrow();
    });

    it('should call handler multiple times for multiple emits', () => {
      const emitter = new TypedEventEmitter<TestEvents>();
      const handler = vi.fn();

      emitter.on('change', handler);
      emitter.emit('change', { value: 1 });
      emitter.emit('change', { value: 2 });

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, { value: 1 });
      expect(handler).toHaveBeenNthCalledWith(2, { value: 2 });
    });
  });

  describe('off()', () => {
    it('should remove a handler so it is no longer called', () => {
      const emitter = new TypedEventEmitter<TestEvents>();
      const handler = vi.fn();

      emitter.on('change', handler);
      emitter.off('change', handler);
      emitter.emit('change', { value: 1 });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should only remove the specified handler', () => {
      const emitter = new TypedEventEmitter<TestEvents>();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('change', handler1);
      emitter.on('change', handler2);
      emitter.off('change', handler1);
      emitter.emit('change', { value: 1 });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith({ value: 1 });
    });

    it('should handle removing a handler that was never added', () => {
      const emitter = new TypedEventEmitter<TestEvents>();
      const handler = vi.fn();

      expect(() => emitter.off('change', handler)).not.toThrow();
    });
  });

  describe('removeAllListeners()', () => {
    it('should remove all handlers for all events', () => {
      const emitter = new TypedEventEmitter<TestEvents>();
      const changeHandler = vi.fn();
      const resetHandler = vi.fn();

      emitter.on('change', changeHandler);
      emitter.on('reset', resetHandler);
      emitter.removeAllListeners();

      emitter.emit('change', { value: 1 });
      emitter.emit('reset', undefined as unknown as void);

      expect(changeHandler).not.toHaveBeenCalled();
      expect(resetHandler).not.toHaveBeenCalled();
    });

    it('should allow new handlers after removeAllListeners', () => {
      const emitter = new TypedEventEmitter<TestEvents>();
      const handler = vi.fn();

      emitter.on('change', handler);
      emitter.removeAllListeners();

      const newHandler = vi.fn();
      emitter.on('change', newHandler);
      emitter.emit('change', { value: 99 });

      expect(handler).not.toHaveBeenCalled();
      expect(newHandler).toHaveBeenCalledWith({ value: 99 });
    });
  });
});
