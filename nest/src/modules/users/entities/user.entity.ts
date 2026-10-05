import { z } from 'zod';

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  username: z.string(),
  image_url: z.url()
});

export type User = z.infer<typeof userSchema>;