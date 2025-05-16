import { INestApplication } from '@nestjs/common';
import { createTestingApp, closeTestingApp, request } from './test-utils';
import { CreateUserInput } from '../src/users/dto/create-user.input';

describe('AuthResolver (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let testUsername: string;
  let testPassword: string;

  beforeAll(async () => {
    app = await createTestingApp();
    testUsername = `testuser_${Date.now()}`;
    testPassword = 'testpassword';
  }, 60000);

  afterAll(async () => {
    await closeTestingApp();
  });

  it('should register a new user', async () => {
    const createUserInput: CreateUserInput = {
      username: testUsername,
      password: testPassword,
    };

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(createUserInput);

    expect(response.status).toBe(201);
    expect(
      (response.body as { access_token: string }).access_token,
    ).toBeDefined();
  });

  it('should login an existing user', async () => {
    const createUserInput: CreateUserInput = {
      username: testUsername,
      password: testPassword,
    };

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(createUserInput);

    expect(response.status).toBe(200);
    expect(
      (response.body as { access_token: string }).access_token,
    ).toBeDefined();
    accessToken = (response.body as { access_token: string }).access_token;
  });

  it('should access a protected route with a valid JWT', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(
      (response.body as { userId: string; username: string }).username,
    ).toBe(testUsername);
  });

  it('should not access a protected route with an invalid JWT', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer invalidtoken`);

    expect(response.status).toBe(401);
  });
});
