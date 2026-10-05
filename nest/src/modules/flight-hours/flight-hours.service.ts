import { Injectable } from '@nestjs/common';
import type { HoursToLimitResponseDto, LimitStatus } from './dto/hours-to-limit.dto.js';
import { FlightHoursRepository } from './flight-hours.repository.js';

const PERIODS = [
  { period: 'daily', windowDays: 1 },
  { period: 'weekly', windowDays: 7 },
  { period: 'monthly', windowDays: 30 },
  { period: 'annual', windowDays: 365 },
] as const;

const APPROACHING_RATIO = 0.8;

const DAY_MS = 86_400_000;

@Injectable()
export class FlightHoursService {
  constructor(private readonly flightHours: FlightHoursRepository) {}

  async hoursToLimit(userId: string, date: string): Promise<HoursToLimitResponseDto> {
    const limits = await this.flightHours.limits();

    const results = await Promise.all(
      PERIODS.map(async ({ period, windowDays }) => {
        const from = shiftDays(date, -(windowDays - 1));
        const hours = round1(await this.flightHours.hoursBetween(userId, from, date));
        const limit = limits[period];
        return { period, windowDays, hours, limit, remaining: round1(limit - hours), status: statusOf(hours, limit) };
      }),
    );

    return { date, limits: results };
  }
}

export function statusOf(hours: number, limit: number): LimitStatus {
  if (hours > limit) return 'over';
  if (hours === limit) return 'at_limit';
  if (hours >= limit * APPROACHING_RATIO) return 'approaching';
  return 'within';
}

function shiftDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
