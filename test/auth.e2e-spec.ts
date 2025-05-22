import { INestApplication } from '@nestjs/common';
import { createTestingApp, closeTestingApp, request } from './test-utils';
import { CreateUserInput } from '../src/users/dto/create-user.input';

interface AuthResponse {
  message?: string;
  access_token?: string;
  error?: string;
  userId?: string;
  username?: string;
}

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
    expect((response.body as AuthResponse).access_token).toBeDefined();
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
    const body = response.body as AuthResponse;
    expect(body.access_token).toBeDefined();
    accessToken = body.access_token!;
  });

  it('should access a protected route with a valid JWT', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    const body = response.body as AuthResponse;
    expect(body.username).toBe(testUsername);
  });

  it('should not access a protected route with an invalid JWT', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer invalidtoken`);

    expect(response.status).toBe(401);
  });

  describe('Registration Validations', () => {
    it('should not register a user with empty username', async () => {
      const createUserInput: CreateUserInput = {
        username: '',
        password: testPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserInput);

      expect(response.status).toBe(400);
      const body = response.body as AuthResponse;
      expect(body.message).toContain('Username and password are required');
    });

    it('should not register a user with invalid password', async () => {
      const createUserInput: CreateUserInput = {
        username: 'testuser',
        password: '123', // Too short password
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserInput);

      expect(response.status).toBe(400);
      const body = response.body as AuthResponse;
      expect(body.message).toContain('Password is too short');
    });

    it('should not register a duplicate username', async () => {
      const createUserInput: CreateUserInput = {
        username: testUsername,
        password: testPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserInput);

      expect(response.status).toBe(409);
      const body = response.body as AuthResponse;
      expect(body.message).toBe('Username already exists');
    });
  });

  describe('Login Validations', () => {
    it('should not login with empty username', async () => {
      const loginInput = {
        username: '',
        password: testPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginInput);

      expect(response.status).toBe(400);
      const body = response.body as AuthResponse;
      expect(body.message).toContain('Username and password are required');
    });

    it('should not login with wrong password', async () => {
      const loginInput = {
        username: testUsername,
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginInput);

      expect(response.status).toBe(401);
      const body = response.body as AuthResponse;
      expect(body.message).toContain('Invalid credentials');
    });

    it('should not login non-existent user', async () => {
      const loginInput = {
        username: 'nonexistentuser',
        password: testPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginInput);

      expect(response.status).toBe(401);
      const body = response.body as AuthResponse;
      expect(body.message).toContain('Invalid credentials');
    });

    it('should not login with too short password', async () => {
      const loginInput = {
        username: testUsername,
        password: '123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginInput);

      expect(response.status).toBe(400);
      const body = response.body as AuthResponse;
      expect(body.message).toContain('Password is too short');
    });
  });

  describe('Protected Routes', () => {
    it('should not access a protected route without Authorization header', async () => {
      const response = await request(app.getHttpServer()).get('/auth/profile');

      expect(response.status).toBe(401);
      const body = response.body as AuthResponse;
      expect(body.message).toBe('Unauthorized');
    });

    it('should not access a protected route with malformed Bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'malformed-token');

      expect(response.status).toBe(401);
      const body = response.body as AuthResponse;
      expect(body.message).toBe('Unauthorized');
    });
  });
});
