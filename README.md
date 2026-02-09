# VidFlow

VidFlow is a stunning, high-performance desktop application for downloading videos and audio from the web. Designed with a premium "Glassmorphism" aesthetic, it leverages the power of Rust and Tauri to provide a blazing-fast, secure, and resource-efficient experience.

---

## ✨ Features

- **🚀 Blazing Fast**: Concurrent fragment downloading (`-N 8`) for maximal bandwidth utilization.
- **🎨 Premium UI**: Modern glassmorphism design with fluid Framer Motion animations and dark mode.
- **🛡️ Production Hardened**: Authoritative backend state machine ensures process integrity.
- **📊 Real-time Metrics**: Stable numeric progress tracking (Speed, ETA, Total Size).
- **📂 Task Recovery**: Automatic crash recovery and persistent task history via a local JSON store.
- **🛠️ High Compatibility**: Supports 1000+ sites via the latest `yt-dlp` and `ffmpeg` engine.
- **🍪 Privacy Ready**: Secure cookie management for authenticated/private downloads.

## 🏗️ Technical Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand.
- **Backend**: Rust, Tauri v2 (Internal State Management, IPC, OS Shell integration).
- **Core Engine**: `yt-dlp` (Media acquisition), `ffmpeg` (Post-processing/Merging).

## 🚀 Getting Started

### Prerequisites

VidFlow requires the following binaries to be installed and available in your system **PATH**:
1. **[yt-dlp](https://github.com/yt-dlp/yt-dlp)**: Media downloader (Version >= 2023.01.01).
2. **[ffmpeg](https://ffmpeg.org/)**: For merging video/audio streams.

### Quick Start (Dev)

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run Development Server**:
   ```bash
   npm run tauri dev
   ```

### Building for Production

To create a optimized, production-ready bundle:
```bash
npm run tauri build
```

## 📖 Deep Dive

For a detailed exploration of the system architecture, security model, and internal mechanics, refer to the technical documentation:
👉 **[ARCHITECTURE.md](./ARCHITECTURE.md)**

## ⚖️ Legal Disclaimer

**VidFlow is intended for personal use and for downloading content that you have a legal right to access.**
- Users are solely responsible for complying with the terms of service of any platform.
- The developers do not condone copyright infringement or any use that violates local/international laws.

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
