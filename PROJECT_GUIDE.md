# VidFlow Project Guide

This guide explains how the project is structured, how the app works end to end, and how to run it locally.

## 1) What this project is

VidFlow is a desktop video downloader built with:
- Frontend: React + TypeScript + Vite
- Backend: Rust (Tauri)
- Sidecar tools: yt-dlp + ffmpeg

The frontend calls the Rust backend over Tauri IPC. The backend launches yt-dlp and ffmpeg as child processes and reports progress back to the UI.

## 2) Project layout

Key folders in this repo:
- src/app: App bootstrap (main entry points)
- src/ui: React components, layouts, and UI primitives
- src/services: Tauri IPC helpers (frontend to backend)
- src/state: Zustand store for download state
- src/utils: Small helpers and formatting utilities
- src-tauri/src: Rust backend commands, task state machine, persistence
- src-tauri/bin: Sidecar binaries (yt-dlp, ffmpeg, ffprobe)

## 3) How it works (step by step)

1. User enters a URL in the UI.
2. Frontend calls a Tauri command to fetch metadata (fast yt-dlp call).
3. When the user starts a download, the frontend invokes a Rust command to create a download task.
4. The backend enforces a strict state machine (Queued -> Preparing -> Downloading -> Merging -> Completed).
5. The backend spawns yt-dlp as a child process (no shell), and parses numeric progress from stdout.
6. Progress events are emitted back to the UI and stored in the state store.
7. If merging is required, ffmpeg is invoked by yt-dlp.
8. On completion, the backend verifies output with ffprobe before marking the task Completed.
9. The backend writes a persistence file atomically so the UI can restore state on restart.
10. If the user cancels, the backend kills the entire process tree and cleans up partial files.

## 4) Run in development (macOS or Linux)

Prerequisites:
- Node.js + npm
- Rust toolchain

Steps:
1. Install dependencies:
   npm install
2. Download sidecar binaries:
   ./setup-sidecars.sh
3. Start the app in dev mode:
   npm run tauri dev

## 5) Run in development (Windows)

Prerequisites:
- Node.js + npm
- Rust toolchain
- Visual Studio Build Tools (Desktop development with C++)

Steps:
1. Install dependencies (PowerShell or Command Prompt):
   npm install
2. Download sidecar binaries (Git Bash or WSL):
   ./setup-sidecars.sh
3. Start the app in dev mode (PowerShell or Command Prompt):
   npm run tauri dev

## 6) Build a release

macOS or Linux:
- ./setup-and-build.sh

Windows (PowerShell as Administrator):
- ./setup-windows.ps1

Manual build (all platforms):
- npm run tauri build

## 7) Common commands

- Frontend dev server only:
  npm run dev
- Typecheck and build frontend:
  npm run build
- Run the Tauri CLI directly:
  npm run tauri

## 8) Troubleshooting

- If the app reports missing binaries, re-run:
  ./setup-sidecars.sh
- If downloads fail immediately, verify yt-dlp runs:
  src-tauri/bin/yt-dlp-<your-platform> --version

If you want a deeper architecture description, see ARCHITECTURE.md.
