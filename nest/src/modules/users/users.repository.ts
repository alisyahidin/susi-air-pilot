import { Injectable } from '@nestjs/common';
import { MockDb, type MockUser } from '../../db/mock/index.js';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: MockDb) {}

  async findByUsername(username: string): Promise<MockUser | null> {
    return this.db.users.find(user => user.username === username) ?? null;
  }

  async findById(id: string): Promise<MockUser | null> {
    return this.db.users.find(user => user.id === id) ?? null;
  }
}
