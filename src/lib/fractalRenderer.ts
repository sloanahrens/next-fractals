import { FractalConfig, RenderPoint } from '../types/fractal';
import { mandelbrotIterations, smoothMandelbrotIterations, pixelToComplex } from './mandelbrot';
import { mapIterationsToColor } from './colorMapping';

/**
 * Fractal renderer class for managing canvas rendering operations
 */
export class FractalRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private isRendering = false;
  private shouldCancel = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D rendering context');
    }
    this.ctx = ctx;
    this.imageData = ctx.createImageData(canvas.width, canvas.height);
  }

  /**
   * Render the Mandelbrot set with the given configuration
   * @param config - Fractal rendering configuration
   * @param onProgress - Optional progress callback (0-1)
   * @param useSmooth - Whether to use smooth coloring for better gradients
   */
  async renderFractal(
    config: FractalConfig,
    onProgress?: (progress: number) => void,
    useSmooth: boolean = true
  ): Promise<void> {
    if (this.isRendering) {
      this.shouldCancel = true;
      await this.waitForRenderCompletion();
    }

    this.isRendering = true;
    this.shouldCancel = false;

    // Resize canvas if needed
    if (this.canvas.width !== config.width || this.canvas.height !== config.height) {
      this.canvas.width = config.width;
      this.canvas.height = config.height;
      this.imageData = this.ctx.createImageData(config.width, config.height);
    }

    const { width, height, bounds, maxIterations, colorScheme } = config;
    const totalPixels = width * height;
    let processedPixels = 0;

    // Render in chunks to avoid blocking the UI
    const chunkSize = Math.min(1000, Math.floor(totalPixels / 100));
    
    for (let y = 0; y < height && !this.shouldCancel; y++) {
      const rowPromises: Promise<RenderPoint[]>[] = [];
      
      // Process row in chunks
      for (let chunkStart = 0; chunkStart < width; chunkStart += chunkSize) {
        const chunkEnd = Math.min(chunkStart + chunkSize, width);
        const chunkPromise = this.renderRowChunk(
          y,
          chunkStart,
          chunkEnd,
          width,
          height,
          bounds,
          maxIterations,
          useSmooth
        );
        rowPromises.push(chunkPromise);
      }

      // Wait for all chunks in the row to complete
      const rowResults = await Promise.all(rowPromises);
      const rowPoints = rowResults.flat();

      // Apply colors to pixels
      for (const point of rowPoints) {
        const color = mapIterationsToColor(point.iterations, maxIterations, colorScheme);
        this.setPixel(point.x, point.y, color.r, color.g, color.b, 255);
      }

      processedPixels += width;
      
      // Update progress and render every few rows
      if (y % 10 === 0 || y === height - 1) {
        this.ctx.putImageData(this.imageData, 0, 0);
        onProgress?.(processedPixels / totalPixels);
        
        // Yield control to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Final render
    if (!this.shouldCancel) {
      this.ctx.putImageData(this.imageData, 0, 0);
      onProgress?.(1);
    }

    this.isRendering = false;
  }

  /**
   * Render a chunk of a row (for parallel processing)
   */
  private async renderRowChunk(
    y: number,
    startX: number,
    endX: number,
    width: number,
    height: number,
    bounds: any,
    maxIterations: number,
    useSmooth: boolean
  ): Promise<RenderPoint[]> {
    const points: RenderPoint[] = [];
    
    for (let x = startX; x < endX; x++) {
      const complex = pixelToComplex(x, y, width, height, bounds);
      const iterations = useSmooth
        ? smoothMandelbrotIterations(complex, maxIterations)
        : mandelbrotIterations(complex, maxIterations);
      
      points.push({ x, y, iterations });
    }
    
    return points;
  }

  /**
   * Set a pixel color in the image data
   */
  private setPixel(x: number, y: number, r: number, g: number, b: number, a: number): void {
    const index = (y * this.canvas.width + x) * 4;
    this.imageData.data[index] = r;     // Red
    this.imageData.data[index + 1] = g; // Green
    this.imageData.data[index + 2] = b; // Blue
    this.imageData.data[index + 3] = a; // Alpha
  }

  /**
   * Cancel current rendering operation
   */
  cancelRender(): void {
    this.shouldCancel = true;
  }

  /**
   * Check if currently rendering
   */
  isCurrentlyRendering(): boolean {
    return this.isRendering;
  }

  /**
   * Wait for current render to complete
   */
  private async waitForRenderCompletion(): Promise<void> {
    while (this.isRendering) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Render a low-resolution preview for faster feedback
   */
  async renderPreview(config: FractalConfig, scale: number = 0.25): Promise<void> {
    const previewConfig = {
      ...config,
      width: Math.floor(config.width * scale),
      height: Math.floor(config.height * scale),
    };

    // Create a temporary canvas for the preview
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = previewConfig.width;
    previewCanvas.height = previewConfig.height;
    const previewCtx = previewCanvas.getContext('2d');
    
    if (!previewCtx) return;

    const previewRenderer = new FractalRenderer(previewCanvas);
    await previewRenderer.renderFractal(previewConfig, undefined, false);

    // Scale up the preview to fill the main canvas
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(
      previewCanvas,
      0, 0, previewConfig.width, previewConfig.height,
      0, 0, config.width, config.height
    );
    this.ctx.imageSmoothingEnabled = true;
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
