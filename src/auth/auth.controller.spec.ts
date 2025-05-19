import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';

// Mock AuthService
const mockAuthService = {
  signIn: jest.fn().mockResolvedValue({ access_token: 'test-token' }),
  register: jest.fn().mockResolvedValue({ access_token: 'test-token' }),
};

describe('AuthController', () => {
  let controller: AuthController;
  let resolver: AuthResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    resolver = module.get<AuthResolver>(AuthResolver);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(resolver).toBeDefined();
  });

  it('should have auth service methods', () => {
    expect(mockAuthService.signIn).toBeDefined();
    expect(mockAuthService.register).toBeDefined();
  });
});
