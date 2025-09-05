import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Next Fractals - Interactive Mandelbrot Set Generator',
  description: 'Generate beautiful Mandelbrot set fractals with real-time parameter adjustment. Explore the infinite complexity of the Mandelbrot set with customizable parameters, zoom controls, and preset configurations.',
  keywords: ['fractals', 'mandelbrot', 'mathematics', 'visualization', 'interactive'],
  authors: [{ name: 'Sloan Ahrens' }],
  creator: 'Sloan Ahrens',
  publisher: 'Sloan Ahrens',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nextjs-fractals.netlify.app/', // Replace with your actual domain
    title: 'Nextjs Fractals - Interactive Mandelbrot Set Generator',
    description: 'Generate beautiful Mandelbrot set fractals with real-time parameter adjustment. Explore the infinite complexity of the Mandelbrot set with customizable parameters, zoom controls, and preset configurations.',
    images: [
      {
        url: 'https://nextjs-fractals.netlify.app/fractal-preview.png',
        width: 1200,
        height: 630,
        alt: 'Nextjs Fractals - Mandelbrot Set Visualization',
        type: 'image/png',
      }
    ],
    siteName: 'Next Fractals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Next Fractals - Interactive Mandelbrot Set Generator',
    description: 'Generate beautiful Mandelbrot set fractals with real-time parameter adjustment. Explore infinite mathematical beauty.',
    images: ['/fractal-preview.png'],
    creator: '@sloanahrens', // Replace with your actual Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
