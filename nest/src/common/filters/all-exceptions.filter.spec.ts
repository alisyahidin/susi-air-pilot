import { BadRequestException, Controller, Get, Logger, NotFoundException } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp } from '../../testing/create-test-app.js';

// Test-only routes that fail in each way the filter handles
@Public()
@Controller('test-errors')
class ErrorsController {
  @Get('not-found')
  notFound() {
    throw new NotFoundException('Document not found');
  }

  @Get('field-errors')
  fieldErrors() {
    throw new BadRequestException({ message: 'Validation failed', errors: { date: ['Use a date like 2026-05-15.'] } });
  }

  @Get('crash')
  crash() {
    throw new Error('db password is hunter2');
  }
}

describe('AllExceptionsFilter', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp([ErrorsController]);
  });

  afterAll(() => app.close());

  const get = (url: string) => app.inject({ method: 'GET', url });

  it('keeps the status and message of an HttpException', async () => {
    const res = await get('/api/v1/test-errors/not-found');

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Document not found',
      path: '/api/v1/test-errors/not-found',
      timestamp: expect.any(String),
    });
  });

  it('passes field errors through', async () => {
    const res = await get('/api/v1/test-errors/field-errors');

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      errors: { date: ['Use a date like 2026-05-15.'] },
    });
  });

  it('answers 500 with a generic message for anything else, and logs it', async () => {
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const res = await get('/api/v1/test-errors/crash');

    expect(res.statusCode).toBe(500);
    expect(res.json()).toMatchObject({ statusCode: 500, error: 'Internal Server Error', message: 'Internal server error' });
    expect(res.body).not.toContain('hunter2');
    expect(log).toHaveBeenCalledWith('GET /api/v1/test-errors/crash', expect.stringContaining('hunter2'));
    log.mockRestore();
  });

  it('uses the same body for unknown routes and auth failures', async () => {
    expect((await get('/api/v1/nope')).json()).toMatchObject({ statusCode: 404, error: 'Not Found', path: '/api/v1/nope' });
    expect((await get('/api/v1/pilot/me')).json()).toMatchObject({ statusCode: 401, error: 'Unauthorized' });
  });
});
