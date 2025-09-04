'use client';

import { useEffect, useRef, useState } from 'react';
import { FractalRenderer } from '../lib/fractalRenderer';
import { ZoomPanManager } from '../lib/zoomPan';
import { getDefaultBounds } from '../lib/mandelbrot';
import { FractalConfig, FractalBounds } from '../types/fractal';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FractalRenderer | null>(null);
  const zoomPanRef = useRef<ZoomPanManager | null>(null);
  
  const [bounds, setBounds] = useState<FractalBounds>(getDefaultBounds());
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize canvas size
    const width = 800;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    // Initialize renderer and zoom/pan manager
    rendererRef.current = new FractalRenderer(canvas);
    zoomPanRef.current = new ZoomPanManager(width, height, bounds);

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
      maxIterations: 100,
      width: canvasRef.current.width,
      height: canvasRef.current.height,
      colorScheme: 'classic',
    };

    try {
      await rendererRef.current.renderFractal(config, setProgress);
    } catch (error) {
      console.error('Error rendering fractal:', error);
    } finally {
      setIsRendering(false);
    }
  };

  // Re-render when bounds change
  useEffect(() => {
    renderFractal();
  }, [bounds]);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Mandelbrot Set Explorer</h1>
          <p className="text-lg text-gray-600">
            Click and drag to pan, scroll to zoom
          </p>
        </div>

        <div className="flex flex-col items-center">
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

          <div className="mt-6 text-center">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="font-semibold mb-2">Current View</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Real:</span>{' '}
                  {bounds.minReal.toFixed(6)} to {bounds.maxReal.toFixed(6)}
                </div>
                <div>
                  <span className="font-medium">Imaginary:</span>{' '}
                  {bounds.minImaginary.toFixed(6)} to {bounds.maxImaginary.toFixed(6)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
