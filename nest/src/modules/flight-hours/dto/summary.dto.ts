import { z } from 'zod';
import { limitStatusSchema } from './hours-to-limit.dto.js';

export const summaryRangeSchema = z.enum(['1w', '1m', '3m', '6m', '1y']);

export type SummaryRange = z.infer<typeof summaryRangeSchema>;

export const flightHoursSummaryQuerySchema = z.object({
  range: summaryRangeSchema.default('1w'),
  date: z.iso.date({ error: 'Use a date like 2026-05-15.' }).optional(),
});

export type FlightHoursSummaryQueryDto = z.infer<typeof flightHoursSummaryQuerySchema>;

export const flightHoursSummaryResponseSchema = z.object({
  date: z.iso.date(),
  range: summaryRangeSchema,
  windowDays: z.number(),
  limit: z.number(),
  max: z.number(),
  today: z.object({
    hours: z.number(),
    remaining: z.number(),
    status: limitStatusSchema,
  }),
  points: z.array(
    z.object({
      date: z.iso.date(),
      hours: z.number(),
      status: limitStatusSchema,
      /** After `date`: scheduled, not flown yet */
      projected: z.boolean(),
    }),
  ),
});

export type FlightHoursSummaryResponseDto = z.infer<typeof flightHoursSummaryResponseSchema>;
