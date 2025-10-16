#!/bin/bash

# Test PM2 configuration files

echo "🧪 Testing PM2 Configuration Files..."

# Test JSON config
echo "Testing ecosystem.json..."
if pm2 start ecosystem.json --dry-run; then
    echo "✅ ecosystem.json is valid"
else
    echo "❌ ecosystem.json has errors"
fi

# Test CJS config
echo "Testing ecosystem.config.cjs..."
if pm2 start ecosystem.config.cjs --dry-run; then
    echo "✅ ecosystem.config.cjs is valid"
else
    echo "❌ ecosystem.config.cjs has errors"
fi

echo "🏁 PM2 config test completed"