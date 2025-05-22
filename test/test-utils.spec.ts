import {
  createTestingApp,
  closeTestingApp,
  loginUserAndGetToken,
} from './test-utils';
import { INestApplication } from '@nestjs/common';
import { CreateUserInput } from '../src/users/dto/create-user.input';
import mongoose from 'mongoose';
import * as passport from 'passport';

interface MockResponse {
  status: number;
  body: Record<string, any>;
}

const mockSend = jest.fn<Promise<MockResponse>, any[]>();
const mockPost = jest.fn(() => ({ send: mockSend }));
const mockRequest = jest.fn(() => ({ post: mockPost }));

jest.mock('supertest', () => ({
  __esModule: true,
  default: mockRequest,
  mockSend,
  mockPost,
  mockRequest,
}));

describe('Test Utils', () => {
  let app: INestApplication;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'testsecret';
  });

  afterEach(async () => {
    await closeTestingApp();
  });

  describe('createTestingApp', () => {
    it('should handle passport initialization error', async () => {
      jest.spyOn(passport, 'initialize').mockImplementationOnce(() => {
        throw new Error('Passport init error');
      });

      const app = await createTestingApp();
      expect(app).toBeDefined();
    });

    it('should throw an error if MONGODB_URI is not defined', async () => {
      delete process.env.MONGODB_URI;
      await expect(createTestingApp()).rejects.toThrow(
        'MONGODB_URI environment variable is not defined',
      );
    });

    it('should throw an error if JWT_SECRET is not defined', async () => {
      delete process.env.JWT_SECRET;
      await expect(createTestingApp()).rejects.toThrow(
        'JWT_SECRET environment variable is not defined',
      );
    });

    it('should initialize the app successfully', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'testsecret';
      app = await createTestingApp();
      expect(app).toBeDefined();
    });
  });

  describe('closeTestingApp', () => {
    it('should close the app and disconnect the database without errors', async () => {
      await expect(closeTestingApp()).resolves.not.toThrow();
    });

    it('should handle errors during app closure gracefully', async () => {
      try {
        await mongoose.disconnect();
      } catch {
        // Ignore disconnection errors
      }
      await expect(closeTestingApp()).resolves.not.toThrow();
    });
  });

  describe('loginUserAndGetToken', () => {
    beforeEach(async () => {
      app = await createTestingApp();
    });

    it('should register and login a user successfully', async () => {
      const userInput: CreateUserInput = {
        username: 'testuser',
        password: 'testpassword',
      };

      mockSend
        .mockResolvedValueOnce({
          status: 201,
          body: { message: 'User registered' },
        })
        .mockResolvedValueOnce({
          status: 200,
          body: { access_token: 'test_token' },
        });

      const token = await loginUserAndGetToken(app, userInput);
      expect(token).toBeDefined();
      expect(token).toBe('test_token');
    });

    it('should handle already registered user case', async () => {
      const userInput: CreateUserInput = {
        username: 'existinguser',
        password: 'testpassword',
      };

      mockSend
        .mockResolvedValueOnce({
          status: 409,
          body: { message: 'User already exists' },
        })
        .mockResolvedValueOnce({
          status: 200,
          body: { access_token: 'test_token' },
        });

      const token = await loginUserAndGetToken(app, userInput);
      expect(token).toBeDefined();
      expect(token).toBe('test_token');
    });

    it('should throw an error if registration fails with invalid input', async () => {
      const userInput: CreateUserInput = {
        username: '',
        password: '',
      };

      mockSend.mockResolvedValueOnce({
        status: 400,
        body: { message: 'Invalid input' },
      });

      await expect(loginUserAndGetToken(app, userInput)).rejects.toThrow();
    });

    it('should throw an error if registration fails with server error', async () => {
      const userInput: CreateUserInput = {
        username: 'testuser3',
        password: 'testpassword',
      };

      mockSend.mockResolvedValueOnce({
        status: 500,
        body: { message: 'Server error' },
      });

      await expect(loginUserAndGetToken(app, userInput)).rejects.toThrow(
        'Failed to register user testuser3',
      );
    });

    it('should throw an error if login response is missing token', async () => {
      const userInput: CreateUserInput = {
        username: 'testuser4',
        password: 'testpassword',
      };

      mockSend
        .mockResolvedValueOnce({
          status: 201,
          body: { message: 'User registered' },
        })
        .mockResolvedValueOnce({
          status: 200,
          body: { message: 'Logged in' }, // Missing access_token
        });

      await expect(loginUserAndGetToken(app, userInput)).rejects.toThrow(
        'Failed to login user testuser4',
      );
    });
  });
});
