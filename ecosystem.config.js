// PM2 Configuration for AI Content Automation Frontend
// Environment variables can override these defaults
const config = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || 'ai-content-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: process.env.PM2_CWD || '/var/www/ai-content-automation/frontend',
      instances: parseInt(process.env.PM2_INSTANCES || '1', 10),
      autorestart: true,
      watch: false,
      max_memory_restart: process.env.PM2_MAX_MEMORY || '1G',
      
      // Environment configuration
      env: {
        NODE_ENV: 'production',
        PORT: parseInt(process.env.PORT || '4173', 10),
        HOST: process.env.HOST || '0.0.0.0'
      },
      
      // Logging configuration
      log_file: process.env.PM2_LOG_FILE || '/var/log/pm2/ai-content-frontend.log',
      out_file: process.env.PM2_OUT_FILE || '/var/log/pm2/ai-content-frontend-out.log',
      error_file: process.env.PM2_ERROR_FILE || '/var/log/pm2/ai-content-frontend-error.log',
      
      // Restart policy
      min_uptime: process.env.PM2_MIN_UPTIME || '10s',
      max_restarts: parseInt(process.env.PM2_MAX_RESTARTS || '10', 10),
      restart_delay: parseInt(process.env.PM2_RESTART_DELAY || '4000', 10),
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true
    }
  ]
}

module.exports = config