#!/bin/bash

# VidFlow Sidecar Setup Script
# This script downloads the necessary binaries for local development.

set -e

mkdir -p src-tauri/bin

# Detect OS and Architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
    Darwin*)
        if [ "$ARCH" == "arm64" ]; then
            TRIPLE="aarch64-apple-darwin"
            FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b5.0.1/darwin-arm64"
            FFPROBE_URL="https://github.com/eugeneware/ffprobe-static/releases/download/b5.3.0/darwin-arm64"
            YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
        else
            TRIPLE="x86_64-apple-darwin"
            FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b5.0.1/darwin-x64"
            FFPROBE_URL="https://github.com/eugeneware/ffprobe-static/releases/download/b5.3.0/darwin-x64"
            YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
        fi
        ;;
    Linux*)
        TRIPLE="x86_64-unknown-linux-gnu"
        YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux"
        FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b5.0.1/linux-x64"
        FFPROBE_URL="https://github.com/eugeneware/ffprobe-static/releases/download/b5.0.1/linux-x64"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        TRIPLE="x86_64-pc-windows-msvc"
        YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
        FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b5.0.1/win32-x64"
        FFPROBE_URL="https://github.com/eugeneware/ffprobe-static/releases/download/b5.0.1/win32-x64"
        SUFFIX=".exe"
        ;;
    *)
        echo "Unsupported OS: $OS"
        exit 1
        ;;
esac

echo "Detected Triple: $TRIPLE"
echo "Downloading yt-dlp..."
curl -L "$YTDLP_URL" -o "src-tauri/bin/yt-dlp-$TRIPLE$SUFFIX"

echo "Downloading ffmpeg..."
curl -L "$FFMPEG_URL" -o "src-tauri/bin/ffmpeg-$TRIPLE$SUFFIX"

echo "Downloading ffprobe..."
curl -L "$FFPROBE_URL" -o "src-tauri/bin/ffprobe-$TRIPLE$SUFFIX"

chmod +x src-tauri/bin/*

# Create wrapper script for yt-dlp (macOS and Linux)
if [ "$OS" == "Darwin" ] || [ "$OS" == "Linux" ]; then
    echo "Creating yt-dlp wrapper script..."
    cat > "src-tauri/bin/yt-dlp-wrapper-$TRIPLE$SUFFIX" << EOF
#!/bin/bash
DIR="\$(cd "\$(dirname "\$0")" && pwd)"
exec "\$DIR/yt-dlp-$TRIPLE$SUFFIX" "\$@"
EOF
    chmod +x "src-tauri/bin/yt-dlp-wrapper-$TRIPLE$SUFFIX"
fi

# Clear macOS quarantine flags and ad-hoc sign for local execution
if [ "$OS" == "Darwin" ]; then
    echo "Clearing macOS quarantine flags..."
    xattr -cr src-tauri/bin/ 2>/dev/null || true
    echo "Applying ad-hoc signatures..."
    codesign -s - src-tauri/bin/* 2>/dev/null || true
fi

# Verification
echo "Verifying binaries..."
if [ "$OS" == "Darwin" ] || [ "$OS" == "Linux" ]; then
    "./src-tauri/bin/yt-dlp-wrapper-$TRIPLE$SUFFIX" --version > /dev/null && echo "✅ yt-dlp wrapper ok" || echo "❌ yt-dlp wrapper failed"
fi
"./src-tauri/bin/ffmpeg-$TRIPLE$SUFFIX" -version > /dev/null && echo "✅ ffmpeg ok" || echo "❌ ffmpeg failed"

echo "✅ Sidecars setup successfully in src-tauri/bin/"
echo ""
echo "You can now run: npm run tauri dev"
