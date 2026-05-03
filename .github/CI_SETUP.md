# CI/CD Setup Guide

This document explains how to configure GitHub Actions for building and releasing VidFlow.

## Table of Contents

1. [Required Secrets](#required-secrets)
2. [Workflow Overview](#workflow-overview)
3. [Manual Setup Steps](#manual-setup-steps)
4. [Troubleshooting](#troubleshooting)

---

## Required Secrets

To enable full release functionality (code signing, notarization), add these secrets to your GitHub repository:

### Repository Settings

Navigate to: **Settings → Secrets and variables → Actions**

### macOS Code Signing

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `APPLE_DEVELOPER_ID_CERTIFICATE_BASE64` | Developer ID Application certificate (P12) encoded as Base64 | 1. Create Developer ID Application certificate in Apple Developer Portal<br>2. Export as P12 (with password)<br>3. `base64 -w0 certificate.p12` |
| `APPLE_DEVELOPER_ID_CERTIFICATE_PASSWORD` | Password for the P12 certificate | The password you set when exporting |
| `APPLE_SIGNING_IDENTITY` | Code signing identity name (e.g., "Developer ID Application: Your Name (TEAMID)") | From `security find-identity -v` after importing |
| `APPLE_NOTARY_TEAM_ID` | Your Apple Team ID | Apple Developer Portal → Membership |
| `APPLE_NOTARY_ISSUER_ID` | Apple ID email for notary | Your Apple ID email |
| `APPLE_NOTARY_APP_SPECIFIC_PASSWORD` | App-specific password for notary | [appleid.apple.com](https://appleid.apple.com) → Security → App-Specific Passwords |

### Windows Code Signing

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `WINDOWS_CODE_SIGNING_CERTIFICATE_BASE64` | EV Code Signing certificate (PFX) encoded as Base64 | Purchase from DigiCert/Symantec/etc.<br>Export as PFX |
| `WINDOWS_CODE_SIGNING_PASSWORD` | Password for the PFX certificate | The password you set when exporting |

### Linux GPG Signing

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `LINUX_GPG_PRIVATE_KEY` | GPG private key (ASCII-armored) | `gpg --export-secret-key your@email.com > key.asc` then base64 |
| `LINUX_GPG_PASSPHRASE` | Passphrase for the GPG key | Your GPG key passphrase |

### Optional: Tauri Updater

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `TAURI_UPDATE_PRIVATE_KEY` | Private key for signing updates | `tauri sign-key generate` |
| `TAURI_UPDATE_PUBLIC_KEY` | Public key for verifying updates | Part of key pair generation |

---

## Workflow Overview

### CI Pipeline (`ci.yml`)

Runs on: **Every PR and Push to main/develop**

**Jobs:**
1. **Code Quality** - Rust formatting, Clippy, TypeScript, ESLint
2. **Security Audits** - cargo-audit, cargo-deny, npm audit, secret scanning
3. **Tests** - Rust tests, frontend tests
4. **Build Verify** - Matrix build across all platforms (macOS ARM64, macOS x86_64, Linux, Windows)

### Release Pipeline (`release.yml`)

Runs on: **Git tag push (v*.*.*)**

**Jobs:**
1. **Validate** - Verify version matches config
2. **Build** - Matrix build for all platforms with:
   - Code signing (macOS, Windows)
   - Notarization (macOS)
   - GPG signing (Linux)
3. **Create Release** - Upload artifacts to GitHub Release

### Security Audit (`security-audit.yml`)

Runs on: **Weekly schedule + PR changes to Cargo.lock**

**Jobs:**
- Rust security audit (cargo-audit)
- License compliance (cargo-deny)
- npm vulnerability scan
- CodeQL analysis
- Dependency review
- Trivy binary scanning
- SBOM generation

---

## Manual Setup Steps

### 1. Enable GitHub Actions

Go to **Actions → Enable all actions**

### 2. Configure Branch Protection

Go to **Settings → Branches → Add rule**

```
Branch name pattern: main
✅ Require pull request reviews before merging
✅ Require status checks to pass before merging
✅ Select CI jobs to require
```

### 3. Add Secrets

Follow the [Required Secrets](#required-secrets) section above.

### 4. First Release Test

```bash
# Make a test tag (won't actually release without secrets)
git tag v0.1.99-test
git push origin v0.1.99-test
```

This will trigger the release workflow but may fail on signing steps without proper secrets.

---

## Troubleshooting

### Common Issues

#### WebKit2GTK Errors on Ubuntu

```
error: failed to run custom build command for `webkit2gtk`
```

**Fix:**
```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  libssl-dev
```

#### macOS Code Signing Errors

```
error: The specified item could not be found in the keychain
```

**Fix:**
- Verify `APPLE_SIGNING_IDENTITY` matches exactly (copy from `security find-identity -v`)
- Ensure certificate is imported into a temporary keychain
- Check certificate is not expired

#### Notarization Errors

```
error: Could not upload file for notarization
```

**Fix:**
- Verify Apple ID and team ID are correct
- Ensure app-specific password is valid
- Check network connectivity to Apple servers

#### Windows SignTool Errors

```
The signing certificate is not valid for signing
```

**Fix:**
- Ensure EV certificate is valid
- Check timestamp server URL is accessible
- Verify certificate chain is complete

#### Cache Invalidation Issues

**Fix:**
- Add `runs-on` to cache keys: `${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}`
- Clear caches manually in Actions settings
- Use `actions/cache@v4` with proper restore-keys

#### Rust Cross-Compilation

```
error: unable to find linker
```

**Fix:**
Ensure `.cargo/config.toml` has proper linker flags. For Windows cross-compilation on Linux:

```bash
sudo apt-get install mingw-w64
```

---

## Build Times (Estimated)

| Platform | Build Time |
|----------|-------------|
| macOS ARM64 | ~15-20 min |
| macOS x86_64 | ~15-20 min |
| Linux | ~10-15 min |
| Windows | ~10-15 min |

---

## Security Considerations

1. **Never commit secrets** - Use GitHub Secrets only
2. **Rotate keys regularly** - Especially GPG and Apple certificates
3. **Audit dependencies** - Security audit runs weekly
4. **Sign all binaries** - Prevents tampering in distribution

---

## Questions?

- Check [Tauri Documentation](https://tauri.app/distribute/sign/)
- Check [GitHub Actions Documentation](https://docs.github.com/en/actions)
- Open an issue for help