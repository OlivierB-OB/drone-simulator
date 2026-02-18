import { Group, Mesh } from 'three';

export interface DroneGeometryResult {
  group: Group;
  rotors: Mesh[];
}
