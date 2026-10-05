import { Controller, Get, HttpCode, HttpStatus, SerializeOptions } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from '../users/entities/user.entity.js';
import { FlightHoursRepository } from '../flight-hours/flight-hours.repository.js';
import { type MeResponseDto, meResponseSchema } from './dto/me-response.dto.js';

@Controller('pilot')
export class PilotController {
  constructor(private readonly flightHours: FlightHoursRepository) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ schema: meResponseSchema })
  async me(@CurrentUser() user: User): Promise<MeResponseDto> {
    return {
      name: user.name,
      imageUrl: user.image_url,
      totalFlightHours: await this.flightHours.totalHoursFor(user.id),
    };
  }
}
