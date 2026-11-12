# Aussie Supermarket Specials (iOS `.ipa` + Web Companion)

Browse weekly specials, **½ Price** deals, and **Special Buys** across **Woolworths**, **Coles**, and **ALDI** in one unified iOS app built with **React Native (Expo)** and an optional **Node.js** companion backend.

## Architecture

- **`app/`** — React Native (Expo + TypeScript) iOS app:
  - **Standalone On-Device Sync (`.ipa` Ready)**: Downloads and caches Woolworths, Coles, and ALDI specials directly on your iPhone over 4G/5G or Wi-Fi—no PC server required once installed!
  - **Auto LAN Companion Mode**: Also supports connecting to `server/` when previewing in a desktop browser or running on local Wi-Fi.
- **`server/`** — Optional Node.js + Express companion backend that fetches and caches weekly specials locally (`server/.cache/specials-cache.json`) for fast desktop/web previewing.

---

## Building an iOS `.ipa` File (from Windows)

Because Apple's Xcode compiler only runs on macOS, this repo includes two cloud pipelines so you can generate an `.ipa` directly from Windows:

### Option 1: Free `.ipa` via GitHub Actions (No Paid Apple Developer Account Needed)
The workflow in [`.github/workflows/build-ios-ipa.yml`](./.github/workflows/build-ios-ipa.yml) compiles a native Release `.ipa` on a macOS + Xcode runner automatically whenever `app/` is pushed to `main` (or manually via **Run workflow**).

1. **Push your commits to GitHub**:
   ```powershell
   git push -u origin main
   ```
2. Open your repository's **Actions** tab on GitHub (`Build iOS IPA`) and wait ~6–10 minutes for the macOS build to finish.
3. Download the **`AussieSpecials-iOS-ipa`** zip artifact and extract **`AussieSpecials.ipa`**.
4. **Install onto your iPhone for free** using a standard Apple ID with **[Sideloadly](https://sideloadly.io/)** or **[AltStore](https://altstore.io/)** on Windows:
   - Connect your iPhone via USB (with iTunes + iCloud installed from Apple's website, not Microsoft Store), drag `AussieSpecials.ipa` into Sideloadly, enter your Apple ID, and click **Start**.
   - On your iPhone, go to **Settings → General → VPN & Device Management** to trust your developer profile (and enable **Developer Mode** under **Settings → Privacy & Security** on iOS 16+).

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
