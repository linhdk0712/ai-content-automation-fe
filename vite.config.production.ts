import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Minimal production configuration optimized for memory usage
export default defineConfig({
    base: '/',

    plugins: [
        react({
            jsxImportSource: '@emotion/react'
        })
    ],

    build: {
        outDir: 'dist',
        sourcemap: false, // Disable sourcemap to save memory
        minify: 'esbuild', // Use esbuild (faster, less memory than terser)

        rollupOptions: {
            // Minimize parallel operations to reduce memory usage
            maxParallelFileOps: 1,
            output: {
                // Single vendor chunk to minimize memory usage
                manualChunks: {
                    vendor: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled']
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            }
        },

        // Memory optimization settings
        chunkSizeWarningLimit: 1000, // Reduce chunk size limit
        cssCodeSplit: false, // Keep CSS in single file to reduce memory
        assetsInlineLimit: 2048, // Reduce inline limit
        reportCompressedSize: false, // Skip gzip size reporting

        target: 'es2020',

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

    appType: 'spa'
});