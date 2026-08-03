import { z } from 'zod';

export const forecastQuerySchema = z.object({
  accountId: z.coerce.number().int().positive().optional(),
  horizonDays: z.coerce.number().int().positive().max(180).default(45),
});
export type ForecastQuery = z.infer<typeof forecastQuerySchema>;

export interface RecurringItemDto {
  description: string;
  categoryId: number | null;
  averageAmount: number; // integer pence, signed
  cadence: 'weekly' | 'monthly';
  /** 'high' = amount is consistent; 'variable' = cadence is solid but the amount itself fluctuates (e.g. a credit card payoff). averageAmount is the best projection either way. */
  confidence: 'high' | 'variable';
  nextDate: string;
  sampleCount: number;
}

export interface ForecastPointDto {
  date: string; // ISO YYYY-MM-DD
  projectedBalance: number; // integer pence
}

export interface ForecastEventDto {
  date: string;
  description: string;
  amount: number; // integer pence, signed
  categoryId: number | null;
  confidence: 'high' | 'variable';
  runningBalance: number;
}

export type ForecastDayHealth = 'comfortable' | 'tight' | 'belowZero';

export interface ForecastDto {
  accountId: number | null; // null = all accounts combined
  asOfBalance: number;
  horizonDays: number;
  points: ForecastPointDto[];
  recurringItems: RecurringItemDto[];
  events: ForecastEventDto[];
  projectedLow: { balance: number; date: string };
  health: { date: string; status: ForecastDayHealth }[];
  generatedAt: string;
}
