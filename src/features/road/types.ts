import type { LineString } from 'geojson';
import type { HexColor } from '../sharedTypes';

/**
 * Visual properties for roads - focused on rendering: shape, width, lanes, color
 */
export interface RoadVisual {
  id: string;
  geometry: LineString;
  type: string; // Road category: primary, secondary, residential, motorway, etc.
  widthMeters: number; // Real-world width in meters derived from road type
  laneCount?: number; // Number of lanes if available
  color: HexColor; // Derived from road type
  surfaceColor?: HexColor; // Override color from surface tag (asphalt, concrete, etc.)
  bridge?: boolean; // bridge=yes
  layer?: number; // layer tag
}

export interface ModuleFeatures {
  roads: RoadVisual[];
}
