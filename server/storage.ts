import { type PresaleStats, type Purchase } from "@shared/schema";

const PRESALE_ADDRESS = '0xf9ea9da67bb4cb831cf1ed0570ededb070553473';

export interface IStorage {
  getPresaleStats(): Promise<PresaleStats>;
  recordPurchase(purchase: Purchase): Promise<Purchase>;
  getPurchases(): Promise<Purchase[]>;
}

export class MemStorage implements IStorage {
  private purchases: Purchase[] = [];
  private totalRaised: number = 0;

  async getPresaleStats(): Promise<PresaleStats> {
    return {
      totalRaised: this.totalRaised,
      hardCap: 15,
      presalePriceUsd: 0.0005,
      publicPriceUsd: 0.0015,
      presaleEndDate: '2026-02-15T00:00:00Z',
      presaleAddress: PRESALE_ADDRESS,
    };
  }

  async recordPurchase(purchase: Purchase): Promise<Purchase> {
    this.purchases.push(purchase);
    this.totalRaised += purchase.ethAmount;
    return purchase;
  }

  async getPurchases(): Promise<Purchase[]> {
    return this.purchases;
  }
}

export const storage = new MemStorage();
