#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is required." >&2
  exit 1
fi

if [ "${1:-}" = "" ]; then
  echo "Usage: $0 <path-to-apk>" >&2
  echo "Example: $0 PaperRisk/build/PaperRisk-release.apk" >&2
  exit 1
fi

APK_PATH="$1"
RELEASE_TAG="android-latest"
ASSET_NAME="PaperRisk-latest.apk"

if [ ! -f "$APK_PATH" ]; then
  echo "Error: APK file not found at '$APK_PATH'." >&2
  exit 1
fi

echo "Uploading '$APK_PATH' to release '$RELEASE_TAG' as '$ASSET_NAME'..."
gh release upload "$RELEASE_TAG" "$APK_PATH#$ASSET_NAME" --clobber

echo "Done. Public URL:"
echo "https://github.com/svobodamatyass-hub/New-project-2/releases/download/android-latest/PaperRisk-latest.apk"
