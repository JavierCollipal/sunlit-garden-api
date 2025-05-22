import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserInput } from './dto/create-user.input';
import { UserQueryFilters } from './types/users.types';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOne(username: string): Promise<UserDocument | undefined> {
    const filter = this.createUsernameFilter(username);
    const user = await this.findUserByFilter(filter);
    return user || undefined;
  }

  async create(createUserInput: CreateUserInput): Promise<UserDocument> {
    try {
      this.validateUserInput(createUserInput);
      await this.checkForExistingUser(createUserInput.username);
      const user = await this.createAndSaveUser(createUserInput);
      this.logUserCreationSuccess(user);
      return user;
    } catch (error) {
      return this.handleUserCreationError(error, createUserInput);
    }
  }

  private createUsernameFilter(username: string): UserQueryFilters {
    return { username };
  }

  private async findUserByFilter(
    filter: UserQueryFilters,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne(filter).exec();
  }

  private validateUserInput(createUserInput: CreateUserInput): void {
    if (!createUserInput.username || !createUserInput.password) {
      console.error('User creation failed: Invalid input');
      throw new BadRequestException({
        message: 'Username and password are required',
        error: 'Bad Request',
        statusCode: 400,
      });
    }

    if (createUserInput.password.length < 6) {
      console.error('User creation failed: Password too short');
      throw new BadRequestException({
        message: 'Password is too short',
        error: 'Bad Request',
        statusCode: 400,
      });
    }
  }

  private async checkForExistingUser(username: string): Promise<void> {
    const existingUser = await this.findOne(username);
    if (existingUser) {
      console.warn(
        `Attempted to create user with existing username: ${username}`,
      );
      throw new ConflictException({
        message: 'Username already exists',
        error: 'Conflict',
        statusCode: 409,
      });
    }
  }

  private async createAndSaveUser(
    createUserInput: CreateUserInput,
  ): Promise<UserDocument> {
    const createdUser = new this.userModel(createUserInput);
    const savedUser = await createdUser.save();
    if (!savedUser) {
      console.error('User creation failed: Save operation returned null');
      throw new BadRequestException({
        message: 'Failed to save user',
        error: 'Bad Request',
        statusCode: 400,
      });
    }
    return savedUser;
  }

  private logUserCreationSuccess(user: UserDocument): void {
    console.log(`User created successfully: ${user.username}`);
  }

  private handleUserCreationError(
    error: unknown,
    createUserInput: CreateUserInput,
  ): never {
    console.error('Error in user creation:', error);

    if (this.isDuplicateKeyError(error)) {
      console.warn(`Duplicate username attempt: ${createUserInput.username}`);
      throw new ConflictException({
        message: 'Username already exists',
        error: 'Conflict',
        statusCode: 409,
      });
    }

    throw error;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const errorObj = error as { code?: unknown };
    return 'code' in errorObj && errorObj.code === 11000;
  }
}
