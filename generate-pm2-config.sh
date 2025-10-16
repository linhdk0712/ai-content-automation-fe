#!/bin/bash

# Generate PM2 config based on current directory

echo "🔧 Generating PM2 Configuration"
echo "==============================="

CURRENT_DIR=$(pwd)
echo "Current directory: $CURRENT_DIR"

# Generate ecosystem.json with current directory
cat > ecosystem.json << EOF
{
  "apps": [
    {
      "name": "ai-content-frontend",
      "script": "npm",
      "args": "run preview",
      "cwd": "$CURRENT_DIR",
      "instances": 1,
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "1G",
      "env": {
        "NODE_ENV": "production",
        "PORT": 4173,
        "HOST": "0.0.0.0"
      },
      "log_file": "/var/log/pm2/ai-content-frontend.log",
      "out_file": "/var/log/pm2/ai-content-frontend-out.log",
      "error_file": "/var/log/pm2/ai-content-frontend-error.log",
      "min_uptime": "10s",
      "max_restarts": 10,
      "restart_delay": 4000
    }
  ]
}
EOF

echo "✅ Generated ecosystem.json with cwd: $CURRENT_DIR"

# Also generate a simple CJS version
cat > ecosystem.current.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'ai-content-frontend',
    script: 'npm',
    args: 'run preview',
    cwd: process.cwd(),
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4173,
      HOST: '0.0.0.0'
    },
    log_file: '/var/log/pm2/ai-content-frontend.log',
    out_file: '/var/log/pm2/ai-content-frontend-out.log',
    error_file: '/var/log/pm2/ai-content-frontend-error.log',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
}
EOF

echo "✅ Generated ecosystem.current.cjs with dynamic cwd"

# Show the generated config
echo ""
echo "Generated ecosystem.json:"
cat ecosystem.json

echo ""
echo "Ready to start PM2 with: pm2 start ecosystem.json"