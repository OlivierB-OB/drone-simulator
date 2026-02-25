# Key: `tree_lined` — Trees Along a Feature

> Source: https://wiki.openstreetmap.org/wiki/Key:tree_lined

## Description

Indicates that trees have been deliberately planted along the sides of a feature,
typically a highway way or waterway. The tag implies purposeful placement — an avenue
or boulevard effect — not merely trees that happen to be nearby.

Do **not** apply when trees are already mapped as separate `natural=tree_row` or
`natural=tree` objects alongside the road; use `tree_lined=separate` in that case.

## Values

| Value | Meaning |
|-------|---------|
| `both` | Trees on both sides of the way |
| `left` | Trees on the left side only (relative to way direction) |
| `right` | Trees on the right side only (relative to way direction) |
| `yes` | Trees present, side unspecified — treated as `both` for rendering |
| `no` | No trees (explicit absence, overrides any default assumption) |
| `separate` | Trees already mapped separately; no auto-generated tree meshes |

## Element Types

- **Way**: ✓ — primary use case (highway, waterway)
- **Node**: ✗
- **Area**: ✗
- **Relation**: ✗ (except multipolygon relations representing a way)

## Common Combinations

- `highway=*` + `tree_lined=*` — tree-lined road or path
- `waterway=*` + `tree_lined=*` — trees along a canal or river bank

## Status

De facto (community-established practice)

## Common Mistakes

- Using `tree_lined=yes` when a specific directional value (`both`, `left`, `right`)
  is known — prefer the directional value.
- Tagging trees that are not deliberately planted to flank the feature.
- Applying to nodes or area polygons (the key belongs on the linear way).

## Related Tags

- [`natural=tree_row`](natural.md) — explicitly mapped row of trees along a line
- [`natural=tree`](natural.md) — individual tree node
- `denotation=avenue` — alternative tag on tree rows indicating roadside planting

## Rendering

See [visual-specifications.md §7.5](../visual-specifications.md) for the instanced-tree
mesh generation rules. Road canvas appearance (color, width) is unchanged — only 3D
tree meshes are added.
