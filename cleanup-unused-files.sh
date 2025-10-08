#!/bin/bash

# Lingkod PH - Unused Files Cleanup Script
# This script removes confirmed unused files to clean up the codebase

echo "🧹 Starting Lingkod PH cleanup process..."

# Create backup directory
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📁 Created backup directory: $BACKUP_DIR"

# 1. Remove test/development files
echo "🗑️  Removing test/development files..."
rm -rf coverage/
echo "✅ Removed coverage directory"

# 2. Remove unused components
echo "🗑️  Removing unused components..."
rm -f src/components/n8n-dashboard.tsx
rm -f src/components/qrcode-svg.tsx
rm -f src/components/support-chat.tsx
echo "✅ Removed unused components"

# 3. Remove unused UI components (only the ones that are actually unused)
echo "🗑️  Removing unused UI components..."
rm -f src/components/ui/chart.tsx
rm -f src/components/ui/menubar.tsx
rm -f src/components/ui/radio-group.tsx
rm -f src/components/ui/slider.tsx
echo "✅ Removed unused UI components (kept accordion, carousel, collapsible, popover, sheet, sidebar)"

# 4. Remove test page
echo "🗑️  Removing test page..."
rm -f src/app/test-i18n/page.tsx
echo "✅ Removed test-i18n page"

# 5. Clean up documentation (keep only essential ones)
echo "🗑️  Cleaning up redundant documentation..."
# Keep only the most recent and essential documentation
# Remove old implementation summaries and redundant files
rm -f docs/payment-implementation-complete.md
rm -f docs/payment-system-final-summary.md
rm -f docs/payment-system-implementation-complete.md
rm -f docs/functionality-testing-summary.md
rm -f docs/loading-states-consistency-guide.md
rm -f docs/loading-states-consistency-update.md
echo "✅ Cleaned up redundant documentation"

echo "🎉 Cleanup completed successfully!"
echo "📊 Summary of removed files:"
echo "   - Test/development files"
echo "   - Unused components (3 files)"
echo "   - Unused UI components (4 files - kept 6 that are actually used)"
echo "   - Test page (1 file)"
echo "   - Redundant documentation (5 files)"
echo ""
echo "⚠️  Next steps:"
echo "   1. Test your application to ensure everything still works"
echo "   2. Review the lib/ directory files manually before removing"
echo "   3. Consider removing more documentation files if needed"
echo "   4. Run 'npm run build' to verify no broken imports"
