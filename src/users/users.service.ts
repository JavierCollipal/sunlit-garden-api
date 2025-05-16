import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserInput } from './dto/create-user.input';
import { UserQueryFilters } from './types/users.types';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /**
   * Finds a user by username
   * @param username - The username to search for
   * @returns The user document or undefined
   */
  async findOne(username: string): Promise<UserDocument | undefined> {
    // Create query filter
    const filter = this.createUsernameFilter(username);
    // Find and return the user
    const user = await this.findUserByFilter(filter);
    return user || undefined;
  }

  /**
   * Creates a new user
   * @param createUserInput - The user data
   * @returns The created user document
   */
  async create(createUserInput: CreateUserInput): Promise<UserDocument> {
    try {
      // Validate the input
      this.validateUserInput(createUserInput);
      // Check for existing user
      await this.checkForExistingUser(createUserInput.username);
      // Create and save the user
      const user = await this.createAndSaveUser(createUserInput);
      // Log success and return the user
      this.logUserCreationSuccess(user);
      return user;
    } catch (error) {
      // Handle errors
      return this.handleUserCreationError(error, createUserInput);
    }
  }

  /**
   * Creates a filter for username queries
   * @param username - The username
   * @returns The query filter
   */
  private createUsernameFilter(username: string): UserQueryFilters {
    return { username };
  }

  /**
   * Finds a user by filter
   * @param filter - The query filter
   * @returns The user document or null
   */
  private async findUserByFilter(
    filter: UserQueryFilters,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne(filter).exec();
  }

  /**
   * Validates user input
   * @param createUserInput - The user input data
   */
  private validateUserInput(createUserInput: CreateUserInput): void {
    if (!createUserInput.username || !createUserInput.password) {
      console.error('User creation failed: Invalid input');
      throw new Error('Username and password are required');
    }
  }

  /**
   * Checks for an existing user with the same username
   * @param username - The username to check
   */
  private async checkForExistingUser(username: string): Promise<void> {
    const existingUser = await this.findOne(username);
    if (existingUser) {
      console.warn(
        `Attempted to create user with existing username: ${username}`,
      );
      throw new ConflictException('Username already exists');
    }
  }

  /**
   * Creates and saves a new user
   * @param createUserInput - The user input data
   * @returns The saved user document
   */
  private async createAndSaveUser(
    createUserInput: CreateUserInput,
  ): Promise<UserDocument> {
    // Create new user model instance
    const createdUser = new this.userModel(createUserInput);
    // Save the user
    const savedUser = await createdUser.save();
    // Validate the saved user
    if (!savedUser) {
      console.error('User creation failed: Save operation returned null');
      throw new Error('Failed to save user');
    }
    return savedUser;
  }

  /**
   * Logs user creation success
   * @param user - The created user
   */
  private logUserCreationSuccess(user: UserDocument): void {
    console.log(`User created successfully: ${user.username}`);
  }

  /**
   * Handles user creation errors
   * @param error - The error
   * @param createUserInput - The user input data
   * @returns Never returns, always throws
   */
  private handleUserCreationError(
    error: unknown,
    createUserInput: CreateUserInput,
  ): never {
    console.error('Error in user creation:', error);

    // Handle duplicate key error
    if (this.isDuplicateKeyError(error)) {
      console.warn(`Duplicate username attempt: ${createUserInput.username}`);
      throw new ConflictException('Username already exists');
    }

    // Rethrow other errors
    throw error;
  }

  /**
   * Checks if an error is a duplicate key error
   * @param error - The error to check
   * @returns Whether the error is a duplicate key error
   */
  private isDuplicateKeyError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const errorObj = error as { code?: unknown };
    return 'code' in errorObj && errorObj.code === 11000;
  }
}
