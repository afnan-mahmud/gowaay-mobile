#!/bin/bash

echo "🔄 Restarting Metro Bundler..."

# Kill any running Metro processes
echo "Stopping Metro..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || echo "No Metro process found"

# Wait a moment
sleep 2

# Clear caches
echo "Clearing caches..."
rm -rf node_modules/.cache 2>/dev/null
rm -rf $TMPDIR/metro-* 2>/dev/null
rm -rf $TMPDIR/haste-* 2>/dev/null

# Start Metro with cache reset
echo "Starting Metro with cache reset..."
npx react-native start --reset-cache
