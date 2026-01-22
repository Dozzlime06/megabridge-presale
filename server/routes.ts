import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { purchaseSchema } from "@shared/schema";

let cachedEthPrice: number | null = null;
let lastPriceFetch: number = 0;
let cachedBalance: number | null = null;
let lastBalanceFetch: number = 0;
const PRICE_CACHE_MS = 60000; // Cache for 1 minute
const BALANCE_CACHE_MS = 30000; // Cache balance for 30 seconds

const PRESALE_ADDRESS = '0xf9ea9da67bb4cb831cf1ed0570ededb070553473';

async function fetchEthPrice(): Promise<number | null> {
  const now = Date.now();
  if (cachedEthPrice && now - lastPriceFetch < PRICE_CACHE_MS) {
    return cachedEthPrice;
  }
  
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    const data = await response.json();
    cachedEthPrice = data.ethereum?.usd ?? null;
    lastPriceFetch = now;
    return cachedEthPrice;
  } catch (error) {
    console.error('Failed to fetch ETH price:', error);
    return cachedEthPrice;
  }
}

async function fetchPresaleBalance(): Promise<number> {
  const now = Date.now();
  if (cachedBalance !== null && now - lastBalanceFetch < BALANCE_CACHE_MS) {
    return cachedBalance;
  }
  
  try {
    // Use public Ethereum RPC to fetch balance
    const response = await fetch('https://eth.llamarpc.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [PRESALE_ADDRESS, 'latest'],
        id: 1
      })
    });
    const data = await response.json();
    if (data.result) {
      // Convert hex wei to ETH
      const weiBalance = BigInt(data.result);
      cachedBalance = Number(weiBalance) / 1e18;
      lastBalanceFetch = now;
      return cachedBalance;
    }
    return cachedBalance ?? 0;
  } catch (error) {
    console.error('Failed to fetch presale balance:', error);
    return cachedBalance ?? 0;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/presale/stats", async (req, res) => {
    const [stats, ethPriceUsd, totalRaised] = await Promise.all([
      storage.getPresaleStats(),
      fetchEthPrice(),
      fetchPresaleBalance()
    ]);
    res.json({ ...stats, ethPriceUsd, totalRaised });
  });

  app.post("/api/presale/purchase", async (req, res) => {
    try {
      const purchase = purchaseSchema.parse(req.body);
      const recorded = await storage.recordPurchase(purchase);
      res.json(recorded);
    } catch (error) {
      res.status(400).json({ error: "Invalid purchase data" });
    }
  });

  return httpServer;
}
