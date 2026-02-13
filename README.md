# Drone Simulator

A 3D drone simulator web application built with SolidJS, Three.js, TypeScript, Vite, ESLint, and Prettier.

## Prerequisites

- [Bun](https://bun.com) v1.3.9 or later

## Getting Started

### Install Dependencies

```bash
bun install
```

### Development

Start the development server:

```bash
bun run dev
```

The app will be available at `http://localhost:3000`

### Build

Create an optimized production build:

```bash
bun run build
```

The output will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
bun run preview
```

## Code Quality

### Linting

Check for code quality issues:

```bash
bun run lint
```

Auto-fix linting issues:

```bash
bun run lint:fix
```

### Formatting

Format code with Prettier:

```bash
bun run format
```

Check formatting without modifying files:

```bash
bun run format:check
```

## Project Structure

```
drone-simulator/
├── src/
│   ├── index.tsx                 # SolidJS entry point
│   ├── App.tsx                   # Main application component
│   ├── config.ts                 # Drone configuration (speed, position, etc.)
│   ├── 3Dviewer/                 # Three.js rendering system
│   │   ├── Viewer3D.ts
│   │   ├── Camera.ts
│   │   ├── Scene.ts
│   │   └── Renderer.ts
│   ├── drone/                    # Drone simulation logic
│   │   ├── Drone.ts              # Drone state and physics
│   │   └── DroneController.ts    # Keyboard/mouse input handling
│   ├── core/                     # Core systems
│   │   └── AnimationLoop.ts      # Frame timing and loop management
│   └── styles.css                # Global styles
├── index.html                    # HTML template
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.js              # ESLint configuration
├── .prettierrc.json              # Prettier configuration
└── package.json                  # Dependencies and scripts
```

## Tech Stack

- **SolidJS** 1.9 - Reactive UI library
- **Three.js** 0.160 - 3D graphics rendering
- **TypeScript** 5.9 - Type safety
- **Vite** 7.3 - Build tool and dev server
- **ESLint** 10 - Code linting
- **Prettier** 3.8 - Code formatting
- **Bun** - JavaScript runtime and package manager

## License

MIT
