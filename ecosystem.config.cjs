/**
 * PM2 Configuration for AI Content Automation Frontend
 * Enhanced with security, monitoring, and environment flexibility
 */

/**
 * Safely parse integer with validation
 */
function safeParseInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed < 0 ? fallback : parsed;
}

/**
 * Validate file paths for security
 */
function validatePath(path, fallback) {
  if (!path || typeof path !== 'string') return fallback;
  // Basic path traversal protection
  if (path.includes('..') || path.includes('~')) return fallback;
  return path;
}

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || 'ai-content-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: validatePath(process.env.PM2_CWD, '/var/www/ai-content-automation/frontend'),
      instances: safeParseInt(process.env.PM2_INSTANCES, 1),
      autorestart: true,
      watch: false,
      max_memory_restart: process.env.PM2_MAX_MEMORY || '512M', // More conservative default
      
      // Environment configuration
      env: {
        NODE_ENV: 'production',
        PORT: safeParseInt(process.env.PORT, 4173),
        HOST: process.env.HOST || '127.0.0.1', // More secure than 0.0.0.0
        VITE_SECURE_MODE: 'true'
      },
      
      // Production environment overrides
      env_production: {
        NODE_ENV: 'production',
        PORT: safeParseInt(process.env.PROD_PORT, 4173),
        HOST: process.env.PROD_HOST || '127.0.0.1'
      },
      
      // Enhanced logging with rotation
      log_file: validatePath(process.env.PM2_LOG_FILE, '/var/log/pm2/ai-content-frontend.log'),
      out_file: validatePath(process.env.PM2_OUT_FILE, '/var/log/pm2/ai-content-frontend-out.log'),
      error_file: validatePath(process.env.PM2_ERROR_FILE, '/var/log/pm2/ai-content-frontend-error.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Improved restart policy
      min_uptime: process.env.PM2_MIN_UPTIME || '30s', // Increased for stability
      max_restarts: safeParseInt(process.env.PM2_MAX_RESTARTS, 5), // Reduced to prevent loops
      restart_delay: safeParseInt(process.env.PM2_RESTART_DELAY, 5000),
      
      // Health monitoring
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Process management
      exec_mode: 'fork',
      increment_var: 'PORT',
      
      // Error handling
      combine_logs: true,
      
      // Resource monitoring
      monitoring: false, // Disable PM2+ monitoring by default
      pmx: false
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: process.env.DEPLOY_USER || 'deploy',
      host: process.env.DEPLOY_HOST,
      ref: 'origin/main',
      repo: process.env.DEPLOY_REPO,
      path: process.env.DEPLOY_PATH || '/var/www/ai-content-automation',
      'post-deploy': 'npm ci --only=production && npm run build && pm2 reload ecosystem.config.cjs --env production && pm2 save'
    }
  }
}