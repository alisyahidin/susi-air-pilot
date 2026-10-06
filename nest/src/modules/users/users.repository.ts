import { Injectable } from '@nestjs/common';
import { MockDb, type MockUser } from '../../db/mock/index.js';
import type { User } from './entities/user.entity.js';

export interface UserRecord extends User {
  password: string;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly db: MockDb) {}

  async findByUsername(username: string): Promise<UserRecord | null> {
    const user = this.db.users.find(user => user.username === username);
    return user ? toRecord(user) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = this.db.users.find(user => user.id === id);
    return user ? toRecord(user) : null;
  }
}

function toRecord({ id, name, username, password, image_url }: MockUser): UserRecord {
  return { id, name, username, password, imageUrl: image_url };
}
