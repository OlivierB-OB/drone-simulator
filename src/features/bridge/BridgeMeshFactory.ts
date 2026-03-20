import { BoxGeometry, MeshLambertMaterial, Mesh, type Object3D } from 'three';
import type { RoadVisual } from '../road/types';
import type { RailwayVisual } from '../railway/types';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import {
  geoToLocal,
  EARTH_RADIUS,
  type GeoCoordinates,
} from '../../gis/GeoCoordinates';

const TO_RAD = Math.PI / 180;
const BRIDGE_COLOR = '#b0a898';
const DECK_THICKNESS = 0.5;
const DECK_MARGIN = 2; // meters wider than road/rail on each side
const LAYER_HEIGHT = 5; // meters per layer

/**
 * Creates 3D bridge deck meshes for roads and railways with bridge=true.
 * Renders flat decks elevated by layer tag above terrain.
 *
 * Coordinates are [lng, lat] in degrees (GeoJSON convention).
 */
export class BridgeMeshFactory {
  private readonly material = new MeshLambertMaterial({ color: BRIDGE_COLOR });

  constructor(private readonly elevation: ElevationSampler) {}

  createFromRoads(roads: RoadVisual[], origin: GeoCoordinates): Object3D[] {
    const meshes: Object3D[] = [];
    for (const road of roads) {
      if (!road.bridge) continue;
      meshes.push(
        ...this.createDeckSegments(
          road.geometry.coordinates as [number, number][],
          road.widthMeters + DECK_MARGIN * 2,
          road.layer ?? 1,
          origin
        )
      );
    }
    return meshes;
  }

  createFromRailways(
    railways: RailwayVisual[],
    origin: GeoCoordinates
  ): Object3D[] {
    const meshes: Object3D[] = [];
    for (const railway of railways) {
      if (!railway.bridge) continue;
      meshes.push(
        ...this.createDeckSegments(
          railway.geometry.coordinates as [number, number][],
          railway.widthMeters + DECK_MARGIN * 2,
          railway.layer ?? 1,
          origin
        )
      );
    }
    return meshes;
  }

  private createDeckSegments(
    coords: [number, number][],
    deckWidth: number,
    layer: number,
    origin: GeoCoordinates
  ): Mesh[] {
    if (coords.length < 2) return [];

    const segments: Mesh[] = [];
    const layerOffset = layer * LAYER_HEIGHT;

    for (let i = 0; i < coords.length - 1; i++) {
      const [lng1, lat1] = coords[i]!;
      const [lng2, lat2] = coords[i + 1]!;

      const midLat = (lat1 + lat2) / 2;
      const cosLat = Math.cos(midLat * TO_RAD);

      const dEast = (lng2 - lng1) * TO_RAD * EARTH_RADIUS * cosLat;
      const dNorth = (lat2 - lat1) * TO_RAD * EARTH_RADIUS;
      const segmentLength = Math.sqrt(dEast * dEast + dNorth * dNorth);
      if (segmentLength < 0.1) continue;

      const midLng = (lng1 + lng2) / 2;
      const terrainY = this.elevation.sampleAt(midLat, midLng);
      const angle = Math.atan2(dEast, dNorth);

      const geometry = new BoxGeometry(
        deckWidth,
        DECK_THICKNESS,
        segmentLength
      );
      const mesh = new Mesh(geometry, this.material);
      const pos = geoToLocal(midLat, midLng, terrainY + layerOffset, origin);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.y = -angle;
      segments.push(mesh);
    }

    return segments;
  }
}
