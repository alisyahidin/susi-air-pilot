import { Controller, Get, SerializeOptions } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from '../users/entities/user.entity.js';
import { type DocumentsResponseDto, documentsResponseSchema } from './dto/documents.dto.js';
import { DocumentsService } from './documents.service.js';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @SerializeOptions({ schema: documentsResponseSchema })
  documentsFor(@CurrentUser() user: User): Promise<DocumentsResponseDto> {
    return this.documents.documentsFor(user.id);
  }
}
