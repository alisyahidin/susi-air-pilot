import { Controller, Get, Query, SerializeOptions } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from '../users/entities/user.entity.js';
import {
  type HoursToLimitQueryDto,
  type HoursToLimitResponseDto,
  hoursToLimitQuerySchema,
  hoursToLimitResponseSchema,
} from './dto/hours-to-limit.dto.js';
import { FlightHoursService, todayUtc } from './flight-hours.service.js';

@Controller('flight-hours')
export class FlightHoursController {
  constructor(private readonly flightHours: FlightHoursService) {}

  @Get('limits')
  @SerializeOptions({ schema: hoursToLimitResponseSchema })
  hoursToLimit(
    @CurrentUser() user: User,
    @Query({ schema: hoursToLimitQuerySchema }) query: HoursToLimitQueryDto,
  ): Promise<HoursToLimitResponseDto> {
    return this.flightHours.hoursToLimit(user.id, query.date ?? todayUtc());
  }
}
