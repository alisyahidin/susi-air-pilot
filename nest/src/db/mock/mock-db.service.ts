import { Injectable } from '@nestjs/common';
import documentsSeed from './data/mock-documents.json' with { type: 'json' };
import flightHoursSeed from './data/mock-flight-hours.json' with { type: 'json' };
import schedulesSeed from './data/mock-schedules.json' with { type: 'json' };
import usersSeed from './data/mock-users.json' with { type: 'json' };

export type MockUser = (typeof usersSeed)[number];
export type MockDocuments = typeof documentsSeed;
export type MockDocument = MockDocuments['documents'][number];
export type MockFlightHours = typeof flightHoursSeed;
export type MockFlightHourEntry = MockFlightHours['flightHours'][number];
export type MockSchedules = typeof schedulesSeed;
export type MockSchedule = MockSchedules['schedules'][number];

interface MockTables {
  users: MockUser[];
  documents: MockDocuments;
  flightHours: MockFlightHours;
  schedules: MockSchedules;
}

/**
 * In-memory stand-in for the database, seeded from ./data/*.json.
 */
@Injectable()
export class MockDb implements MockTables {
  users: MockUser[];
  documents: MockDocuments;
  flightHours: MockFlightHours;
  schedules: MockSchedules;

  constructor() {
    this.reset();
  }

  reset(): void {
    const seed: MockTables = structuredClone({
      users: usersSeed,
      documents: documentsSeed,
      flightHours: flightHoursSeed,
      schedules: schedulesSeed,
    });
    Object.assign(this, seed);
  }
}
