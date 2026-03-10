# Documentation Issues Index

Complete list of issues identified in the comprehensive documentation review. Each issue has its own dedicated file for detailed information.

## Quick Summary

| # | Issue | Severity | Status | Files Affected |
|---|-------|----------|--------|-----------------|
| 001 | Parameter naming inconsistency | HIGH | Open | 5 files |
| 002 | Tile size estimate conflicts | HIGH | Open | 4 files |
| 003 | Duplicate tile ring diagram | MEDIUM | Open | 2 files |
| 004 | Missing ElevationSampler docs | MEDIUM | Open | elevations.md |
| 005 | Fragile line number references | MEDIUM | Open | 3+ files |
| 006 | Code-documentation mismatches | MEDIUM | Open | Multiple |
| 007 | Missing canvas rendering docs | MEDIUM | Open | visualization/ |
| 008 | Web Mercator repetition | LOW | Closed | Multiple |
| 009 | Bidirectional linking gaps | LOW | Open | coordinate-system.md |

## Priority Tiers

### 🔴 Critical (Should Fix Immediately)
1. **001 - Parameter Naming Inconsistency**
   - Verify `src/config.ts` for actual parameter names
   - Update all docs to use consistent terminology
   - See: `001-parameter-naming-inconsistency.md`

2. **002 - Tile Size Estimate Conflicts**
   - Standardize all tile sizes to 1.22 km (exact) or ~2 km (rounded approximation)
   - Remove incorrect 2.1 km references
   - See: `002-tile-size-estimate-conflicts.md`

### 🟡 Important (Should Fix Soon)
3. **003 - Duplicate Tile Ring Diagram**
   - Remove redundant diagram from objects.md
   - Keep reference to single source of truth
   - See: `003-duplicate-tile-ring-diagram.md`

4. **005 - Fragile Line Number References**
   - Convert to stable function/method name references
   - Makes documentation resilient to refactoring
   - See: `005-fragile-line-number-references.md`

5. **006 - Code-Documentation Mismatches**
   - Verify key technical facts match implementation
   - Create verification checklist
   - See: `006-code-documentation-mismatches.md`

### 🟢 Nice to Have (Can Fix Later)
6. **004 - Missing ElevationSampler Documentation**
   - Add dedicated section in elevations.md
   - Document API, algorithm, edge cases
   - See: `004-missing-elevationsampler-documentation.md`

7. **007 - Missing Canvas Rendering Documentation**
   - Create new `doc/visualization/canvas-rendering.md` OR expand existing
   - Document pipeline, algorithms, coordinate transformation
   - See: `007-missing-canvas-rendering-documentation.md`

8. **009 - Bidirectional Linking Gaps**
   - Add "Related Documentation" sections to key files
   - Optional navigation enhancement
   - See: `009-orphaned-references-bidirectional-linking.md`

### ✅ Non-Issues
9. **008 - Web Mercator Explanation Repetition**
   - Repetition is acceptable and justified
   - Different contexts require self-contained explanations
   - No action needed
   - See: `008-webmercator-explanation-repetition.md`

## How to Use This Index

1. **Review each issue** by reading its dedicated markdown file
2. **Prioritize fixes** using the tiers above (Critical → Important → Nice to Have)
3. **Track fixes** as you address each issue
4. **Update this index** as issues are resolved

## Files in This Directory

- `001-parameter-naming-inconsistency.md` - Parameter naming across docs
- `002-tile-size-estimate-conflicts.md` - Conflicting spatial metrics
- `003-duplicate-tile-ring-diagram.md` - Redundant diagrams
- `004-missing-elevationsampler-documentation.md` - Missing API/algorithm docs
- `005-fragile-line-number-references.md` - Brittle code references
- `006-code-documentation-mismatches.md` - Truth verification checklist
- `007-missing-canvas-rendering-documentation.md` - Incomplete subsystem docs
- `008-webmercator-explanation-repetition.md` - Low-priority repetition (closed)
- `009-orphaned-references-bidirectional-linking.md` - Navigation improvements
- `INDEX.md` - This file

## Documentation Impact Summary

### Files Most Affected
1. `doc/data/contextual.md` - Issues: 002, 005, 006
2. `doc/visualization/objects.md` - Issues: 003, 004, 005
3. `doc/visualization/ground-surface.md` - Issues: 002, 005, 006
4. `doc/data/elevations.md` - Issues: 002, 004, 005
5. `CLAUDE.md` - Issues: 001, 005

### Systems Most Affected
1. **Tile Ring System** - Issues: 001, 002, 003
2. **Elevation Data** - Issues: 002, 004, 006
3. **Visualization** - Issues: 003, 005, 007
4. **Coordinate System** - Issues: 006, 009
5. **Animation Loop** - Issues: 005, 006

## Next Steps

1. **Start with Critical issues** (001, 002) - These block reader understanding
2. **Follow with Important issues** (003, 005, 006) - These improve code stability
3. **Address Nice to Have** (004, 007) - These expand documentation coverage
4. **Consider 009** - Navigation enhancement if documentation grows further

---

**Last reviewed**: 2026-03-10
**Review agent**: comprehensive documentation analysis
**Total issues found**: 9 (1 closed, 8 open)
