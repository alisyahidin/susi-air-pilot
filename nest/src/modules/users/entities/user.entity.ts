import { z } from 'zod';

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  username: z.string(),
  imageUrl: z.url()
});

export type User = z.infer<typeof userSchema>;