import { droneConfig } from '../config';
import { Drone } from './Drone';

export class DroneController {
  private keydownHandler!: (event: KeyboardEvent) => void;
  private keyupHandler!: (event: KeyboardEvent) => void;
  private mousemoveHandler!: (event: MouseEvent) => void;
  private wheelHandler!: (event: WheelEvent) => void;
  private lastMouseX: number | null = null;

  constructor(
    private readonly containerRef: HTMLElement,
    private readonly drone: Drone
  ) {
    this.setupKeyboardListeners();
    this.setupMouseListeners();
    this.setupMouseWheelListeners();
  }

  private setupKeyboardListeners() {
    this.keydownHandler = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          this.drone.startMovingLeft();
          break;
        case 'ArrowRight':
          this.drone.startMovingRight();
          break;
        case 'ArrowUp':
          this.drone.startMovingForward();
          break;
        case 'ArrowDown':
          this.drone.startMovingBackward();
          break;
      }
    };

    this.keyupHandler = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          this.drone.stopMovingLeft();
          break;
        case 'ArrowRight':
          this.drone.stopMovingRight();
          break;
        case 'ArrowUp':
          this.drone.stopMovingForward();
          break;
        case 'ArrowDown':
          this.drone.stopMovingBackward();
          break;
      }
    };

    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);
  }

  private setupMouseListeners() {
    this.mousemoveHandler = (event: MouseEvent) => {
      const currentX = event.clientX;

      if (this.lastMouseX === null) {
        this.lastMouseX = currentX;
        return;
      }

      const deltaX = currentX - this.lastMouseX;
      if (deltaX !== 0) {
        const deltaDegrees = deltaX * droneConfig.mouseSensitivity;
        this.drone.rotateAzimuth(deltaDegrees);
      }

      this.lastMouseX = currentX;
    };
    if (this.containerRef) {
      this.containerRef.addEventListener('mousemove', this.mousemoveHandler);
    }
  }

  private setupMouseWheelListeners() {
    this.wheelHandler = (event: WheelEvent) => {
      const elevationDelta =
        (event.deltaY < 0 ? 1 : -1) * droneConfig.wheelElevationSensitivity;
      this.drone.changeElevation(elevationDelta);
    };
    if (this.containerRef) {
      this.containerRef.addEventListener('wheel', this.wheelHandler);
    }
  }

  public dispose() {
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('keyup', this.keyupHandler);
    this.containerRef.removeEventListener('mousemove', this.mousemoveHandler);
    this.containerRef.removeEventListener('wheel', this.wheelHandler);
  }
}
