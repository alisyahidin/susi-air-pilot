import { Inject, Injectable } from '@nestjs/common';
import { TODAY, type Today } from '../../common/today.js';
import type { DocumentStatus, DocumentsResponseDto } from './dto/documents.dto.js';
import { DocumentsRepository } from './documents.repository.js';

const DAY_MS = 86_400_000;

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documents: DocumentsRepository,
    @Inject(TODAY) private readonly today: Today,
  ) {}

  async documentsFor(userId: string): Promise<DocumentsResponseDto> {
    const date = this.today();
    const [documents, warningDays] = await Promise.all([this.documents.findForUser(userId), this.documents.warningDays()]);

    return {
      date,
      documents: documents
        .map(({ id, label, expiryDate }) => {
          const daysRemaining = daysBetween(date, expiryDate);
          return { id, label, expiryDate, daysRemaining, status: statusOf(daysRemaining, warningDays) };
        })
        .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)),
    };
  }
}

/** Expired on the expiry date itself; expiring within `warningDays` of it; valid before that. */
export function statusOf(daysRemaining: number, warningDays: number): DocumentStatus {
  if (daysRemaining <= 0) return 'expired';
  if (daysRemaining <= warningDays) return 'expiring';
  return 'valid';
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}
