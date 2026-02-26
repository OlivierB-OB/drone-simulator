import type { ContextDataTile, StructureVisual } from '../types';
import type { ClassifiedGeometry } from './parserUtils';
import { structureDefaults } from '../../../config';

const STRUCTURE_TYPES = new Set([
  'tower',
  'chimney',
  'mast',
  'communications_tower',
  'water_tower',
  'silo',
  'storage_tank',
  'lighthouse',
  'crane',
]);

/**
 * Returns the structure type key from OSM tags, or null if not a structure.
 */
function getStructureType(tags: Record<string, string>): string | null {
  if (tags.man_made && STRUCTURE_TYPES.has(tags.man_made)) {
    return tags.man_made;
  }
  if (tags.power === 'tower') return 'power_tower';
  if (tags.power === 'pole') return 'power_pole';
  if (tags.aerialway === 'pylon') return 'aerialway_pylon';
  return null;
}

export { STRUCTURE_TYPES };

export function classifyStructure(
  id: string,
  tags: Record<string, string>,
  geometry: ClassifiedGeometry,
  features: ContextDataTile['features']
): void {
  const structureType = getStructureType(tags);
  if (!structureType) return;

  const defaults = structureDefaults[structureType];
  if (!defaults) return;

  const geom = geometry.point ?? geometry.polygon;
  if (!geom) return;

  const structure: StructureVisual = {
    id,
    geometry: geom,
    type: structureType,
    height: tags.height ? parseFloat(tags.height) : undefined,
    diameter:
      (structureType === 'storage_tank' || structureType === 'silo') &&
      tags.diameter
        ? parseFloat(tags.diameter)
        : undefined,
    color: defaults.color,
  };
  features.structures.push(structure);
}
