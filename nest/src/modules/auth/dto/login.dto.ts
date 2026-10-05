import { z } from 'zod';

const required = (message: string) => z.string({ error: message }).trim().min(1, message);

export const loginSchema = z.object({
  username: required('Enter your username.'),
  password: z.string({ error: 'Enter your password.' }).min(1, 'Enter your password.'),
});

export type LoginDto = z.infer<typeof loginSchema>;
