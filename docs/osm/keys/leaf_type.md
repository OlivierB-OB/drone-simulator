# leaf:type

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:leaf:type

## Definition
Specifies the botanical classification of tree foliage based on leaf morphology. Indicates whether a tree has broad leaves (deciduous/broadleaf) or needle-like leaves (coniferous).

## Data Type
String value representing the leaf classification. Applied to tree nodes and wooded areas/ways.

## Leaf Type Classifications

**Primary Types:**
- `broadleaf` - Broad-leaved trees (deciduous or evergreen)
- `coniferous` - Needle/scale-leaved trees (mostly evergreen)
- `mixed` - Mixed broadleaf and coniferous forest

**Specialized Types:**
- `palmae` - Palm trees
- `needleleaf` - Coniferous needle-leaf (synonym for coniferous)

## Format

**Standard usage:**
- `leaf:type=broadleaf` - Broadleaf/deciduous trees
- `leaf:type=coniferous` - Coniferous/evergreen trees
- `leaf:type=mixed` - Mixed forest composition

**Combined with deciduousness:**
- Often paired with `leaf:cycle` tag for complete classification

## Usage Notes

- Applied to individual tree nodes and wooded areas
- Always combine with `leaf:cycle` for complete seasonal information
- Usually paired with `natural=tree` or `natural=wood`
- Helps distinguish tree types for rendering and ecological purposes
- Relevant for seasonal vegetation changes

## Related Tags
- `leaf:cycle` - Seasonality of foliage (deciduous/evergreen)
- `natural` - Natural feature type (tree, wood, forest)
- `species` - Specific tree species
- `height` - Tree height in meters
- `diameter:crown` - Crown diameter for individual trees
- `circumference` - Tree girth measurement

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:leaf:type)
- [leaf:cycle tag documentation](leaf_cycle.md)
- [natural tag documentation](natural.md)
