import { Controller, Get, Inject, Query, SerializeOptions } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from '../users/entities/user.entity.js';
import { TODAY, type Today } from '../../common/today.js';
import {
  type SchedulesQueryDto,
  type SchedulesResponseDto,
  schedulesQuerySchema,
  schedulesResponseSchema,
} from './dto/schedules.dto.js';
import { SchedulesService } from './schedules.service.js';

@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedules: SchedulesService,
    @Inject(TODAY) private readonly today: Today,
  ) {}

  @Get()
  @SerializeOptions({ schema: schedulesResponseSchema })
  monthFor(
    @CurrentUser() user: User,
    @Query({ schema: schedulesQuerySchema }) query: SchedulesQueryDto,
  ): Promise<SchedulesResponseDto> {
    const [todayYear, todayMonth] = this.today().split('-').map(Number) as [number, number];
    return this.schedules.monthFor(user.id, query.year ?? todayYear, query.month ?? todayMonth);
  }
}
