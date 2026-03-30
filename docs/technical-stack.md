# Technical Stack - Architecture Decision Records

## Overview

This document records the key technology decisions made for the drone simulator project. Each entry includes the technology and the rationale behind the choice.

> **Note:** This document focuses on technology choices and architectural rationale. For current version information, see [`package.json`](../package.json) (dependencies and devDependencies).

---

## Frontend Framework

### Decision: SolidJS

**Rationale:**
- Fine-grained reactivity model eliminates virtual DOM overhead
- Compiler-optimized JSX produces efficient DOM operations
- Minimal bundle footprint (~10KB) critical for browser performance
- Static component rendering model aligns with initialization-heavy architecture

**Constraints Addressed:**
- SolidJS's reactive primitives not needed; static initialization with lifecycle hooks (`onMount`, `onCleanup`) sufficient for resource management

---

## 3D Graphics Engine

### Decision: Three.js

**Rationale:**
- Industry-standard abstraction over WebGL, reducing complexity while maintaining performance
- Extensive ecosystem of examples and community plugins
- Scene graph abstraction enables clean separation of camera, lighting, meshes, and materials
- Constructor injection pattern enables testability without sacrificing architectural clarity

**Constraints Addressed:**
- Custom shaders can be added if performance optimization needed in future
- Supports dynamic mesh generation (terrain tiles, buildings)

---

## Language & Type System

### Decision: TypeScript (Strict Mode)

**Rationale:**
- Static type checking catches errors at compile-time, reducing runtime failures
- Type annotations serve as inline documentation for function contracts
- IDE support (autocomplete, refactoring) improves developer velocity
- Strict null checks prevent entire categories of null reference bugs

**Constraints Addressed:**
- No `any` types permitted; enforced via ESLint rules
- Zero JavaScript/Node.js compatibility concerns; ESM-only codebase

---

## Build Tool

### Decision: Vite

**Rationale:**
- Native ES module support in dev mode eliminates bundling overhead, enabling instant feedback
- Hot Module Replacement (HMR) enables iterative development without full page reloads
- Zero-config operation with sensible defaults reduces maintenance burden
- Rollup-based production builds ensure optimized output (tree-shaking, code-splitting, minification)

**Constraints Addressed:**
- SolidJS plugin (`vite-plugin-solid`) handles JSX transformation
- Dev server configured for localhost:3000 with auto-open enabled

---

## Package Manager & Runtime

### Decision: Bun (Latest Stable)

**Rationale:**
- Single tool combines package manager (npm), JavaScript runtime, and bundler
- Binary implementation (~25× faster than npm) critical for rapid iteration in CI/CD
- Drop-in npm-compatible interface; no migration friction
- Native TypeScript support eliminates transpilation step for scripting

**Constraints Addressed:**
- Binary `.bun.lock` format provides faster lockfile parsing and improved security
- ESM-only codebase; no CommonJS compatibility needed

---

## Testing Framework

### Decision: Vitest

**Rationale:**
- Vite-native test runner shares configuration (tsconfig.json, vite.config.ts), eliminating duplication
- Jest-compatible API enables familiar testing patterns and easy migration from Jest
- Intelligent test watching reruns only affected tests on file changes
- Built-in v8 coverage provider with HTML reporter

**Constraints Addressed:**
- happy-dom environment provides lightweight DOM implementation sufficient for unit/integration testing
- Constructor injection pattern enables mocking Three.js classes without external libraries

---

## DOM Implementation for Tests

### Decision: happy-dom

**Rationale:**
- Lightweight implementation (~20× faster than jsdom) enables rapid test execution
- Sufficient coverage of DOM APIs for component logic testing
- Lower memory footprint supports running full test suites locally

**Constraints Addressed:**
- Not intended for pixel-perfect rendering tests; sufficient for logic-focused unit tests
- Three.js canvas rendering excluded from test scope; covered by integration tests

---

## CSS Framework

### Decision: Tailwind CSS

**Rationale:**
- Utility-first approach eliminates custom stylesheet maintenance and keeps styles co-located with markup
- v4 uses a CSS-first config model — no `tailwind.config.js` required; configuration lives in the stylesheet
- `@tailwindcss/vite` plugin integrates directly with the Vite build pipeline (no PostCSS config needed)

**Constraints Addressed:**
- SolidJS JSX templates use Tailwind classes directly; no CSS modules or styled-components needed
- Works alongside the existing Vite 7 setup without additional configuration overhead

---

## Geospatial Libraries

### Decision: Turf.js + PMTiles + Vector Tile Stack

**Rationale:**

**Turf.js (`@turf/*` — 10 modular packages):**
- Modular geospatial math library; only the functions used are imported (tree-shakeable)
- Covers area, bearing, centroid, distance, boolean containment, point grids, line slicing — all needed for GIS feature processing
- Operates on standard GeoJSON; no custom format conversion

**PMTiles:**
- Single-file tile archive format that the browser can fetch range-requests against directly
- Eliminates the need for a tile server; Overture Maps tiles are served as a static `.pmtiles` file
- Native browser support with the `pmtiles` JS library

**`@mapbox/vector-tile` + `pbf`:**
- Decode Mapbox Vector Tile (MVT) binary format extracted from the PMTiles archive
- `pbf` handles Protocol Buffer deserialization; `@mapbox/vector-tile` wraps it with a GeoJSON-compatible API
- Used in `ContextDataManager` / `OvertureParser` to convert raw tile bytes into feature geometries

**Constraints Addressed:**
- No tile server infrastructure required; all geospatial data is fetched client-side
- Turf's modular imports keep bundle size minimal despite broad geospatial coverage

---

## UI Components

### Decision: Kobalte + solid-icons

**Rationale:**

**`@kobalte/core`:**
- Accessible, unstyled SolidJS component primitives (Dialog, Popover, etc.)
- Provides WAI-ARIA compliance out of the box without dictating visual design
- Styled with Tailwind CSS classes; no style conflicts with the utility-first approach

**`solid-icons`:**
- Tree-shakeable icon set built for SolidJS; renders icons as optimized SVG components
- Used in the Header and location search UI

**Constraints Addressed:**
- No React dependency; Kobalte and solid-icons are SolidJS-native
- Zero runtime overhead for unused icons due to named imports

---

## Code Linting

### Decision: ESLint (with @typescript-eslint)

**Rationale:**
- Flat config format (`eslint.config.js`) improves readability and configurability over legacy .eslintrc
- TypeScript-aware rules via `@typescript-eslint` plugin catch type-related anti-patterns
- ESLint's rule-based system enables fine-grained control over code quality standards
- Auto-fix capability (`--fix`) eliminates manual correction of common violations

**Constraints Addressed:**
- No `any` types enforced; strict type checking required across codebase
- SolidJS-specific rules applied via `eslint-plugin-solid`

---

## Code Formatter

### Decision: Prettier

**Rationale:**
- Opinionated formatting eliminates bikeshedding on style choices
- Minimal configuration approach (single `.prettierrc.json`) reduces maintenance
- Language-agnostic support (JavaScript, TypeScript, JSON, Markdown, YAML)
- IDE integration broadly available

**Configuration Choices:**
- 80-character line width: balance readability with split-screen development
- 2-space indentation: consistency with project convention
- Double quotes: improved accessibility over single quotes
- Trailing commas: cleaner diffs in version control
- Semicolons: explicit statement termination for clarity

---

## Dependency Management

### Decision: Bun Lockfile (`.bun.lock`)

**Rationale:**
- Binary format significantly faster to parse than JSON-based lockfiles
- Deterministic and reproducible builds across environments
- Improved security through cryptographic checksums
- Native format for Bun; no compatibility layer needed

**Constraints Addressed:**
- Traditional `package-lock.json` not generated; `.bun.lock` is source of truth
- Requires Bun installation; npm/yarn no longer supported

---

## Module System

### Decision: ESM (ECMAScript Modules)

**Rationale:**
- Native browser modules enable dev-time bundling-free operation (critical for Vite)
- Static analysis of imports enables tree-shaking and dead code elimination
- Aligns with modern JavaScript ecosystem standards

**Constraints Addressed:**
- `"type": "module"` in package.json enforces ESM for all `.js` and `.ts` files
- CommonJS dependencies handled by bundler; no interop concerns

---

## TypeScript Configuration Rationale

### Strict Mode Enabled

**Rationale:**
- `--strictNullChecks`: Catch null/undefined errors at compile-time
- `--noImplicitAny`: Require explicit type annotations, improving code clarity
- JSX preserved (SolidJS JSX compiler handles transformation)
- ESNext target: Modern JavaScript features, transpilation handled by Vite

---

## Summary of Key Decisions

| Category | Technology | Key Rationale |
|----------|-----------|---------------|
| **UI Framework** | SolidJS | Fine-grained reactivity, compiler-optimized rendering, minimal bundle size |
| **3D Graphics** | Three.js | Industry-standard WebGL abstraction, scene graph, extensible |
| **Language** | TypeScript | Static typing, strict mode, IDE support, type safety |
| **Build** | Vite | ESM-native, instant HMR, zero-config, optimized production output |
| **Runtime & PM** | Bun | All-in-one tool, 25× faster, npm-compatible, native TS support |
| **Testing** | Vitest | Vite-native, Jest-compatible, shared config, fast execution |
| **Test DOM** | happy-dom | Lightweight, fast, sufficient for logic testing |
| **CSS** | Tailwind CSS | Utility-first, CSS-first config, Vite-native plugin |
| **Geospatial** | Turf.js + PMTiles | Modular GIS math, serverless tile access, MVT decoding |
| **UI Components** | Kobalte + solid-icons | Accessible SolidJS primitives, tree-shakeable icons |
| **Linting** | ESLint | TypeScript-aware, rule-based, auto-fix, flat config |
| **Formatting** | Prettier | Opinionated, minimal config, language-agnostic, IDE support |
| **Modules** | ESM | Native browser support, tree-shakeable, modern ecosystem |
