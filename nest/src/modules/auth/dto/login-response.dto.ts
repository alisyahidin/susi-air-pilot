import { z } from 'zod';
import { userSchema } from '../../users/entities/user.entity.js';

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: userSchema,
});

export type LoginResponseDto = z.infer<typeof loginResponseSchema>;
