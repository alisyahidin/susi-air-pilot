import { Module } from '@nestjs/common';
import { todayProvider } from '../../common/today.js';
import { SchedulesController } from './schedules.controller.js';
import { SchedulesRepository } from './schedules.repository.js';
import { SchedulesService } from './schedules.service.js';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesRepository, SchedulesService, todayProvider],
})
export class SchedulesModule {}
