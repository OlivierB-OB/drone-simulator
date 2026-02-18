import { CanvasTexture } from 'three';

/**
 * Factory for generating rotor textures.
 * Creates radial stripe patterns for rotor animation visualization.
 */
export class DroneRotorTextureFactory {
  constructor(
    private readonly CanvasTextureConstructor: typeof CanvasTexture = CanvasTexture
  ) {}

  /**
   * Generate a radial stripe texture for rotor animation.
   * Creates alternating light/dark stripes that radiate outward.
   * Returns null in test environments where canvas 2D context is unavailable.
   */
  createRotorTexture(): CanvasTexture | null {
    try {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }

      const centerX = size / 2;
      const centerY = size / 2;
      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

      // Draw radial stripes
      const stripeWidth = 24; // pixels per stripe
      const darkColor = '#000000';

      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
        // Dark stripe offset
        const angle2 = angle + Math.PI / 32;
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = stripeWidth;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle2) * maxRadius,
          centerY + Math.sin(angle2) * maxRadius
        );
        ctx.stroke();
      }

      const texture = new this.CanvasTextureConstructor(canvas);
      return texture;
    } catch {
      // Silently fail in test environments
      return null;
    }
  }
}
