# Memory Optimization for Deployment

## Problem
The deployment was failing during the Vite build process with a "Killed" message, indicating the build process was running out of memory.

## Solutions Implemented

### 1. Memory-Optimized Vite Configuration
Created `vite.config.production.ts` with:
- Disabled sourcemaps to reduce memory usage
- Single vendor chunk strategy to minimize memory fragmentation
- Reduced parallel file operations (`maxParallelFileOps: 1`)
- Disabled CSS code splitting
- Disabled compressed size reporting
- Optimized chunk size limits

### 2. Enhanced Build Scripts
Added new npm scripts in `package.json`:
- `build:memory-optimized` - Uses 4GB memory limit with regular config
- `build:production` - Uses 4GB memory limit with production config

### 3. Updated Deployment Scripts
Modified `deploy.sh` to:
- Set `NODE_OPTIONS="--max-old-space-size=4096"` (4GB memory limit)
- Use production build configuration
- Add fallback build strategy
- Skip npm audit during installation to save memory
- Clear build artifacts before building

### 4. Alternative Deployment Options
Created additional scripts for different scenarios:
- `build-production.sh` - Standalone production build script
- `deploy-simple.sh` - Minimal deployment script for constrained environments

## Usage

### Option 1: Use the updated main deployment script
```bash
./deploy.sh --force-root
```

### Option 2: Use the simple deployment script
```bash
./deploy-simple.sh
```

### Option 3: Manual build and deploy
```bash
# Build only
./build-production.sh

# Or build with npm
npm run build:production
```

## Memory Requirements
- Minimum: 4GB RAM recommended
- The build process now uses up to 4GB of memory
- If still failing, consider:
  - Closing other applications
  - Using a machine with more RAM
  - Building on a different machine and copying dist folder

## Troubleshooting

### If build still fails with memory issues:
1. Check available memory: `free -h` (Linux) or Activity Monitor (macOS)
2. Close unnecessary applications
3. Try building with even more memory: `NODE_OPTIONS="--max-old-space-size=6144"`
4. Consider building locally and uploading the `dist` folder

### If build succeeds but deployment fails:
1. Check PM2 logs: `pm2 logs ai-content-frontend`
2. Verify port availability: `netstat -tlnp | grep 4173`
3. Check Nginx configuration: `sudo nginx -t`

## Files Modified
- `frontend/deploy.sh` - Enhanced with memory optimizations
- `frontend/package.json` - Added memory-optimized build scripts
- `frontend/vite.config.ts` - Added memory optimizations
- `frontend/vite.config.production.ts` - New production-specific config
- `frontend/build-production.sh` - New standalone build script
- `frontend/deploy-simple.sh` - New simple deployment script