#!/bin/bash

# env.sh - Runtime environment variable injection for React SPA
# This script replaces environment variables in the built JavaScript files
# allowing for runtime configuration without rebuilding the Docker image

set -e

# Define the directory containing the built files
BUILD_DIR="/usr/share/nginx/html"
ENV_FILE="$BUILD_DIR/.env"

echo "🚀 Starting environment variable injection..."

# Function to replace environment variables in files
replace_env_vars() {
    local file="$1"
    echo "📝 Processing file: $file"
    
    # Get all VITE_ environment variables
    env | grep '^VITE_' | while IFS='=' read -r key value; do
        # Escape special characters in the value for sed
        escaped_value=$(printf '%s\n' "$value" | sed 's/[[\.*^$()+?{|]/\\&/g')
        
        # Replace the placeholder with the actual value
        sed -i "s|__${key}__|${escaped_value}|g" "$file"
        echo "✅ Replaced __${key}__ with ${value}"
    done
}

# Find and process all JavaScript files
find "$BUILD_DIR" -name "*.js" -type f | while read -r file; do
    replace_env_vars "$file"
done

# Find and process all CSS files (in case of CSS variables)
find "$BUILD_DIR" -name "*.css" -type f | while read -r file; do
    replace_env_vars "$file"
done

# Process index.html for any environment variables
if [ -f "$BUILD_DIR/index.html" ]; then
    replace_env_vars "$BUILD_DIR/index.html"
fi

echo "✨ Environment variable injection completed successfully!"

# Print current environment variables for debugging
echo "🔍 Current VITE_ environment variables:"
env | grep '^VITE_' || echo "No VITE_ environment variables found"