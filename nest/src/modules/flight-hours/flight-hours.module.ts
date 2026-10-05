import { Module } from '@nestjs/common';
import { FlightHoursController } from './flight-hours.controller.js';
import { FlightHoursRepository } from './flight-hours.repository.js';
import { FlightHoursService } from './flight-hours.service.js';

@Module({
  controllers: [FlightHoursController],
  providers: [FlightHoursRepository, FlightHoursService],
  exports: [FlightHoursRepository],
})
export class FlightHoursModule {}
