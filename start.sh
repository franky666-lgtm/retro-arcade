#!/bin/bash
# ═══════════════════════════════════════════
# RETRO OS ARCADE - Start Script
# ═══════════════════════════════════════════

cd "$(dirname "$0")"

# Prüfe ob Assets vorhanden sind
if [ ! -f "public/v86/libv86.js" ]; then
    echo "Assets fehlen - starte Download..."
    bash scripts/download-assets.sh
fi

# Prüfe ob node_modules existiert
if [ ! -d "node_modules" ]; then
    echo "Installiere Dependencies..."
    npm install
fi

echo ""
echo "  ═══════════════════════════════════"
echo "  🕹️  RETRO OS ARCADE"
echo "  ═══════════════════════════════════"
echo ""

node server.js
