import { Module } from '@nestjs/common';
import { todayProvider } from '../../common/today.js';
import { FlightHoursController } from './flight-hours.controller.js';
import { FlightHoursRepository } from './flight-hours.repository.js';
import { FlightHoursService } from './flight-hours.service.js';

@Module({
  controllers: [FlightHoursController],
  providers: [FlightHoursRepository, FlightHoursService, todayProvider],
  exports: [FlightHoursRepository],
})
export class FlightHoursModule {}
