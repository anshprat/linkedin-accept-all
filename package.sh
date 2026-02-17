#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NAME="linkedin-accept-all"
VERSION=$(grep '"version"' "$SCRIPT_DIR/manifest.json" | sed 's/.*: *"\(.*\)".*/\1/')
OUT="$SCRIPT_DIR/${NAME}-v${VERSION}.zip"

# Clean previous build
rm -f "$OUT"

# Package only the extension files (exclude dev/build artifacts)
cd "$SCRIPT_DIR"
zip -r "$OUT" \
  manifest.json \
  content.js \
  popup.html \
  popup.js \
  popup.css \
  store/icon48.png \
  store/icon128.png

echo ""
echo "Packaged: $OUT"
echo "Version:  $VERSION"
echo "Size:     $(du -h "$OUT" | cut -f1)"
