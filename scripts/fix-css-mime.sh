#!/bin/bash

# Fix CSS MIME type issues in Next.js development
echo "🔧 Fixing CSS MIME type issues..."

# Clear Next.js cache
echo "Clearing Next.js cache..."
rm -rf .next

# Clear node_modules cache if needed
if [ "$1" = "--deep" ]; then
    echo "Clearing node_modules cache..."
    rm -rf node_modules/.cache
fi

# Restart development server
echo "Starting development server..."
npm run dev

echo "✅ Development server restarted with CSS MIME type fixes!"
