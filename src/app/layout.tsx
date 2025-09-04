import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Next Fractals - Interactive Mandelbrot Set Generator',
  description: 'Generate beautiful Mandelbrot set fractals with real-time parameter adjustment',
  keywords: ['fractals', 'mandelbrot', 'mathematics', 'visualization', 'interactive'],
  authors: [{ name: 'Sloan Ahrens' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <div className="min-h-full bg-background text-foreground">
          {children}
        </div>
      </body>
    </html>
  )
}
