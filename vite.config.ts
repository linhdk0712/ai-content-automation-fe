import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  // Base path
  // - Docker or Vercel: '/'
  // - Local development: '/' (changed from '/app/')
  base: (process.env.DOCKER || process.env.VERCEL || process.env.NODE_ENV === 'development') ? '/' : '/app/',
  plugins: [
    react({
      // Optimize React imports
      jsxImportSource: '@emotion/react'
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'AI Content Automation',
        short_name: 'AI Content',
        description: 'AI-powered content automation platform',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: (process.env.VERCEL || process.env.NODE_ENV === 'development') ? '/' : '/app/',
        scope: (process.env.VERCEL || process.env.NODE_ENV === 'development') ? '/' : '/app/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
    // Bundle analyzer for production builds
    process.env.ANALYZE && visualizer?.({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],
  server: {
    port: 3000,
    host: true,
    allowedHosts: [
      '180.93.138.113',
      'localhost',
      '127.0.0.1',
      'bossai.com.vn'
    ],
    middlewareMode: false,
    // Proxy removed - using nginx proxy instead
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8081',
    //     changeOrigin: true,
    //     secure: false,
    //     rewrite: (path) => path.replace(/^\/api/, ''),
    //     configure: (proxy) => {
    //       proxy.on('proxyReq', (_proxyReq, req, res) => {
    //         // Add CORS headers for preflight requests
    //         if (req.method === 'OPTIONS') {
    //           res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    //           res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    //           res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    //           res.setHeader('Access-Control-Allow-Credentials', 'true');
    //           res.statusCode = 200;
    //           res.end();
    //         }
    //       });
    //     }
    //   }
    // }
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        // Simplify chunk strategy to avoid loading issues
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            if (id.includes('@mui')) {
              return 'mui-vendor'
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor'
            }
            return 'vendor'
          }
        },
        // Stable chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      // Enable more aggressive tree shaking
      treeshake: {
        preset: 'recommended',
        manualPureFunctions: ['console.log', 'console.warn', 'console.info']
      }
    },
    // Reduce chunk size warning limit for better optimization
    chunkSizeWarningLimit: 500
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      '@tanstack/react-query',
      'react-router-dom'
    ]
  }
})