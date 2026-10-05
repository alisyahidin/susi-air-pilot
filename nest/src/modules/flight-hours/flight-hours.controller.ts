import { Controller, Get, Inject, Query, SerializeOptions } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from '../users/entities/user.entity.js';
import {
  type HoursToLimitQueryDto,
  type HoursToLimitResponseDto,
  hoursToLimitQuerySchema,
  hoursToLimitResponseSchema,
} from './dto/hours-to-limit.dto.js';
import { TODAY, type Today } from '../../common/today.js';
import { FlightHoursService } from './flight-hours.service.js';

@Controller('flight-hours')
export class FlightHoursController {
  constructor(
    private readonly flightHours: FlightHoursService,
    @Inject(TODAY) private readonly today: Today,
  ) {}

  @Get('limits')
  @SerializeOptions({ schema: hoursToLimitResponseSchema })
  hoursToLimit(
    @CurrentUser() user: User,
    @Query({ schema: hoursToLimitQuerySchema }) query: HoursToLimitQueryDto,
  ): Promise<HoursToLimitResponseDto> {
    return this.flightHours.hoursToLimit(user.id, query.date ?? this.today());
  }
}
