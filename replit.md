# MegaBridge Presale Website

## Overview
A presale website for MegaBridge token ($MBRIDGE) - the first cross-chain bridge to MegaETH. Features wallet connection via Privy, ETH purchase flow, and manual sending option.

## Key Details
- **Presale Price:** 0.0005 ETH per token
- **Public Launch Price:** 0.0015 ETH (3x from presale)
- **Hard Cap:** 15 ETH
- **Network:** Ethereum Mainnet (presale) → MegaETH Mainnet (token distribution)
- **Presale Address:** 0xf9ea9da67bb4cb831cf1ed0570ededb070553473

## Tech Stack
- **Frontend:** React + Vite + TypeScript
- **Backend:** Express.js
- **Styling:** Tailwind CSS with custom dark theme (neon green/purple)
- **Wallet:** Privy SDK for wallet connection
- **State:** TanStack Query for data fetching

## Project Structure
```
client/
  src/
    pages/presale.tsx     # Main presale page with all sections
    lib/privy.tsx         # Privy provider configuration
    App.tsx               # Root app with routing
server/
  routes.ts               # API endpoints
  storage.ts              # In-memory storage for presale stats
shared/
  schema.ts               # TypeScript types for presale data
```

## API Endpoints
- `GET /api/presale/stats` - Returns presale statistics (totalRaised, hardCap, prices, endDate, address)
- `POST /api/presale/purchase` - Records a purchase (for tracking)

## Environment Variables
- `VITE_PRIVY_APP_ID` - Privy App ID for wallet connection (required)

## Features
- Hero section with countdown timer and progress bar
- Wallet connection via Privy (Ethereum Mainnet)
- ETH input with live token calculation
- Manual purchase option with copy-to-clipboard address
- Tokenomics visualization
- Roadmap display
- Social links and footer with disclaimer

## Running
The app runs on port 5000 via `npm run dev`
