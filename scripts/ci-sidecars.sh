#!/bin/bash

# CI helper: download sidecar binaries and create wrapper for a target triple.
set -euo pipefail

TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  echo "Usage: $0 <target-triple>" >&2
  exit 1
fi

TRIPLE="$TARGET"
SUFFIX=""
OS_KIND=""

case "$TARGET" in
  aarch64-apple-darwin)
    OS_KIND="macos"
    FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b5.0.1/darwin-arm64"
    FFPROBE_URL="https://github.com/eugeneware/ffprobe-static/releases/download/b5.3.0/darwin-arm64"
    YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
    ;;
  x86_64-apple-darwin)
    OS_KIND="macos"
    FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b5.0.1/darwin-x64"
    FFPROBE_URL="https://github.com/eugeneware/ffprobe-static/releases/download/b5.3.0/darwin-x64"
    YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
    ;;
  x86_64-unknown-linux-gnu)
    OS_KIND="linux"
    FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b5.0.1/linux-x64"
    FFPROBE_URL="https://github.com/eugeneware/ffprobe-static/releases/download/b5.0.1/linux-x64"
    YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux"
    ;;
  x86_64-pc-windows-msvc)
    OS_KIND="windows"
    SUFFIX=".exe"
    FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b5.0.1/win32-x64"
    FFPROBE_URL="https://github.com/eugeneware/ffprobe-static/releases/download/b5.0.1/win32-x64"
    YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
    ;;
  *)
    echo "Unsupported target: $TARGET" >&2
    exit 1
    ;;
esac

mkdir -p src-tauri/bin

echo "Downloading sidecars for $TRIPLE" >&2
curl -sL "$YTDLP_URL" -o "src-tauri/bin/yt-dlp-$TRIPLE$SUFFIX"
curl -sL "$FFMPEG_URL" -o "src-tauri/bin/ffmpeg-$TRIPLE$SUFFIX"
curl -sL "$FFPROBE_URL" -o "src-tauri/bin/ffprobe-$TRIPLE$SUFFIX"

if [ "$OS_KIND" != "windows" ]; then
  chmod +x src-tauri/bin/*
  cat > "src-tauri/bin/yt-dlp-wrapper-$TRIPLE" << 'EOF'
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/yt-dlp" "$@"
EOF
  chmod +x "src-tauri/bin/yt-dlp-wrapper-$TRIPLE"
else
  cp "src-tauri/bin/yt-dlp-$TRIPLE.exe" "src-tauri/bin/yt-dlp-wrapper-$TRIPLE.exe"
fi
