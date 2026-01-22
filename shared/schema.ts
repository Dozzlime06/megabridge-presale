import { z } from "zod";

export const presaleStatsSchema = z.object({
  totalRaised: z.number(),
  hardCap: z.number(),
  presalePriceUsd: z.number(),
  publicPriceUsd: z.number(),
  presaleEndDate: z.string(),
  presaleAddress: z.string(),
  ethPriceUsd: z.number().optional(),
});

export type PresaleStats = z.infer<typeof presaleStatsSchema>;

export const purchaseSchema = z.object({
  walletAddress: z.string(),
  ethAmount: z.number(),
  tokensReceived: z.number(),
  txHash: z.string().optional(),
});

export type Purchase = z.infer<typeof purchaseSchema>;
