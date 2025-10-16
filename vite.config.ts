import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: (process.env.DOCKER || process.env.VERCEL || process.env.NODE_ENV === 'development') ? '/' : '/app/',
  
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
        target: 'http://auth-service:8081',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req, res) => {
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
    
    chunkSizeWarningLimit: 2000, // Tăng limit
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    
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
      target: 'es2020'
    }
  },
  
  esbuild: {
    target: 'es2020',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  
  appType: 'spa',
  
  preview: {
    port: 4173,
    host: true,
    open: true
  }
})