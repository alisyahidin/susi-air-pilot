import { z } from 'zod';

export const meResponseSchema = z.object({
  name: z.string(),
  totalFlightHours: z.number(),
  imageUrl: z.url()
});

export type MeResponseDto = z.infer<typeof meResponseSchema>;
