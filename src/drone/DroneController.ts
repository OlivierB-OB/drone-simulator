import { Drone } from './Drone';

export class DroneController {
  private containerRef: HTMLElement;
  private drone: Drone;
  private keydownHandler!: (event: KeyboardEvent) => void;
  private keyupHandler!: (event: KeyboardEvent) => void;
  private mousemoveHandler!: (event: MouseEvent) => void;
  private wheelHandler!: (event: WheelEvent) => void;

  constructor(containerRef: HTMLElement, drone: Drone) {
    this.containerRef = containerRef;
    this.drone = drone;
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
    let lastX = 0;

    this.mousemoveHandler = (event: MouseEvent) => {
      const currentX = event.clientX;

      if (currentX < lastX) {
        console.log('Mouse moved: toward the left');
      } else if (currentX > lastX) {
        console.log('Mouse moved: toward the right');
      }

      lastX = currentX;
    };
    this.containerRef.addEventListener('mousemove', this.mousemoveHandler);
  }

  private setupMouseWheelListeners() {
    this.wheelHandler = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        console.log('Mouse wheel moved: up');
      } else if (event.deltaY > 0) {
        console.log('Mouse wheel moved: down');
      }
    };
    this.containerRef.addEventListener('wheel', this.wheelHandler);
  }

  public dispose() {
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('keyup', this.keyupHandler);
    this.containerRef.removeEventListener('mousemove', this.mousemoveHandler);
    this.containerRef.removeEventListener('wheel', this.wheelHandler);
  }
}
