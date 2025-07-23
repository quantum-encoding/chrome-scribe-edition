#!/bin/bash

# Build script for Chrome and Firefox versions
echo "Building AI Chronicle - The Scribe extensions..."

# Create build directories
mkdir -p build/chrome
mkdir -p build/firefox

# Copy common files to both
for dir in build/chrome build/firefox; do
  cp -r images "$dir/"
  cp -r scripts "$dir/"
  cp -r styles "$dir/"
  cp popup.html "$dir/"
  cp LICENSE "$dir/"
  cp README.md "$dir/"
done

# Copy platform-specific manifests
cp manifest.json build/chrome/
cp manifest-firefox.json build/firefox/manifest.json

# Create release zips
cd build
zip -r ../chrome-scribe-edition-chrome-v1.0.0.zip chrome/
zip -r ../chrome-scribe-edition-firefox-v1.0.0.zip firefox/

echo "✅ Build complete!"
echo "📦 Chrome version: chrome-scribe-edition-chrome-v1.0.0.zip"
echo "📦 Firefox version: chrome-scribe-edition-firefox-v1.0.0.zip"