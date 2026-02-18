import {
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  CircleGeometry,
  MeshPhongMaterial,
  Group,
  Vector3,
  CanvasTexture,
  type Object3D,
} from 'three';

interface DroneGeometryResult {
  group: Group;
  rotors: Mesh[];
}

/**
 * Generate a radial stripe texture for rotor animation.
 * Creates alternating light/dark stripes that radiate outward.
 * Returns null in test environments where canvas 2D context is unavailable.
 */
function generateRotorTexture(): CanvasTexture | null {
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
    const stripeWidth = 12; // pixels per stripe
    const lightColor = '#CCCCCC';
    const darkColor = '#222222';

    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
      // Draw lines from center outward
      const x1 = centerX + Math.cos(angle) * 0;
      const y1 = centerY + Math.sin(angle) * 0;
      const x2 = centerX + Math.cos(angle) * maxRadius;
      const y2 = centerY + Math.sin(angle) * maxRadius;

      ctx.strokeStyle = lightColor;
      ctx.lineWidth = stripeWidth;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Dark stripe offset
      const angle2 = angle + Math.PI / 32;
      const x3 = centerX + Math.cos(angle2) * 0;
      const y3 = centerY + Math.sin(angle2) * 0;
      const x4 = centerX + Math.cos(angle2) * maxRadius;
      const y4 = centerY + Math.sin(angle2) * maxRadius;

      ctx.strokeStyle = darkColor;
      ctx.lineWidth = stripeWidth;
      ctx.beginPath();
      ctx.moveTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.stroke();
    }

    const texture = new CanvasTexture(canvas);
    return texture;
  } catch {
    // Silently fail in test environments
    return null;
  }
}

function createDroneGeometry(): DroneGeometryResult {
  const group = new Group();
  const rotors: Mesh[] = [];

  // Local space: -Z = forward (North), +X = right (East), +Y = up

  // --- Fuselage (flat rectangular body) ---
  const fuselageWidth = 1.6;
  const fuselageHeight = 0.4;
  const fuselageLength = 2.2;
  const halfW = fuselageWidth / 2;
  const halfH = fuselageHeight / 2;
  const halfL = fuselageLength / 2;

  const bodyMaterial = new MeshPhongMaterial({
    color: 0x444444,
    shininess: 60,
  });
  const fuselage = new Mesh(
    new BoxGeometry(fuselageWidth, fuselageHeight, fuselageLength),
    bodyMaterial
  );
  group.add(fuselage);

  // --- Front indicator (red bar at nose so heading is visible) ---
  const frontIndicator = new Mesh(
    new BoxGeometry(fuselageWidth * 0.6, fuselageHeight * 0.5, 0.15),
    new MeshPhongMaterial({ color: 0xff3300, shininess: 80 })
  );
  frontIndicator.position.set(0, halfH * 0.2, -halfL - 0.075);
  group.add(frontIndicator);

  // --- Arms + motors + rotors ---
  // Arms extend diagonally outward from fuselage corners in an X pattern
  const armLength = 3.0;
  const diag = 1 / Math.SQRT2;

  const armConfigs = [
    { dirX: +diag, dirZ: -diag, cornerX: +halfW, cornerZ: -halfL }, // Front-Right
    { dirX: -diag, dirZ: -diag, cornerX: -halfW, cornerZ: -halfL }, // Front-Left
    { dirX: +diag, dirZ: +diag, cornerX: +halfW, cornerZ: +halfL }, // Back-Right
    { dirX: -diag, dirZ: +diag, cornerX: -halfW, cornerZ: +halfL }, // Back-Left
  ];

  const armMaterial = new MeshPhongMaterial({ color: 0x222222, shininess: 40 });
  const motorMaterial = new MeshPhongMaterial({
    color: 0x333333,
    shininess: 50,
  });
  const rotorTexture = generateRotorTexture();
  const rotorMaterial = new MeshPhongMaterial({
    ...(rotorTexture && { map: rotorTexture }),
    shininess: rotorTexture ? 5 : 30,
    color: rotorTexture ? 0xffffff : 0x111111,
    transparent: true,
    opacity: 0.7,
  });

  const motorRadius = 0.3;
  const motorHeight = 0.35;
  const rotorRadius = 1.2;
  const yAxis = new Vector3(0, 1, 0);

  armConfigs.forEach((config) => {
    const rotorX = config.cornerX + config.dirX * armLength;
    const rotorZ = config.cornerZ + config.dirZ * armLength;

    // Arm cylinder from fuselage corner to motor position
    const dx = rotorX - config.cornerX;
    const dz = rotorZ - config.cornerZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const arm = new Mesh(
      new CylinderGeometry(0.08, 0.08, dist, 6),
      armMaterial
    );
    arm.position.set(
      (config.cornerX + rotorX) / 2,
      0,
      (config.cornerZ + rotorZ) / 2
    );
    arm.quaternion.setFromUnitVectors(
      yAxis,
      new Vector3(dx, 0, dz).normalize()
    );
    group.add(arm);

    // Motor pod (small cylinder at arm tip)
    const motor = new Mesh(
      new CylinderGeometry(motorRadius, motorRadius, motorHeight, 8),
      motorMaterial
    );
    motor.position.set(rotorX, 0, rotorZ);
    group.add(motor);

    // Rotor disc (circle on top of motor)
    const rotor = new Mesh(new CircleGeometry(rotorRadius, 16), rotorMaterial);
    rotor.position.set(rotorX, motorHeight / 2 + 0.05, rotorZ);
    // YXZ order: Y rotation spins the disc, then X tilts it to horizontal
    rotor.rotation.order = 'YXZ';
    rotor.rotation.x = -Math.PI / 2;
    group.add(rotor);
    rotors.push(rotor);
  });

  // --- Landing skids (two horizontal bars under the body with struts) ---
  const skidMaterial = new MeshPhongMaterial({
    color: 0x666666,
    shininess: 40,
  });
  const skidLength = fuselageLength * 1.1;
  const skidRadius = 0.06;
  const skidY = -halfH - 0.4;
  const skidSpacing = halfW + 0.1;

  [-1, 1].forEach((side) => {
    // Horizontal skid bar (along Z axis)
    const skid = new Mesh(
      new CylinderGeometry(skidRadius, skidRadius, skidLength, 6),
      skidMaterial
    );
    skid.position.set(side * skidSpacing, skidY, 0);
    skid.quaternion.setFromUnitVectors(yAxis, new Vector3(0, 0, 1));
    group.add(skid);

    // Vertical struts connecting skid to fuselage
    const strutHeight = 0.4;
    [-0.6, 0.6].forEach((zOffset) => {
      const strut = new Mesh(
        new CylinderGeometry(0.04, 0.04, strutHeight, 4),
        skidMaterial
      );
      strut.position.set(side * skidSpacing, -halfH - strutHeight / 2, zOffset);
      group.add(strut);
    });
  });

  return { group, rotors };
}

export class DroneObject {
  private readonly group: Group;
  private readonly rotorMeshes: Mesh[];

  constructor() {
    const { group, rotors } = createDroneGeometry();
    this.group = group;
    this.rotorMeshes = rotors;
  }

  /**
   * Update drone visual position and orientation.
   *
   * @param x Three.js X position (= Mercator X)
   * @param y Three.js Y position (= elevation)
   * @param z Three.js Z position (= -Mercator Y)
   * @param azimuthDegrees Compass heading (0=North, 90=East, clockwise)
   * @param deltaTime Elapsed time in seconds for rotor animation
   */
  update(
    x: number,
    y: number,
    z: number,
    azimuthDegrees: number,
    deltaTime: number = 0
  ): void {
    this.group.position.set(x, y, z);

    // Azimuth increases clockwise, Three.js rotation.y increases counterclockwise
    const azimuthRad = (azimuthDegrees * Math.PI) / 180;
    this.group.rotation.order = 'YXZ';
    this.group.rotation.y = -azimuthRad;
    this.group.rotation.x = 0;
    this.group.rotation.z = 0;

    // Animate rotors: scroll texture UV instead of rotating geometry
    // This creates the illusion of spinning without geometry rotation
    const rotorSpeed = 0.5; // texture offset units per second
    this.rotorMeshes.forEach((rotor) => {
      const material = rotor.material as MeshPhongMaterial;
      if (material.map) {
        material.map.offset.x += rotorSpeed * deltaTime;
      }
    });
  }

  getMesh(): Object3D {
    return this.group;
  }

  dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
  }
}
