# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next Fractals is an interactive Mandelbrot set generator built with Next.js 14, TypeScript, and Web Workers for performant fractal calculations. The application features real-time rendering, smooth zoom/pan controls, and customizable presets.

## Commands

### Development
- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with Next.js configuration
- `npm run format` - Format code with Prettier
- `npx tsc --noEmit` - Type-check without emitting files

### Testing Individual Components
Since there's no test framework configured, test features manually through the development server.

## Architecture

### Core Rendering Pipeline
The fractal rendering uses a multi-layered architecture:

1. **FractalRenderer** (`src/lib/fractalRenderer.ts`) - Canvas rendering manager that handles:
   - Progressive rendering with cancellation support
   - Direct pixel manipulation via ImageData
   - Smooth vs standard coloring modes

2. **Mandelbrot Calculations** (`src/lib/mandelbrot.ts`) - Mathematical core:
   - Complex number iterations
   - Smooth iteration counting for gradient coloring
   - Coordinate transformation between pixel and complex planes

3. **Color Mapping** (`src/lib/colorMapping.ts`) - Visual output:
   - Multiple color schemes (classic, ocean, fire, etc.)
   - Iteration-to-color mapping with smooth gradients

### State Management
The main page component (`src/app/page.tsx`) orchestrates:
- Canvas rendering via refs (rendererRef, zoomPanRef)
- UI state for parameters (iterations, color scheme, bounds)
- Preset system with built-in and custom configurations
- Real-time coordinate inputs with validation

### Zoom/Pan System
`src/lib/zoomPan.ts` implements:
- Mouse wheel zoom with focal point preservation
- Click-and-drag panning
- Touch gesture support
- Coordinate boundary management

### Preset System
Presets (`src/lib/presets.ts`) store complete fractal configurations including:
- Viewport bounds (complex plane coordinates)
- Rendering parameters (iterations, color scheme)
- Canvas dimensions
- Custom presets with localStorage persistence

## Key Design Patterns

- **Ref-based Imperative APIs**: Renderer and zoom manager use refs to avoid React re-renders during intensive operations
- **Progressive Rendering**: Chunks rendering work to maintain UI responsiveness
- **Cancellable Operations**: Rendering can be interrupted when parameters change
- **Type Safety**: Full TypeScript types for fractal configs, bounds, and render points

## Configuration Notes

- ESLint configured with `react-hooks/exhaustive-deps` as warning (not error)
- TypeScript strict mode enabled
- Tailwind CSS for styling
- No test framework currently configured