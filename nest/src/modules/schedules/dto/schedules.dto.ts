import { z } from 'zod';

export const schedulesQuerySchema = z.object({
  year: z.coerce.number({ error: 'Use a year like 2026.' }).int().min(2000).max(2100).optional(),
  month: z.coerce.number({ error: 'Use a month from 1 to 12.' }).int().min(1, 'Use a month from 1 to 12.').max(12, 'Use a month from 1 to 12.').optional(),
});

export type SchedulesQueryDto = z.infer<typeof schedulesQuerySchema>;

const yearMonth = z.string().regex(/^\d{4}-\d{2}$/);

export const schedulesResponseSchema = z.object({
  year: z.number(),
  month: z.number(),
  available: z.object({ from: yearMonth, to: yearMonth }).nullable(),
  legend: z.array(z.object({ code: z.string(), label: z.string(), color: z.string() })),
  days: z.array(
    z.object({
      id: z.string(),
      date: z.iso.date(),
      status: z.enum(['upcoming', 'completed']),
      dutyType: z.string(),
      baseName: z.string(),
      baseColor: z.string(),
      countSchedules: z.number(),
      countLogbooks: z.number(),
    }),
  ),
});

export type SchedulesResponseDto = z.infer<typeof schedulesResponseSchema>;
