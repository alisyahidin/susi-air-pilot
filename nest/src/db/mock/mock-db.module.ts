import { Global, Module } from '@nestjs/common';
import { MockDb } from './mock-db.service.js';

/**
 * Global: import it once in AppModule and any provider in any module can inject MockDb
 * without listing this module in its own imports.
 */
@Global()
@Module({
  providers: [MockDb],
  exports: [MockDb],
})
export class MockDbModule {}
