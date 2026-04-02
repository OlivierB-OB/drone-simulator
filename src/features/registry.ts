import type { Object3D } from 'three';
import type { CanvasDrawContext } from './types';
import type { ElevationSampler } from '../visualization/mesh/util/ElevationSampler';
import type { GeoCoordinates, GeoBounds } from '../gis/GeoCoordinates';
import type { ModulesFeatures } from './registrationTypes';
import { MODULES } from './registration';
import type { Geometry } from 'geojson';
import booleanIntersects from '@turf/boolean-intersects';
import { polygon } from '@turf/helpers';

export class FeatureModuleRegistry {
  private readonly modules = MODULES;

  modulesFeaturesFactory(): ModulesFeatures {
    return this.modules.reduce(
      (res, mod) => ({ ...res, ...mod.moduleFeaturesFactory() }),
      {} as ModulesFeatures
    );
  }

  runPostProcessing(features: ModulesFeatures): void {
    for (const mod of this.modules) {
      mod.postProcess?.(features);
    }
  }

  getCanvasModules(): typeof MODULES {
    return this.modules
      .filter((m) => m.drawCanvas && m.canvasOrder !== undefined)
      .sort((a, b) => a.canvasOrder! - b.canvasOrder!);
  }

  getMeshModules(): typeof MODULES {
    return this.modules.filter((m) => m.createMeshes);
  }

  createAllMeshes(
    features: ModulesFeatures,
    elevationSampler: ElevationSampler,
    origin: GeoCoordinates
  ): Object3D[] {
    const meshes: Object3D[] = [];
    for (const mod of this.getMeshModules()) {
      meshes.push(...mod.createMeshes!(features, elevationSampler, origin));
    }
    return meshes;
  }

  filterFeatures(features: ModulesFeatures, bounds: GeoBounds): ModulesFeatures {
    const raw = features as unknown as Record<string, unknown[]>;
    const result = Object.fromEntries(
      Object.entries(raw).map(([k, arr]) => [k, [...arr]])
    ) as unknown as Record<string, unknown[]>;

    const { minLng, minLat, maxLng, maxLat } = bounds;
    const boundsPolygon = polygon([
      [
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ],
    ]);

    const customKeys = new Set<string>();
    for (const mod of this.modules) {
      if (mod.filterFeatures) {
        Object.keys(mod.moduleFeaturesFactory()).forEach((k) =>
          customKeys.add(k)
        );
      }
    }

    for (const key of Object.keys(result)) {
      if (!customKeys.has(key)) {
        const arr = result[key] as Array<{ geometry: Geometry }>;
        result[key] = arr.filter((f) =>
          booleanIntersects(f.geometry, boundsPolygon)
        );
      }
    }

    const typedResult = result as unknown as ModulesFeatures;
    for (const mod of this.modules) {
      mod.filterFeatures?.(typedResult, bounds);
    }

    return typedResult;
  }

  drawAllCanvas(features: ModulesFeatures, draw: CanvasDrawContext): void {
    for (const mod of this.getCanvasModules()) {
      mod.drawCanvas!(features, draw);
    }
  }
}

export const featureRegistry = new FeatureModuleRegistry();
