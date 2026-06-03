import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out',
  outputFileTracingRoot: path.join(__dirname),
  devIndicators: false,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
