import { Module } from '@nestjs/common';
import { todayProvider } from '../../common/today.js';
import { DocumentsController } from './documents.controller.js';
import { DocumentsRepository } from './documents.repository.js';
import { DocumentsService } from './documents.service.js';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsRepository, DocumentsService, todayProvider],
})
export class DocumentsModule {}
