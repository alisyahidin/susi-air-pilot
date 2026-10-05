import { Injectable } from '@nestjs/common';
import type { SchedulesResponseDto } from './dto/schedules.dto.js';
import { SchedulesRepository } from './schedules.repository.js';

const STATUS = { 1: 'upcoming', 2: 'completed' } as const;

@Injectable()
export class SchedulesService {
  constructor(private readonly schedules: SchedulesRepository) {}

  async monthFor(userId: string, year: number, month: number): Promise<SchedulesResponseDto> {
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    const [days, available, legend] = await Promise.all([
      this.schedules.findForUserInMonth(userId, yearMonth),
      this.schedules.monthsWithDutiesFor(userId),
      this.schedules.legend(),
    ]);

    return {
      year,
      month,
      available,
      legend,
      days: days.map(day => ({
        id: day.id,
        date: day.duty_date,
        status: STATUS[day.status as keyof typeof STATUS] ?? 'upcoming',
        dutyType: day.duty_type,
        baseName: day.base_name,
        baseColor: day.base_color,
        countSchedules: day.count_schedules,
        countLogbooks: day.count_logbooks,
      })),
    };
  }
}
