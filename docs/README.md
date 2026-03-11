# Documentation Index

Organized by task/question. Start here to find the right doc.

| Topic | File | Description |
|-------|------|-------------|
| System overview | [overview.md](overview.md) | What the simulator does and its goals |
| Architecture & components | [architecture.md](architecture.md) | Components, dependencies, initialization order |
| Coordinate system | [coordinate-system.md](coordinate-system.md) | **Critical:** Mercator ↔ Three.js conversion, Z-negation |
| Animation frame sequence | [animation-loop.md](animation-loop.md) | 9-step frame order, event-driven orchestration |
| Data pipeline pattern | [data-pipeline.md](data-pipeline.md) | Four-stage pipeline used across all data systems |
| Tile ring system | [tile-ring-system.md](tile-ring-system.md) | Spatial tile loading/eviction around drone |
| Design patterns | [patterns.md](patterns.md) | Observer, Factory, and other patterns used |
| Technical stack | [technical-stack.md](technical-stack.md) | ADRs for SolidJS, Three.js, Bun, Vite choices |
| Glossary | [glossary.md](glossary.md) | Definitions for all technical terms |
| **Elevation data** | [data/README.md](data/README.md) | Terrain height fetching, decoding, sampling |
| **Visualization** | [visualization/README.md](visualization/README.md) | Ground surface, canvas textures, 3D objects |
| **OSM reference** | [osm/README.md](osm/README.md) | OSM tagging reference for features and keys |
