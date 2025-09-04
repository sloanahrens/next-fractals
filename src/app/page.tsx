export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Next Fractals
          </h1>
          <p className="text-slate-300 text-lg">
            Interactive Mandelbrot Set Generator
          </p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
          <div className="text-center text-white">
            <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
            <p className="text-slate-300">
              Fractal visualization components will be implemented in the next phases.
            </p>
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400">
                Phase 1: Project Foundation & Setup ✅<br/>
                Phase 2: Core Fractal Mathematics (Next)<br/>
                Phase 3: User Interface & Controls<br/>
                Phase 4: Performance Optimization<br/>
                Phase 5: Modern Software Engineering Practices<br/>
                Phase 6: Polish & Portfolio Features
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
