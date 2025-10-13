import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  // Set base path - use root for Vercel, /app/ for self-hosted
  base: process.env.VERCEL ? '/' : '/app/',
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
        start_url: process.env.VERCEL ? '/' : '/app/',
        scope: process.env.VERCEL ? '/' : '/app/',
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
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add CORS headers for preflight requests
            if (req.method === 'OPTIONS') {
              res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
              res.setHeader('Access-Control-Allow-Credentials', 'true');
              res.statusCode = 200;
              res.end();
            }
          });
        }
      }
    }
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
        manualChunks: {
          // Core React libraries
          'react-core': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],

          // UI Libraries - Split MUI into smaller chunks
          'mui-core': ['@mui/material', '@mui/system'],
          'mui-icons': ['@mui/icons-material'],
          'mui-pickers': ['@mui/x-date-pickers', '@mui/x-date-pickers-pro'],
          'emotion': ['@emotion/react', '@emotion/styled'],

          // Data & State Management
          'query': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          'form': ['react-hook-form', '@hookform/resolvers', 'yup', 'zod'],

          // Utilities
          'utils': ['lodash', 'date-fns', 'axios'],
          'dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities', 'react-beautiful-dnd'],

          // Chart & Visualization
          'charts': ['recharts', 'reactflow'],
          'calendar': ['react-big-calendar'],

          // Editor & Content
          'editor': ['@tinymce/tinymce-react'],
          'notifications': ['react-toastify'],

          // Other vendor libraries
          'vendor-misc': ['framer-motion', 'emoji-picker-react', 'papaparse', 'diff']
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            return 'assets/[name]-[hash].js'
          }
          return 'assets/chunk-[hash].js'
        }
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