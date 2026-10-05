import { Injectable } from '@nestjs/common';
import { MockDb, type MockDocument } from '../../db/mock/index.js';

@Injectable()
export class DocumentsRepository {
  constructor(private readonly db: MockDb) {}

  async findForUser(_userId: string): Promise<MockDocument[]> {
    return this.db.documents.documents;
  }

  async warningDays(): Promise<number> {
    return this.db.documents.thresholds.warningDays;
  }
}
