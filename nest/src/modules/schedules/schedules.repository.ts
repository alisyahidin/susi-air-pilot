import { Injectable } from '@nestjs/common';
import { MockDb, type MockSchedule } from '../../db/mock/index.js';

export interface DutyLegend {
  code: string;
  label: string;
  color: string;
}

/**
 * The mock data holds a single pilot's schedule with no user id, so every user gets it
 * until the data is per pilot. Only this class knows that.
 */
@Injectable()
export class SchedulesRepository {
  constructor(private readonly db: MockDb) {}

  async findForUserInMonth(_userId: string, yearMonth: string): Promise<MockSchedule[]> {
    return this.db.schedules.schedules
      .filter(schedule => schedule.duty_date.startsWith(`${yearMonth}-`))
      .sort((a, b) => a.duty_date.localeCompare(b.duty_date));
  }

  async monthsWithDutiesFor(_userId: string): Promise<{ from: string; to: string } | null> {
    const months = this.db.schedules.schedules.map(schedule => schedule.duty_date.slice(0, 7)).sort();
    return months.length ? { from: months[0]!, to: months.at(-1)! } : null;
  }

  async legend(): Promise<DutyLegend[]> {
    return this.db.schedules.legend;
  }
}
