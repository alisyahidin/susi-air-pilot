import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MockDb } from './mock-db.service.js';
import { MockDbModule } from './mock-db.module.js';

@Injectable()
class ExampleRepository {
  constructor(readonly db: MockDb) {}
}

// Deliberately does not import MockDbModule: the global registration must be enough
@Module({ providers: [ExampleRepository], exports: [ExampleRepository] })
class ExampleModule {}

describe('MockDb', () => {
  it('is injectable from any module once MockDbModule is imported at the root', async () => {
    const app = await Test.createTestingModule({
      imports: [MockDbModule, ExampleModule],
    }).compile();

    const repository = app.get(ExampleRepository);
    expect(repository.db).toBe(app.get(MockDb));
    expect(repository.db.users.map(u => u.username)).toEqual(['johndoe', 'udin']);
  });

  it('loads every table from the seed data', () => {
    const db = new MockDb();

    expect(db.users).toHaveLength(2);
    expect(db.documents.documents.length).toBeGreaterThan(0);
    expect(db.flightHours.flightHours.length).toBeGreaterThan(0);
    expect(db.schedules.schedules.length).toBeGreaterThan(0);
  });

  it('keeps writes in memory, separate per instance, and undone by reset()', () => {
    const db = new MockDb();
    db.users[0]!.name = 'Changed';
    db.schedules.schedules.pop();

    expect(new MockDb().users[0]!.name).toBe('John Doe');

    const seedCount = new MockDb().schedules.schedules.length;
    db.reset();
    expect(db.users[0]!.name).toBe('John Doe');
    expect(db.schedules.schedules).toHaveLength(seedCount);
  });
});
