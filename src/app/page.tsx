'use client';

import { useEffect, useRef, useState } from 'react';
import { FractalRenderer } from '../lib/fractalRenderer';
import { ZoomPanManager } from '../lib/zoomPan';
import { getDefaultBounds } from '../lib/mandelbrot';
import { FractalConfig, FractalBounds, ColorScheme } from '../types/fractal';
import { getAvailableColorSchemes } from '../lib/colorMapping';
import { Slider } from '../components/ui/Slider';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FractalRenderer | null>(null);
  const zoomPanRef = useRef<ZoomPanManager | null>(null);
  
  const [bounds, setBounds] = useState<FractalBounds>(getDefaultBounds());
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Phase 4: Parameter controls
  const [maxIterations, setMaxIterations] = useState(100);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('classic');
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  
  // Manual coordinate inputs
  const [manualMinReal, setManualMinReal] = useState(bounds.minReal.toString());
  const [manualMaxReal, setManualMaxReal] = useState(bounds.maxReal.toString());
  const [manualMinImaginary, setManualMinImaginary] = useState(bounds.minImaginary.toString());
  const [manualMaxImaginary, setManualMaxImaginary] = useState(bounds.maxImaginary.toString());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize canvas size with dynamic values
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Initialize renderer and zoom/pan manager
    rendererRef.current = new FractalRenderer(canvas);
    zoomPanRef.current = new ZoomPanManager(canvasWidth, canvasHeight, bounds);

    // Initial render
    renderFractal();

    // Set up event listeners
    const handleWheel = (event: WheelEvent) => {
      const newBounds = zoomPanRef.current?.handleWheel(event, bounds);
      if (newBounds) {
        setBounds(newBounds);
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      zoomPanRef.current?.handleMouseDown(event);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const newBounds = zoomPanRef.current?.handleMouseMove(event, bounds);
      if (newBounds) {
        setBounds(newBounds);
      }
    };

    const handleMouseUp = () => {
      zoomPanRef.current?.handleMouseUp();
    };

    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [bounds]);

  const renderFractal = async () => {
    if (!rendererRef.current || !canvasRef.current) return;

    setIsRendering(true);
    setProgress(0);

    const config: FractalConfig = {
      bounds,
      maxIterations,
      width: canvasRef.current.width,
      height: canvasRef.current.height,
      colorScheme,
    };

    try {
      await rendererRef.current.renderFractal(config, setProgress);
    } catch (error) {
      console.error('Error rendering fractal:', error);
    } finally {
      setIsRendering(false);
    }
  };

  // Update manual coordinate inputs when bounds change from zoom/pan
  useEffect(() => {
    setManualMinReal(bounds.minReal.toString());
    setManualMaxReal(bounds.maxReal.toString());
    setManualMinImaginary(bounds.minImaginary.toString());
    setManualMaxImaginary(bounds.maxImaginary.toString());
  }, [bounds]);

  // Re-render when parameters change
  useEffect(() => {
    renderFractal();
  }, [bounds, maxIterations, colorScheme, canvasWidth, canvasHeight]);

  // Update canvas size when resolution changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    if (zoomPanRef.current) {
      zoomPanRef.current = new ZoomPanManager(canvasWidth, canvasHeight, bounds);
    }
    
    renderFractal();
  }, [canvasWidth, canvasHeight]);

  // Helper functions for manual coordinate input
  const applyManualCoordinates = () => {
    const newBounds: FractalBounds = {
      minReal: parseFloat(manualMinReal),
      maxReal: parseFloat(manualMaxReal),
      minImaginary: parseFloat(manualMinImaginary),
      maxImaginary: parseFloat(manualMaxImaginary),
    };

    // Validate bounds
    if (
      !isNaN(newBounds.minReal) &&
      !isNaN(newBounds.maxReal) &&
      !isNaN(newBounds.minImaginary) &&
      !isNaN(newBounds.maxImaginary) &&
      newBounds.minReal < newBounds.maxReal &&
      newBounds.minImaginary < newBounds.maxImaginary
    ) {
      setBounds(newBounds);
    }
  };

  const resetToDefault = () => {
    const defaultBounds = getDefaultBounds();
    setBounds(defaultBounds);
    setMaxIterations(100);
    setColorScheme('classic');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Mandelbrot Set Explorer</h1>
          <p className="text-lg text-gray-600">
            Click and drag to pan, scroll to zoom
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Canvas Section */}
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 cursor-grab active:cursor-grabbing"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            
            {isRendering && (
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-150"
                    style={{ width: `${progress * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Rendering... {Math.round(progress * 100)}%
                </p>
              </div>
            )}
          </div>

          {/* Parameter Control Panel */}
          <div className="w-full lg:w-96 space-y-6">
            {/* Rendering Parameters */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Rendering Parameters</h3>
              <div className="space-y-4">
                <Slider
                  label="Maximum Iterations"
                  value={maxIterations}
                  min={50}
                  max={1000}
                  step={10}
                  onChange={setMaxIterations}
                  disabled={isRendering}
                  formatValue={(v) => v.toString()}
                />
                
                <Select
                  label="Color Scheme"
                  value={colorScheme}
                  options={getAvailableColorSchemes()}
                  onChange={(value) => setColorScheme(value as ColorScheme)}
                  disabled={isRendering}
                />
              </div>
            </div>

            {/* Canvas Resolution */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Canvas Resolution</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Width"
                    value={canvasWidth.toString()}
                    type="number"
                    onChange={(value) => {
                      const num = parseInt(value);
                      if (!isNaN(num) && num > 0 && num <= 2000) {
                        setCanvasWidth(num);
                      }
                    }}
                    disabled={isRendering}
                  />
                  <Input
                    label="Height"
                    value={canvasHeight.toString()}
                    type="number"
                    onChange={(value) => {
                      const num = parseInt(value);
                      if (!isNaN(num) && num > 0 && num <= 2000) {
                        setCanvasHeight(num);
                      }
                    }}
                    disabled={isRendering}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setCanvasWidth(400);
                      setCanvasHeight(300);
                    }}
                    disabled={isRendering}
                    variant="secondary"
                    size="sm"
                  >
                    400×300
                  </Button>
                  <Button
                    onClick={() => {
                      setCanvasWidth(800);
                      setCanvasHeight(600);
                    }}
                    disabled={isRendering}
                    variant="secondary"
                    size="sm"
                  >
                    800×600
                  </Button>
                  <Button
                    onClick={() => {
                      setCanvasWidth(1200);
                      setCanvasHeight(900);
                    }}
                    disabled={isRendering}
                    variant="secondary"
                    size="sm"
                  >
                    1200×900
                  </Button>
                </div>
              </div>
            </div>

            {/* Manual Coordinates */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Manual Coordinates</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Min Real"
                    value={manualMinReal}
                    type="number"
                    step="any"
                    onChange={setManualMinReal}
                    disabled={isRendering}
                  />
                  <Input
                    label="Max Real"
                    value={manualMaxReal}
                    type="number"
                    step="any"
                    onChange={setManualMaxReal}
                    disabled={isRendering}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Min Imaginary"
                    value={manualMinImaginary}
                    type="number"
                    step="any"
                    onChange={setManualMinImaginary}
                    disabled={isRendering}
                  />
                  <Input
                    label="Max Imaginary"
                    value={manualMaxImaginary}
                    type="number"
                    step="any"
                    onChange={setManualMaxImaginary}
                    disabled={isRendering}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={applyManualCoordinates}
                    disabled={isRendering}
                  >
                    Apply Coordinates
                  </Button>
                  <Button
                    onClick={resetToDefault}
                    disabled={isRendering}
                    variant="secondary"
                  >
                    Reset to Default
                  </Button>
                </div>
              </div>
            </div>

            {/* Current View Info */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Current View</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Real:</span>{' '}
                  {bounds.minReal.toFixed(8)} to {bounds.maxReal.toFixed(8)}
                </div>
                <div>
                  <span className="font-medium">Imaginary:</span>{' '}
                  {bounds.minImaginary.toFixed(8)} to {bounds.maxImaginary.toFixed(8)}
                </div>
                <div>
                  <span className="font-medium">Zoom Factor:</span>{' '}
                  {(4 / (bounds.maxReal - bounds.minReal)).toFixed(2)}x
                </div>
                <div>
                  <span className="font-medium">Resolution:</span>{' '}
                  {canvasWidth} × {canvasHeight}
                </div>
                <div>
                  <span className="font-medium">Max Iterations:</span> {maxIterations}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
