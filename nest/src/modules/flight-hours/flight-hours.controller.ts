import { Controller, Get, Inject, Query, SerializeOptions } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from '../users/entities/user.entity.js';
import {
  type FlightHoursQueryDto,
  type FlightHoursResponseDto,
  flightHoursQuerySchema,
  flightHoursResponseSchema,
} from './dto/flight-hours.dto.js';
import {
  type HoursToLimitQueryDto,
  type HoursToLimitResponseDto,
  hoursToLimitQuerySchema,
  hoursToLimitResponseSchema,
} from './dto/hours-to-limit.dto.js';
import {
  type FlightHoursSummaryQueryDto,
  type FlightHoursSummaryResponseDto,
  flightHoursSummaryQuerySchema,
  flightHoursSummaryResponseSchema,
} from './dto/summary.dto.js';
import { TODAY, type Today } from '../../common/today.js';
import { FlightHoursService } from './flight-hours.service.js';

@Controller('flight-hours')
export class FlightHoursController {
  constructor(
    private readonly flightHours: FlightHoursService,
    @Inject(TODAY) private readonly today: Today,
  ) {}

  /** The signed-in pilot's hours for each day between `from` and `to` (both optional and inclusive). */
  @Get()
  @SerializeOptions({ schema: flightHoursResponseSchema })
  getAll(
    @CurrentUser() user: User,
    @Query({ schema: flightHoursQuerySchema }) query: FlightHoursQueryDto,
  ): Promise<FlightHoursResponseDto> {
    return this.flightHours.getAll(user.id, query.from, query.to);
  }

  @Get('limits')
  @SerializeOptions({ schema: hoursToLimitResponseSchema })
  hoursToLimit(
    @CurrentUser() user: User,
    @Query({ schema: hoursToLimitQuerySchema }) query: HoursToLimitQueryDto,
  ): Promise<HoursToLimitResponseDto> {
    return this.flightHours.hoursToLimit(user.id, query.date ?? this.today());
  }

  @Get('summary')
  @SerializeOptions({ schema: flightHoursSummaryResponseSchema })
  summary(
    @CurrentUser() user: User,
    @Query({ schema: flightHoursSummaryQuerySchema }) query: FlightHoursSummaryQueryDto,
  ): Promise<FlightHoursSummaryResponseDto> {
    return this.flightHours.summary(user.id, query.range, query.date ?? this.today());
  }
}
