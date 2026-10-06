import { z } from 'zod';

const isoDate = z.iso.date({ error: 'Use a date like 2026-05-15.' });

export const flightHoursQuerySchema = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine(({ from, to }) => !from || !to || from <= to, { path: ['to'], error: 'Use a date on or after from.' });

export type FlightHoursQueryDto = z.infer<typeof flightHoursQuerySchema>;

export const flightHoursResponseSchema = z.object({
  date: z.iso.date(),
  hours: z.number(),
});

export type FlightHoursResponseDto = z.infer<typeof flightHoursResponseSchema>[];
