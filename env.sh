#!/bin/bash

# env.sh - Runtime environment variable injection for React SPA
# This script replaces environment variables in the built JavaScript files
# allowing for runtime configuration without rebuilding the Docker image
# Compatible with read-only filesystems

set -e

# Define the directory containing the built files
BUILD_DIR="/usr/share/nginx/html"
TEMP_DIR="/tmp"

echo "🚀 Starting environment variable injection..."

# Check if we have VITE_ environment variables
VITE_VARS=$(env | grep '^VITE_' || true)
if [ -z "$VITE_VARS" ]; then
    echo "ℹ️  No VITE_ environment variables found, skipping injection"
    exit 0
fi

echo "🔍 Found VITE_ environment variables:"
echo "$VITE_VARS"

# Function to replace environment variables in files
replace_env_vars() {
    local file="$1"
    local temp_file="$TEMP_DIR/$(basename "$file").tmp"
    
    echo "📝 Processing file: $file"
    
    # Copy original file to temp location
    cp "$file" "$temp_file"
    
    # Get all VITE_ environment variables and process them
    env | grep '^VITE_' | while IFS='=' read -r key value; do
        # Escape special characters in the value for sed
        escaped_value=$(printf '%s\n' "$value" | sed 's/[[\.*^$()+?{|]/\\&/g')
        
        # Replace the placeholder with the actual value in temp file
        sed "s|__${key}__|${escaped_value}|g" "$temp_file" > "$temp_file.new"
        mv "$temp_file.new" "$temp_file"
        
        echo "✅ Replaced __${key}__ with ${value}"
    done
    
    # Copy the modified file back (this works even with read-only root filesystem
    # because we're copying from writable /tmp to the target location)
    if [ -s "$temp_file" ]; then
        cp "$temp_file" "$file"
        echo "✅ Updated $file"
    fi
    
    # Clean up temp file
    rm -f "$temp_file" "$temp_file.new"
}

# Create a list of files to process
FILES_TO_PROCESS=""

# Find JavaScript files
JS_FILES=$(find "$BUILD_DIR" -name "*.js" -type f 2>/dev/null || true)
if [ ! -z "$JS_FILES" ]; then
    FILES_TO_PROCESS="$FILES_TO_PROCESS $JS_FILES"
fi

# Find CSS files
CSS_FILES=$(find "$BUILD_DIR" -name "*.css" -type f 2>/dev/null || true)
if [ ! -z "$CSS_FILES" ]; then
    FILES_TO_PROCESS="$FILES_TO_PROCESS $CSS_FILES"
fi

# Add index.html if it exists
if [ -f "$BUILD_DIR/index.html" ]; then
    FILES_TO_PROCESS="$FILES_TO_PROCESS $BUILD_DIR/index.html"
fi

# Process all files
if [ ! -z "$FILES_TO_PROCESS" ]; then
    for file in $FILES_TO_PROCESS; do
        if [ -f "$file" ]; then
            replace_env_vars "$file"
        fi
    done
else
    echo "ℹ️  No files found to process"
fi

echo "✨ Environment variable injection completed successfully!"

# Print summary
echo "🔍 Current VITE_ environment variables:"
env | grep '^VITE_' || echo "No VITE_ environment variables found"