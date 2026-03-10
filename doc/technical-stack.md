# Technical Stack - Architecture Decision Records

## Overview

This document records the key technology decisions made for the drone simulator project. Each entry includes the technology, version, and the rationale behind the choice.

---

## Frontend Framework

### Decision: SolidJS 1.9

**Rationale:**
- Fine-grained reactivity model eliminates virtual DOM overhead
- Compiler-optimized JSX produces efficient DOM operations
- Minimal bundle footprint (~10KB) critical for browser performance
- Static component rendering model aligns with initialization-heavy architecture

**Constraints Addressed:**
- SolidJS's reactive primitives not needed; static initialization with lifecycle hooks (`onMount`, `onCleanup`) sufficient for resource management

---

## 3D Graphics Engine

### Decision: Three.js 0.160

**Rationale:**
- Industry-standard abstraction over WebGL, reducing complexity while maintaining performance
- Extensive ecosystem of examples and community plugins
- Scene graph abstraction enables clean separation of camera, lighting, meshes, and materials
- Constructor injection pattern enables testability without sacrificing architectural clarity

**Constraints Addressed:**
- Custom shaders can be added if performance optimization needed in future
- Supports dynamic mesh generation (terrain tiles, OSM buildings)

---

## Language & Type System

### Decision: TypeScript 5.9 (Strict Mode)

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

### Decision: Vite 7.3

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

### Decision: Vitest 4.0

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

### Decision: happy-dom 20.6

**Rationale:**
- Lightweight implementation (~20× faster than jsdom) enables rapid test execution
- Sufficient coverage of DOM APIs for component logic testing
- Lower memory footprint supports running full test suites locally

**Constraints Addressed:**
- Not intended for pixel-perfect rendering tests; sufficient for logic-focused unit tests
- Three.js canvas rendering excluded from test scope; covered by integration tests

---

## Code Linting

### Decision: ESLint 10.0 (with @typescript-eslint)

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

### Decision: Prettier 3.8

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
| **UI Framework** | SolidJS 1.9 | Fine-grained reactivity, compiler-optimized rendering, minimal bundle size |
| **3D Graphics** | Three.js 0.160 | Industry-standard WebGL abstraction, scene graph, extensible |
| **Language** | TypeScript 5.9 | Static typing, strict mode, IDE support, type safety |
| **Build** | Vite 7.3 | ESM-native, instant HMR, zero-config, optimized production output |
| **Runtime & PM** | Bun | All-in-one tool, 25× faster, npm-compatible, native TS support |
| **Testing** | Vitest 4.0 | Vite-native, Jest-compatible, shared config, fast execution |
| **Test DOM** | happy-dom | Lightweight, fast, sufficient for logic testing |
| **Linting** | ESLint 10.0 | TypeScript-aware, rule-based, auto-fix, flat config |
| **Formatting** | Prettier 3.8 | Opinionated, minimal config, language-agnostic, IDE support |
| **Modules** | ESM | Native browser support, tree-shakeable, modern ecosystem |
