import { z } from 'zod';
import { userSchema } from '../../users/entities/user.entity.js';

export const sessionResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(), /** Seconds until the access token expires */
  user: userSchema,
});

export type SessionResponseDto = z.infer<typeof sessionResponseSchema>;
