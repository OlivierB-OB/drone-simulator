import {
  Mesh,
  Group,
  Vector3,
  BoxGeometry,
  CylinderGeometry,
  CircleGeometry,
} from 'three';
import { DronePartMaterialFactory } from './DronePartMaterialFactory';
import { DroneRotorTextureFactory } from './DroneRotorTextureFactory';
import type { DroneGeometryResult } from '../types';

interface ArmConfig {
  dirX: number;
  dirZ: number;
  cornerX: number;
  cornerZ: number;
}

/**
 * Factory for creating drone geometry and mesh structure.
 * Assembles the complete drone visual from components.
 */
export class DroneGeometryFactory {
  constructor(
    private readonly MeshConstructor: typeof Mesh = Mesh,
    private readonly GroupConstructor: typeof Group = Group,
    private readonly Vector3Constructor: typeof Vector3 = Vector3,
    private readonly BoxGeometryConstructor: typeof BoxGeometry = BoxGeometry,
    private readonly CylinderGeometryConstructor: typeof CylinderGeometry = CylinderGeometry,
    private readonly CircleGeometryConstructor: typeof CircleGeometry = CircleGeometry,
    private readonly materialFactory: DronePartMaterialFactory = new DronePartMaterialFactory(),
    private readonly textureFactory: DroneRotorTextureFactory = new DroneRotorTextureFactory()
  ) {}

  createDroneGeometry(): DroneGeometryResult {
    const group = new this.GroupConstructor();
    const rotors: Mesh[] = [];

    // Local space: -Z = forward (North), +X = right (East), +Y = up

    this.createFuselage(group);
    this.createFrontIndicator(group);
    this.createArmsAndRotors(group, rotors);
    this.createLandingSkids(group);

    return { group, rotors };
  }

  private createFuselage(group: Group): void {
    const fuselageWidth = 1.6;
    const fuselageHeight = 0.4;
    const fuselageLength = 2.2;

    const bodyMaterial = this.materialFactory.createBodyMaterial();
    const fuselage = new this.MeshConstructor(
      new this.BoxGeometryConstructor(
        fuselageWidth,
        fuselageHeight,
        fuselageLength
      ),
      bodyMaterial
    );
    group.add(fuselage);
  }

  private createFrontIndicator(group: Group): void {
    const fuselageWidth = 1.6;
    const fuselageHeight = 0.4;
    const fuselageLength = 2.2;
    const halfH = fuselageHeight / 2;
    const halfL = fuselageLength / 2;

    const indicatorMaterial = this.materialFactory.createIndicatorMaterial();
    const frontIndicator = new this.MeshConstructor(
      new this.BoxGeometryConstructor(
        fuselageWidth * 0.6,
        fuselageHeight * 0.5,
        0.15
      ),
      indicatorMaterial
    );
    frontIndicator.position.set(0, halfH * 0.2, -halfL - 0.075);
    group.add(frontIndicator);
  }

  private createArmsAndRotors(group: Group, rotors: Mesh[]): void {
    const fuselageWidth = 1.6;
    const fuselageLength = 2.2;
    const halfW = fuselageWidth / 2;
    const halfL = fuselageLength / 2;

    const armLength = 3.0;
    const diag = 1 / Math.SQRT2;

    const armConfigs: ArmConfig[] = [
      { dirX: +diag, dirZ: -diag, cornerX: +halfW, cornerZ: -halfL }, // Front-Right
      { dirX: -diag, dirZ: -diag, cornerX: -halfW, cornerZ: -halfL }, // Front-Left
      { dirX: +diag, dirZ: +diag, cornerX: +halfW, cornerZ: +halfL }, // Back-Right
      { dirX: -diag, dirZ: +diag, cornerX: -halfW, cornerZ: +halfL }, // Back-Left
    ];

    const armMaterial = this.materialFactory.createArmMaterial();
    const motorMaterial = this.materialFactory.createMotorMaterial();
    const rotorTexture = this.textureFactory.createRotorTexture();
    const rotorMaterial =
      this.materialFactory.createRotorMaterial(rotorTexture);

    const motorRadius = 0.3;
    const motorHeight = 0.35;
    const rotorRadius = 1.2;
    const yAxis = new this.Vector3Constructor(0, 1, 0);

    armConfigs.forEach((config) => {
      const rotorX = config.cornerX + config.dirX * armLength;
      const rotorZ = config.cornerZ + config.dirZ * armLength;

      // Arm cylinder from fuselage corner to motor position
      const dx = rotorX - config.cornerX;
      const dz = rotorZ - config.cornerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      const arm = new this.MeshConstructor(
        new this.CylinderGeometryConstructor(0.08, 0.08, dist, 6),
        armMaterial
      );
      arm.position.set(
        (config.cornerX + rotorX) / 2,
        0,
        (config.cornerZ + rotorZ) / 2
      );
      arm.quaternion.setFromUnitVectors(
        yAxis,
        new this.Vector3Constructor(dx, 0, dz).normalize()
      );
      group.add(arm);

      // Motor pod (small cylinder at arm tip)
      const motor = new this.MeshConstructor(
        new this.CylinderGeometryConstructor(
          motorRadius,
          motorRadius,
          motorHeight,
          8
        ),
        motorMaterial
      );
      motor.position.set(rotorX, 0, rotorZ);
      group.add(motor);

      // Rotor disc (circle on top of motor)
      const rotor = new this.MeshConstructor(
        new this.CircleGeometryConstructor(rotorRadius, 16),
        rotorMaterial
      );
      rotor.position.set(rotorX, motorHeight / 2 + 0.05, rotorZ);
      // YXZ order: Y rotation spins the disc, then X tilts it to horizontal
      rotor.rotation.order = 'YXZ';
      rotor.rotation.x = -Math.PI / 2;
      group.add(rotor);
      rotors.push(rotor);
    });
  }

  private createLandingSkids(group: Group): void {
    const fuselageWidth = 1.6;
    const fuselageHeight = 0.4;
    const fuselageLength = 2.2;
    const halfW = fuselageWidth / 2;
    const halfH = fuselageHeight / 2;

    const skidMaterial = this.materialFactory.createSkidMaterial();
    const skidLength = fuselageLength * 1.1;
    const skidRadius = 0.06;
    const skidY = -halfH - 0.4;
    const skidSpacing = halfW + 0.1;

    const yAxis = new this.Vector3Constructor(0, 1, 0);

    [-1, 1].forEach((side) => {
      // Horizontal skid bar (along Z axis)
      const skid = new this.MeshConstructor(
        new this.CylinderGeometryConstructor(
          skidRadius,
          skidRadius,
          skidLength,
          6
        ),
        skidMaterial
      );
      skid.position.set(side * skidSpacing, skidY, 0);
      skid.quaternion.setFromUnitVectors(
        yAxis,
        new this.Vector3Constructor(0, 0, 1)
      );
      group.add(skid);

      // Vertical struts connecting skid to fuselage
      const strutHeight = 0.4;
      [-0.6, 0.6].forEach((zOffset) => {
        const strut = new this.MeshConstructor(
          new this.CylinderGeometryConstructor(0.04, 0.04, strutHeight, 4),
          skidMaterial
        );
        strut.position.set(
          side * skidSpacing,
          -halfH - strutHeight / 2,
          zOffset
        );
        group.add(strut);
      });
    });
  }
}
