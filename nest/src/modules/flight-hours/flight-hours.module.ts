import { Module } from '@nestjs/common';
import { FlightHoursRepository } from './flight-hours.repository.js';

@Module({
  providers: [FlightHoursRepository],
  exports: [FlightHoursRepository],
})
export class FlightHoursModule {}
