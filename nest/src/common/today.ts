import type { ValueProvider } from '@nestjs/common';

export const TODAY = Symbol('TODAY');

export type Today = () => string;

export const todayProvider: ValueProvider<Today> = {
  provide: TODAY,
  useValue: () => process.env.TODAY || new Date().toISOString().slice(0, 10),
};
