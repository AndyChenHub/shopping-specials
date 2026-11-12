# Aussie Supermarket Specials (iOS + Web Companion)

Browse weekly specials, **½ Price** deals, and **Special Buys** across **Woolworths**, **Coles**, and **ALDI** in one unified iOS app built with **React Native (Expo)** and a lightweight **Node.js** web-scraping & catalogue-downloading backend.

## Architecture

- **`server/`** — Node.js + Express companion backend that searches the web, discovers current weekly catalogues, downloads product specials from **Woolworths**, **Coles**, and **ALDI**, normalizes categories/savings/half-price badges, and caches them locally in `server/.cache/specials-cache.json`.
- **`app/`** — React Native (Expo + TypeScript) iOS app (compatible with **Expo Go** on iPhone, iOS Simulator, and **Web** preview on Windows). Automatically detects your PC's LAN IP when scanned via Expo Go on the same Wi-Fi network.

## Quick Start (Windows + iPhone)

### 1. Start the Specials Backend Server
```powershell
npm run server
```
Runs at `http://localhost:3001` (and binds to `0.0.0.0:3001` on your local Wi-Fi network so your iPhone can reach it automatically).

### 2. Start the Expo iOS App
Open a second terminal:
```powershell
npm run app
```
- **On your iPhone**: Install the free **Expo Go** app from the iOS App Store, connect your iPhone to the same Wi-Fi as your Windows PC, and scan the QR code shown in the terminal with your iPhone Camera app.
- **On Windows (Web Preview)**: Press `w` in the Expo terminal (or run `npm run app:web`) to preview and test directly in your browser.

## Features
- **Live Web Downloading**: Pull-to-refresh or tap **Sync** to fetch the latest weekly catalogue specials across Woolworths, Coles, and ALDI.
- **Store Filter**: Filter instantaneously between All Stores, Woolworths, Coles, and ALDI.
- **½ Price & Category Filters**: Toggle iconic **½ Price** specials only, filter by grocery aisle (Fruit & Veg, Meat & Seafood, Fridge & Dairy, Pantry & Snacks, Freezer, Drinks, Household & Pet, Health & Beauty, Special Buys), and sort by biggest % discount, biggest $ savings, or lowest price.
- **Instant + Live Web Search**: Search downloaded catalogues immediately or query live retailer feeds.
- **Saved Deals List**: Tap the bookmark icon on any deal to build a shortlist grouped by supermarket with automatic total cost & savings calculation.
