import { z } from 'zod';

export const hoursToLimitQuerySchema = z.object({
  date: z.iso.date({ error: 'Use a date like 2026-05-15.' }).optional(),
});

export type HoursToLimitQueryDto = z.infer<typeof hoursToLimitQuerySchema>;

export const limitStatusSchema = z.enum(['within', 'approaching', 'at_limit', 'over']);

export type LimitStatus = z.infer<typeof limitStatusSchema>;

export const hoursToLimitResponseSchema = z.object({
  date: z.iso.date(),
  limits: z.array(
    z.object({
      period: z.enum(['daily', 'weekly', 'monthly', 'annual']),
      windowDays: z.number(),
      hours: z.number(),
      limit: z.number(),
      remaining: z.number(),
      status: limitStatusSchema,
    }),
  ),
});

export type HoursToLimitResponseDto = z.infer<typeof hoursToLimitResponseSchema>;
