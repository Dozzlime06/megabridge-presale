import type { VercelRequest, VercelResponse } from '@vercel/node';

const PRESALE_ADDRESS = '0xf9ea9da67bb4cb831cf1ed0570ededb070553473';
const HARD_CAP = 15;
const PRESALE_PRICE_USD = 0.0005;
const PUBLIC_PRICE_USD = 0.0015;
const PRESALE_END_DATE = '2026-02-15T00:00:00Z';

let cachedEthPrice: number | null = null;
let lastPriceFetch: number = 0;
let cachedBalance: number | null = null;
let lastBalanceFetch: number = 0;
const PRICE_CACHE_MS = 60000;
const BALANCE_CACHE_MS = 30000;

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const [ethPriceUsd, totalRaised] = await Promise.all([
    fetchEthPrice(),
    fetchPresaleBalance()
  ]);

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
  
  return res.json({
    totalRaised,
    hardCap: HARD_CAP,
    presalePriceUsd: PRESALE_PRICE_USD,
    publicPriceUsd: PUBLIC_PRICE_USD,
    presaleEndDate: PRESALE_END_DATE,
    presaleAddress: PRESALE_ADDRESS,
    ethPriceUsd
  });
}
