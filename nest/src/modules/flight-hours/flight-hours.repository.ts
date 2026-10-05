import { Injectable } from '@nestjs/common';
import { MockDb } from '../../db/mock/index.js';

export interface FlightHourLimits {
  daily: number;
  weekly: number;
  monthly: number;
  annual: number;
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
}
