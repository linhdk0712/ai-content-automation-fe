import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';


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
    // Proxy for development - nginx handles production
    proxy: {
      '/api': {
        target: 'http://auth-service:8081',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req, res) => {
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
        // Simplified chunk strategy for SPA
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            // UI Framework
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui-vendor'
            }
            // State management and data fetching
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor'
            }
            // Other vendors
            return 'vendor'
          }
        },
        // Stable chunk file names for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash].[ext]`
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash].[ext]`
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash].[ext]`
          }
          return `assets/[name]-[hash].[ext]`
        }
      },
      // Enhanced tree shaking for SPA
      treeshake: {
        preset: 'recommended',
        manualPureFunctions: ['console.log', 'console.warn', 'console.info'],
        moduleSideEffects: false
      }
    },
    // Optimized for SPA
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize asset inlining
    assetsInlineLimit: 4096
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@mui/system',
      '@emotion/react',
      '@emotion/styled',
      '@tanstack/react-query',
      'axios',
      'lodash',
      'date-fns'
    ],
    // Force optimization of these packages for SPA
    force: process.env.NODE_ENV === 'development'
  },
  // SPA-specific configuration
  appType: 'spa',
  // Improve dev server for SPA
  preview: {
    port: 4173,
    host: true,
    // SPA fallback for client-side routing
    open: true
  }
})