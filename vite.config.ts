import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

// CORS configuration for proxy
const configureCORS = (proxy: any) => {
  proxy.on('proxyReq', (_proxyReq: any, req: any, res: any) => {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.statusCode = 200;
      res.end();
    }
  });
};

// https://vitejs.dev/config/
// Environment detection utilities
const isDocker = process.env.DOCKER === '1' || process.env.DOCKER === 'true'
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true'
const isDevelopment = process.env.NODE_ENV === 'development'

// Configuration constants
const CONFIG = {
  server: {
    port: 3000,
    host: '0.0.0.0',
    watchInterval: 1000,
    allowedHosts: [
      '180.93.138.113',
      'localhost',
      '127.0.0.1',
      'bossai.com.vn'
    ]
  },
  api: {
    dockerTarget: 'http://auth-service:8081',
    localTarget: 'http://localhost:8081'
  },
  build: {
    chunkSizeLimit: 2000,
    inlineLimit: 4096,
    target: 'es2020'
  }
} as const

export default defineConfig({
  base: (isDocker || isVercel || isDevelopment) ? '/' : '/app/',
  
  plugins: [
    react({
      jsxImportSource: '@emotion/react'
    }),
    process.env.ANALYZE && visualizer?.({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],
  
  server: {
    port: CONFIG.server.port,
    host: CONFIG.server.host, // Bind all interfaces for Docker
    allowedHosts: CONFIG.server.allowedHosts,
    middlewareMode: false,
    // Docker-specific watch configuration
    watch: {
      usePolling: isDocker, // Use polling in Docker environments
      interval: CONFIG.server.watchInterval,
    },
    proxy: {
      '/api': {
        target: isDocker 
          ? CONFIG.api.dockerTarget  // Docker network
          : CONFIG.api.localTarget,  // Local development
        changeOrigin: true,
        secure: false,
        configure: configureCORS
      }
    }
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false, // Tắt sourcemap để giảm memory usage
    minify: 'esbuild', // Dùng esbuild thay vì terser (nhanh hơn, ít memory hơn)
    
    rollupOptions: {
      output: {
        // SIMPLIFIED chunk strategy - tránh over-splitting
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Gộp tất cả vendor vào 1 chunk
            return 'vendor'
          }
        },
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
      }
    },
    
    chunkSizeWarningLimit: CONFIG.build.chunkSizeLimit,
    cssCodeSplit: true,
    assetsInlineLimit: CONFIG.build.inlineLimit,
    
    // Tăng memory limit cho Node.js
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled'
    ],
    esbuildOptions: {
      target: CONFIG.build.target
    }
  },
  
  esbuild: {
    target: CONFIG.build.target,
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  
  appType: 'spa',
  
  preview: {
    port: 4173,
    host: true,
    open: true
  }
})