import { Body, Controller, Get, Param, Post, Query, SerializeOptions } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { z } from 'zod';
import { validationProviders } from './validation.providers.js';

const echoSchema = z.object({ name: z.string().trim().min(1, 'Enter a name.') });
const pageSchema = z.object({ page: z.coerce.number().int().min(1) });
const publicUserSchema = z.object({ id: z.string(), name: z.string() });

@Controller()
class TestController {
  @Post('echo')
  echo(@Body({ schema: echoSchema }) body: z.infer<typeof echoSchema>) {
    return body;
  }

  @Get('page')
  page(@Query({ schema: pageSchema }) query: z.infer<typeof pageSchema>) {
    return query;
  }

  @Get('items/:id')
  item(@Param('id', { schema: z.uuid() }) id: string) {
    return { id };
  }

  // No schema: the global pipe must leave it alone
  @Get('raw')
  raw(@Query('q') q: string) {
    return { q };
  }

  @Get('user')
  @SerializeOptions({ schema: publicUserSchema })
  user() {
    return { id: 'u1', name: 'Udin', password: 'secret' };
  }

  @Get('users')
  @SerializeOptions({ schema: publicUserSchema })
  users() {
    return [{ id: 'u1', name: 'Udin', password: 'secret' }];
  }

  @Get('broken')
  @SerializeOptions({ schema: publicUserSchema })
  broken() {
    return { id: 1 };
  }
}

describe('validationProviders (built-in Standard Schema validation)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [...validationProviders],
    }).compile();
    moduleRef.useLogger(false);

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(() => app.close());

  it('validates and parses a @Body() with a schema', async () => {
    const ok = await app.inject({ method: 'POST', url: '/echo', payload: { name: '  Udin  ', extra: true } });
    expect(ok.statusCode).toBe(201);
    expect(ok.json()).toEqual({ name: 'Udin' }); // trimmed, unknown key dropped
  });

  it('answers 400 with errors keyed by field', async () => {
    const res = await app.inject({ method: 'POST', url: '/echo', payload: { name: ' ' } });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ message: 'Validation failed', errors: { name: ['Enter a name.'] } });
  });

  it('validates and coerces @Query() and @Param() with a schema', async () => {
    expect((await app.inject({ method: 'GET', url: '/page?page=2' })).json()).toEqual({ page: 2 });
    expect((await app.inject({ method: 'GET', url: '/page?page=0' })).statusCode).toBe(400);
    expect((await app.inject({ method: 'GET', url: '/items/not-a-uuid' })).statusCode).toBe(400);
  });

  it('leaves parameters without a schema untouched', async () => {
    const res = await app.inject({ method: 'GET', url: '/raw?q=anything' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ q: 'anything' });
  });

  it('strips keys the response schema does not declare, for objects and arrays', async () => {
    expect((await app.inject({ method: 'GET', url: '/user' })).json()).toEqual({ id: 'u1', name: 'Udin' });
    expect((await app.inject({ method: 'GET', url: '/users' })).json()).toEqual([{ id: 'u1', name: 'Udin' }]);
  });

  it('answers 500 without details when a response breaks its schema', async () => {
    const res = await app.inject({ method: 'GET', url: '/broken' });
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.json())).not.toContain('expected');
  });
});
