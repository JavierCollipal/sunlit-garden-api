import { CreateNoteInput } from '../dto/create-note.input';
import { Note } from '../schemas/note.schema';

/**
 * Extended create note input with user ID
 */
export interface CreateNoteWithUser extends CreateNoteInput {
  user_id: string;
}

/**
 * Note validation result
 */
export interface NoteValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Note query filters
 */
export interface NoteQueryFilters {
  _id?: string;
  user_id: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION: PaginationParams = {
  page: 1,
  limit: 10,
};

/**
 * Paginated notes result
 */
export interface PaginatedNotesResult {
  items: Note[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
