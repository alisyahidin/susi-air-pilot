import { Injectable } from '@nestjs/common';
import { MockDb } from '../../db/mock/index.js';

@Injectable()
export class FlightHoursRepository {
  constructor(private readonly db: MockDb) {}

  /**
   * Total hours flown by a pilot. The mock data holds a single pilot's log with no user id,
   * so every user gets that pilot's total until the data is per pilot.
   */
  async totalHoursFor(_userId: string): Promise<number> {
    return this.db.flightHours.pilot.totalFlightHours;
  }
}
