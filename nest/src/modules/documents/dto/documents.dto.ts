import { z } from 'zod';

export const documentStatusSchema = z.enum(['valid', 'expiring', 'expired']);

export type DocumentStatus = z.infer<typeof documentStatusSchema>;

export const documentsResponseSchema = z.object({
  date: z.iso.date(),
  documents: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      expiryDate: z.iso.date(),
      daysRemaining: z.number(),
      status: documentStatusSchema,
    }),
  ),
});

export type DocumentsResponseDto = z.infer<typeof documentsResponseSchema>;
