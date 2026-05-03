#!/bin/bash

# Start VidFlow in development mode (macOS/Linux)
set -e

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed. Install Node.js from https://nodejs.org/" >&2
  exit 1
fi

if ! command -v rustc >/dev/null 2>&1; then
  echo "Error: Rust is not installed. Install from https://rustup.rs/" >&2
  exit 1
fi

# Install JS dependencies
npm install

# Ensure sidecar binaries are present
./setup-sidecars.sh

# Start the Tauri dev app
npm run tauri dev
