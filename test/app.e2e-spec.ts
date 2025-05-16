import { INestApplication } from '@nestjs/common';
import { createTestingApp, closeTestingApp } from './test-utils';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
  }, 60000);

  afterAll(async () => {
    await closeTestingApp();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });
});
