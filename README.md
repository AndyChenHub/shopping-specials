# Aussie Specials & Price Compare (iOS `.ipa` + Web Companion)

Browse everyday supermarket items, filter by **On Sale** or **½ Price** deals, and **tap any item to compare live competitor prices** across **Amazon AU**, **Woolworths**, **Coles**, **ALDI**, and **IGA** in one unified iOS app built with **React Native (Expo)** and an optional **Node.js** companion backend.

## Key Features

- **Browse All Items or Filter by Sales & Stock**: Switch instantly between **All Items** (everyday groceries + specials), **On Sale**, **½ Price**, and **In Stock** items across **Woolworths**, **Coles**, **ALDI**, **IGA**, and **Amazon AU**.
- **Postcode / Suburb & Local Store Stock Checking**: Enter any Australian postcode or suburb (or tap **Use Current GPS Location**) to pick your preferred nearby **IGA**, **Woolworths**, and **ALDI** stores, set your state region for **Coles** & weekly catalogues, and see live **In Stock / Out of Stock** badges on cards and competitor comparisons.
- **One-Tap 5-Store Price & Stock Comparison**: Tapping any browsed item opens its detail sheet and fetches live side-by-side prices and stock status across **Amazon AU (`amazon.com.au`)**, **Woolworths**, **Coles**, **ALDI**, and **IGA**, highlighting the **Best Price**, unit prices, active promotions, and direct links to each store.
- **Auto Live Cross-Retailer Search**: Type any item (e.g. *chips*, *Nutella*, *Tim Tam*, *milk*, *Panadol*) to automatically search both regular everyday items and specials across all 5 retailers simultaneously.

## Architecture

- **`app/`** — React Native (Expo + TypeScript) iOS app:
  - **Standalone On-Device Sync & Comparison (`.ipa` Ready)**: Downloads catalogues, everyday staples, and live competitor prices directly on your iPhone over 4G/5G or Wi-Fi—no PC server required once installed!
  - **Auto LAN Companion Mode**: Also supports connecting to `server/` when previewing in a desktop browser or running on local Wi-Fi.
- **`server/`** — Optional Node.js + Express companion backend that fetches and caches items & weekly specials locally (`server/.cache/specials-cache.json`) and serves `/api/specials` + `/api/compare` for desktop/web previewing.

---

## Building an iOS `.ipa` File (from Windows)

Because Apple's Xcode compiler only runs on macOS, this repo includes two cloud pipelines so you can generate an `.ipa` directly from Windows:

### Option 1: Free Versioned `.ipa` Releases via GitHub Actions
The workflow in [`.github/workflows/build-ios-ipa.yml`](./.github/workflows/build-ios-ipa.yml) compiles a native Release `.ipa` on a macOS + Xcode runner automatically whenever `app/` is pushed to `main` (or manually via **Run workflow**):

- **Automatic Semantic Version + Build Numbering**: Before compiling, [`app/scripts/prepare-release-version.mjs`](./app/scripts/prepare-release-version.mjs) inspects existing `v*` Git tags, auto-increments the patch & iOS `CFBundleVersion` build number, embeds the version metadata into [`app/src/versionInfo.json`](./app/src/versionInfo.json), and names the binary `AussieSpecials-vX.Y.Z-bN.ipa`.
- **Automatic GitHub Releases**: Every build tags `vX.Y.Z` and publishes the versioned `.ipa`, its `.sha256` checksum, and auto-generated commit changelog to **GitHub Releases** (`https://github.com/AndyChenHub/shopping-specials/releases`).
- **In-App Update Checker**: The installed `.ipa` displays its current version badge (`vX.Y.Z`) in the header and checks GitHub Releases automatically, alerting you with one-tap **Download `.ipa`** and **SideStore / AltStore** install buttons when a newer `.ipa` is published.
- **Manual Major/Minor Version Bumps** (optional):
  ```powershell
  npm run version:minor   # e.g. 1.0.x -> 1.1.0
  npm run version:major   # e.g. 1.x.x -> 2.0.0
  npm run version:patch   # e.g. 1.0.0 -> 1.0.1
  ```

To install onto your iPhone for free using a standard Apple ID with **[Sideloadly](https://sideloadly.io/)**, **[AltStore](https://altstore.io/)**, or **[SideStore](https://sidestore.io/)**:
1. Download the latest `AussieSpecials-vX.Y.Z-bN.ipa` from your repo's **Releases** page on GitHub.
2. Sideload onto your iPhone over USB via Sideloadly (or directly on-device via SideStore/AltStore), then trust your developer profile under **Settings → General → VPN & Device Management**.

### Option 2: Signed `.ipa` via Expo EAS Cloud Build (Paid Apple Developer Account)
If you have a paid Apple Developer Program membership (\$99 USD/yr), run directly from PowerShell:
```powershell
# Ad-hoc internal distribution .ipa
npm run build:ipa

# App Store / TestFlight .ipa
npm run build:ipa:store
```

---

## Local Development (Expo Go / Web Preview)

### 1. Start the Companion Backend (Required for Web Browser Preview)
```powershell
npm run server
```

### 2. Start the Expo App
```powershell
npm run app
```
- **iPhone (Expo Go)**: Scan the terminal QR code with your iPhone Camera app.
- **Windows Browser Preview**: Run `npm run app:web` (or press `w` in the Expo terminal).
