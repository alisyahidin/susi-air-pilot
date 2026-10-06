import { Injectable } from '@nestjs/common';
import type { HoursToLimitResponseDto, LimitStatus } from './dto/hours-to-limit.dto.js';
import type { FlightHoursSummaryResponseDto, SummaryRange } from './dto/summary.dto.js';
import { FlightHoursRepository } from './flight-hours.repository.js';
import type { FlightHoursResponseDto } from './dto/flight-hours.dto.js';

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

  async getAll(userId: string, from?: string, to?: string): Promise<FlightHoursResponseDto> {
    return this.flightHours.entriesBetween(userId, from, to);
  }

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

  async summary(userId: string, range: SummaryRange, date: string): Promise<FlightHoursSummaryResponseDto> {
    const { limit, max, windowDays, displayRangeDays } = await this.flightHours.chartBounds(range);

    const offsets = Array.from({ length: displayRangeDays * 2 + 1 }, (_, i) => i - displayRangeDays);
    const points = await Promise.all(
      offsets.map(async (offset) => {
        const day = shiftDays(date, offset);
        const hours = round1(await this.flightHours.hoursBetween(userId, shiftDays(day, -(windowDays - 1)), day));
        return { date: day, hours, status: statusOf(hours, limit), projected: offset > 0 };
      }),
    );

    const todayHours = points[displayRangeDays]!.hours;
    return {
      date,
      range,
      windowDays,
      limit,
      max,
      today: { hours: todayHours, remaining: round1(limit - todayHours), status: statusOf(todayHours, limit) },
      points,
    };
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
