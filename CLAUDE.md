# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Linting and code quality
npm run lint
npm run format

# TypeScript compilation check
npx tsc --noEmit
```

## Project Architecture

This is a Next.js 14 TypeScript application that renders interactive Mandelbrot set fractals using Canvas API. Key architectural decisions:

### Core Rendering System
- **FractalRenderer** (`src/lib/fractalRenderer.ts`): Canvas-based rendering engine with progressive rendering and cancellation support
- **Mandelbrot calculations** (`src/lib/mandelbrot.ts`): Core mathematical functions for fractal generation
- **ZoomPanManager** (`src/lib/zoomPan.ts`): Interactive controls for navigation
- **ColorMapping** (`src/lib/colorMapping.ts`): Dynamic color schemes for visualization

### State Management Pattern
The main page (`src/app/page.tsx`) uses React hooks for:
- `bounds`: Current fractal view coordinates (FractalBounds)
- `isRendering/progress`: Rendering state and progress tracking
- Parameter controls: iterations, color schemes, canvas resolution
- Preset system: Built-in and custom fractal configurations

### Component Structure
- **UI Components** (`src/components/ui/`): Reusable form controls (Slider, Select, Input, Button)
- **Specialized Controls**: ZoomDisplay, CenterControls, PresetSelector, CustomPresetManager
- **Layout**: Single-page application with side-by-side canvas and control panels

### Performance Optimizations
- Progressive rendering with chunked calculations to avoid UI blocking
- Cancellable rendering operations when parameters change
- RequestAnimationFrame for smooth updates
- Canvas ImageData direct pixel manipulation

## Next.js Configuration

The application uses Next.js with these key settings:
- `output: 'standalone'` for Docker deployment
- TypeScript with strict mode enabled
- Path aliases configured (`@/*` maps to `./src/*`)
- Tailwind CSS for styling

## Testing and Quality

Currently uses ESLint for code quality. The CI pipeline runs:
```bash
npm ci
npm run build
npm run lint
npx tsc --noEmit
```

## Deployment

### Docker Configuration
- Multi-stage Dockerfile optimized for GCP Cloud Run
- Standalone Next.js output for minimal container size
- Runs on port 8080 with non-root user for security

### CI/CD Pipeline
Bitbucket Pipelines configuration builds and tests on every commit:
- Node.js 20 Alpine image
- Parallel build, lint, and type checking
- No automated deployment (manual deployment via tf-devops toolchain)