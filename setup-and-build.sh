#!/bin/bash

# VidFlow Universal Setup & Build Script
# This script prepares the environment and builds the Tauri app for Linux/Unix systems.

set -e

# Colors for output
RED='\033[0:31m'
GREEN='\033[0:32m'
BLUE='\033[0:34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting VidFlow Build Automation...${NC}"

# Detect OS
OS_TYPE="$(uname -s)"
echo -e "${BLUE}Detected OS: $OS_TYPE${NC}"

# 1. Install System Dependencies (Linux only)
if [ "$OS_TYPE" == "Linux" ]; then
    echo -e "${BLUE}Installing Linux system dependencies...${NC}"
    if [ -f /etc/debian_version ]; then
        sudo apt-get update
        sudo apt-get install -y \
            libwebkit2gtk-4.1-dev \
            build-essential \
            curl \
            wget \
            file \
            libssl-dev \
            libgtk-3-dev \
            libayatana-appindicator3-dev \
            librsvg2-dev
    else
        echo -e "${RED}Unsupported Linux distribution. Please manually install Tauri dependencies.${NC}"
    fi
fi

# 2. Check for Node.js
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install Node.js (https://nodejs.org/)${NC}"
    exit 1
fi

# 3. Check for Rust
if ! command -v rustc &> /dev/null; then
    echo -e "${BLUE}Installing Rust toolchain...${NC}"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
else
    echo -e "${GREEN}Rust is already installed.${NC}"
fi

# 4. Install Project Dependencies
echo -e "${BLUE}Installing project dependencies (npm)...${NC}"
npm install

# 5. Build for current platform
echo -e "${BLUE}Starting Tauri Build...${NC}"
npm run tauri build

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}BUILD COMPLETE!${NC}"
echo -e "${GREEN}Final binaries can be found in:${NC}"
echo -e "${BLUE}src-tauri/target/release/bundle/${NC}"
echo -e "${GREEN}========================================${NC}"
