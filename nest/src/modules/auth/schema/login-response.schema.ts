import { z } from 'zod';
import { userSchema } from '../../users/schema/user.schema.js';

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: userSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
