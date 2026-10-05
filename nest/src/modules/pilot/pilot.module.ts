import { Module } from '@nestjs/common';
import { FlightHoursModule } from '../flight-hours/flight-hours.module.js';
import { PilotController } from './me.controller.js';

@Module({
  imports: [FlightHoursModule],
  controllers: [PilotController],
})
export class PilotModule {}
