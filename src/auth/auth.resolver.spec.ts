import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

const mockAuthService = {
  signIn: jest.fn().mockResolvedValue({ access_token: 'test-token' }),
  register: jest.fn().mockResolvedValue({ access_token: 'test-token' }),
};

describe('AuthResolver', () => {
  let resolver: AuthResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('login', () => {
    it('should return access token on successful login', async () => {
      const result = await resolver.login({
        username: 'testuser',
        password: 'password123',
      });
      expect(result.access_token).toBe('test-token');
      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        'testuser',
        'password123',
      );
    });

    it('should handle login failure', async () => {
      mockAuthService.signIn.mockRejectedValueOnce(
        new Error('Invalid credentials'),
      );
      await expect(
        resolver.login({ username: 'testuser', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should return access token on successful registration', async () => {
      const result = await resolver.register({
        username: 'newuser',
        password: 'password123',
      });
      expect(result.access_token).toBe('test-token');
      expect(mockAuthService.register).toHaveBeenCalledWith(
        'newuser',
        'password123',
      );
    });

    it('should handle registration failure', async () => {
      mockAuthService.register.mockRejectedValueOnce(
        new Error('User already exists'),
      );
      await expect(
        resolver.register({
          username: 'existinguser',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
