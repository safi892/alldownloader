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
            FFPROBE_URL="https://github.com/eugeneware/ffprobe-static/releases/download/b5.0.1/darwin-arm64"
        else
            TRIPLE="x86_64-apple-darwin"
            FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b5.0.1/darwin-x64"
            FFPROBE_URL="https://github.com/eugeneware/ffprobe-static/releases/download/b5.0.1/darwin-x64"
        fi
        YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
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

echo "✅ Sidecars setup successfully in src-tauri/bin/"
