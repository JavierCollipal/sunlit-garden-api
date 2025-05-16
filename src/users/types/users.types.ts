import { User } from '../schemas/user.schema';

/**
 * User creation result
 */
export interface UserCreationResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * User validation result
 */
export interface UserValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * User query filters
 */
export interface UserQueryFilters {
  username?: string;
  _id?: string;
}
