import { BoxGeometry, MeshLambertMaterial, Mesh, type Object3D } from 'three';
import type { RoadVisual, RailwayVisual } from '../../../data/contextual/types';
import type { ElevationSampler } from '../util/ElevationSampler';

const BRIDGE_COLOR = '#b0a898';
const DECK_THICKNESS = 0.5;
const DECK_MARGIN = 2; // meters wider than road/rail on each side
const LAYER_HEIGHT = 5; // meters per layer

/**
 * Creates 3D bridge deck meshes for roads and railways with bridge=true.
 * Renders flat decks elevated by layer tag above terrain.
 */
export class BridgeMeshFactory {
  private readonly material = new MeshLambertMaterial({ color: BRIDGE_COLOR });

  constructor(private readonly elevation: ElevationSampler) {}

  createFromRoads(roads: RoadVisual[]): Object3D[] {
    const meshes: Object3D[] = [];
    for (const road of roads) {
      if (!road.bridge) continue;
      meshes.push(
        ...this.createDeckSegments(
          road.geometry.coordinates,
          road.widthMeters + DECK_MARGIN * 2,
          road.layer ?? 1
        )
      );
    }
    return meshes;
  }

  createFromRailways(railways: RailwayVisual[]): Object3D[] {
    const meshes: Object3D[] = [];
    for (const railway of railways) {
      if (!railway.bridge) continue;
      meshes.push(
        ...this.createDeckSegments(
          railway.geometry.coordinates,
          railway.widthMeters + DECK_MARGIN * 2,
          railway.layer ?? 1
        )
      );
    }
    return meshes;
  }

  private createDeckSegments(
    coords: [number, number][],
    deckWidth: number,
    layer: number
  ): Mesh[] {
    if (coords.length < 2) return [];

    const segments: Mesh[] = [];
    const layerOffset = layer * LAYER_HEIGHT;

    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = coords[i]!;
      const [x2, y2] = coords[i + 1]!;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      if (segmentLength < 0.1) continue;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const terrainY = this.elevation.sampleAt(midX, midY);
      const angle = Math.atan2(dx, dy);

      const geometry = new BoxGeometry(
        deckWidth,
        DECK_THICKNESS,
        segmentLength
      );
      const mesh = new Mesh(geometry, this.material);
      mesh.position.set(midX, terrainY + layerOffset, -midY);
      mesh.rotation.y = -angle;
      segments.push(mesh);
    }

    return segments;
  }
}
