#!/bin/bash
# ═══════════════════════════════════════════
# RETRO OS ARCADE - Asset Downloader
# ═══════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PUBLIC_DIR="$PROJECT_DIR/public"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  RETRO OS ARCADE - Asset Download${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

download() {
    local url="$1"
    local dest="$2"
    local name="$3"

    if [ -f "$dest" ]; then
        echo -e "  ${GREEN}✓${NC} $name (bereits vorhanden)"
        return 0
    fi

    echo -e "  ${YELLOW}↓${NC} $name ..."
    mkdir -p "$(dirname "$dest")"
    if curl -L --fail --progress-bar -o "$dest" "$url"; then
        echo -e "  ${GREEN}✓${NC} $name"
    else
        echo -e "  ✗ FEHLER bei $name"
        rm -f "$dest"
        return 1
    fi
}

# ── v86 Engine ──
echo -e "${BLUE}[1/3] v86 Engine${NC}"
V86_RELEASE="https://github.com/copy/v86/releases/download/latest"
download "$V86_RELEASE/libv86.js" "$PUBLIC_DIR/v86/libv86.js" "libv86.js"
download "$V86_RELEASE/v86.wasm" "$PUBLIC_DIR/v86/v86.wasm" "v86.wasm"
echo ""

# ── BIOS ──
echo -e "${BLUE}[2/3] BIOS Dateien${NC}"
BIOS_BASE="https://raw.githubusercontent.com/copy/v86/master/bios"
download "$BIOS_BASE/seabios.bin" "$PUBLIC_DIR/bios/seabios.bin" "SeaBIOS"
download "$BIOS_BASE/vgabios.bin" "$PUBLIC_DIR/bios/vgabios.bin" "VGA BIOS"
echo ""

# ── Disk Images ──
echo -e "${BLUE}[3/3] Disk Images${NC}"
IMG_BASE="https://i.copy.sh"
download "$IMG_BASE/windows2.img" "$PUBLIC_DIR/images/windows2.img" "Windows 2.03 (4 MB)"
download "$IMG_BASE/win31.img" "$PUBLIC_DIR/images/win31.img" "Windows 3.1 (33 MB)"
download_win95() {
    local dest="$PUBLIC_DIR/images/windows95.img"
    if [ -f "$dest" ]; then
        echo -e "  ${GREEN}✓${NC} Windows 95 (~450 MB) (bereits vorhanden)"
        return 0
    fi
    echo -e "  ${YELLOW}↓${NC} Windows 95 (~450 MB) - 1800 Chunks von CDN ..."
    local tmpdir=$(mktemp -d)
    local base="https://i.copy.sh/windows95-v2"
    seq 0 1799 | xargs -P 16 -I{} bash -c \
        'curl -sf -o "'"$tmpdir"'/chunk_{}" "'"$base"'/$(({} * 262144))-$((({} + 1) * 262144)).img"' 2>&1
    > "$dest"
    for i in $(seq 0 1799); do cat "$tmpdir/chunk_$i" >> "$dest"; done
    rm -rf "$tmpdir"
    local actual=$(stat -c%s "$dest")
    if [ "$actual" -eq 471859200 ]; then
        echo -e "  ${GREEN}✓${NC} Windows 95 (~450 MB)"
    else
        echo -e "  ✗ FEHLER bei Windows 95 (Groesse: $actual)"
        rm -f "$dest"
        return 1
    fi
}
download_win95
download "$IMG_BASE/freedos722.img" "$PUBLIC_DIR/images/freedos722.img" "FreeDOS (720 KB)"
download "$IMG_BASE/msdos.img" "$PUBLIC_DIR/images/msdos.img" "MS-DOS (8 MB)"
echo ""

echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  Alle Assets heruntergeladen!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "Starte mit: npm start"
