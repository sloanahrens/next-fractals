# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting and code quality
npm run lint
npm run format

# TypeScript compilation check
npx tsc --noEmit

# Docker commands for testing CI/CD locally
docker run --rm -v $(pwd):/app -w /app node:20-alpine sh -c "npm ci && npm run build && npm run lint && npx tsc --noEmit"

# Build and test production Docker image
docker build --platform linux/amd64 -t fractals-nextjs:test -f Dockerfile .
docker run --rm -p 8080:8080 fractals-nextjs:test
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
- `poweredByHeader: false` for security
- `reactStrictMode: true` for development checks
- `swcMinify: true` for production optimization
- TypeScript with strict mode enabled
- Path aliases configured (`@/*` maps to `./src/*`)
- Tailwind CSS with custom HSL color variables for theming

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
Bitbucket Pipelines configuration with parallel execution:
1. **Build and Test Step**: Node.js 20 Alpine image runs `npm ci`, `npm run build`, `npm run lint`, and `npx tsc --noEmit`
2. **Deploy Step**: Automated deployment to GCP Cloud Run using tf-devops toolchain
   - Clones external devops repository: `nextjs-tf-gcp-demo`
   - Builds DevOps container and validates bootstrap infrastructure
   - Normalizes branch names for image tagging
   - Builds multi-stage Docker images and pushes to Artifact Registry
   - Deploys to Cloud Run with branch-specific URLs
   - **Health Check**: Automatically tests deployment with retries (up to 30 seconds) to verify the service is responding with HTTP 200