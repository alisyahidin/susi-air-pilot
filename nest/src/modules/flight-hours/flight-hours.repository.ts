import { Injectable } from '@nestjs/common';
import { MockDb } from '../../db/mock/index.js';

export interface FlightHourLimits {
  daily: number;
  weekly: number;
  monthly: number;
  annual: number;
}

export interface ChartBounds {
  /** The limit the rolling total is measured against */
  limit: number;
  /** Suggested top of the chart's axis */
  max: number;
  /** Days in each rolling total */
  windowDays: number;
  /** Days shown on each side of the centre day */
  displayRangeDays: number;
}

@Injectable()
export class FlightHoursRepository {
  constructor(private readonly db: MockDb) {}

  async totalHoursFor(_userId: string): Promise<number> {
    return this.db.flightHours.pilot.totalFlightHours;
  }

  async hoursBetween(_userId: string, from: string, to: string): Promise<number> {
    return this.db.flightHours.flightHours
      .filter(entry => entry.date >= from && entry.date <= to)
      .reduce((sum, entry) => sum + entry.hours, 0);
  }

  async limits(): Promise<FlightHourLimits> {
    return this.db.flightHours.limits;
  }

  async chartBounds(range: '1w' | '1m' | '3m' | '6m' | '1y'): Promise<ChartBounds> {
    return this.db.flightHours.chartBounds[range];
  }
}
