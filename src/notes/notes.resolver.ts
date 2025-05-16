import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { NotesService } from './notes.service';
import { Note } from './schemas/note.schema';
import { CreateNoteInput } from './dto/create-note.input';
import { UpdateNoteInput } from './dto/update-note.input';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserContext } from '../auth/types/auth.types';
import { CreateNoteWithUser, DEFAULT_PAGINATION } from './types/notes.types';
import { PaginationInput } from './dto/pagination.input';
import { PaginatedNotesResult } from './dto/paginated-notes.result';

@Resolver(() => Note)
export class NotesResolver {
  constructor(private readonly notesService: NotesService) {}

  /**
   * Retrieves all notes for the authenticated user with pagination
   * @param user - The authenticated user
   * @param pagination - The pagination parameters
   * @returns A paginated notes result
   */
  @UseGuards(JwtAuthGuard)
  @Query(() => PaginatedNotesResult)
  async notes(
    @CurrentUser() user: UserContext,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<PaginatedNotesResult> {
    // Ensure user is authenticated
    this.ensureAuthenticated(user);
    // Retrieve and return paginated notes for the user
    // Use the pagination input directly as it already has defaults and validation
    // Normalize pagination values, ensuring they are positive numbers
    const normalizedPage = Math.max(
      1,
      pagination?.page ?? DEFAULT_PAGINATION.page,
    );
    const normalizedLimit = Math.max(
      1,
      pagination?.limit ?? DEFAULT_PAGINATION.limit,
    );

    return this.notesService.findAll(user.userId, {
      page: normalizedPage,
      limit: normalizedLimit,
    });
  }

  /**
   * Retrieves a specific note by ID for the authenticated user
   * @param user - The authenticated user
   * @param id - The note ID
   * @returns The requested note
   */
  @UseGuards(JwtAuthGuard)
  @Query(() => Note)
  async note(
    @CurrentUser() user: UserContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Note> {
    // Ensure user is authenticated
    this.ensureAuthenticated(user);
    // Retrieve and return the requested note
    return this.notesService.findOne(id, user.userId);
  }

  /**
   * Creates a new note for the authenticated user
   * @param user - The authenticated user
   * @param createNoteInput - The note data
   * @returns The created note
   */
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Note)
  async createNote(
    @CurrentUser() user: UserContext,
    @Args('createNoteInput') createNoteInput: CreateNoteInput,
  ): Promise<Note> {
    // Ensure user is authenticated
    this.ensureAuthenticated(user);
    // Prepare note data with user ID
    const noteWithUser = this.prepareNoteWithUser(createNoteInput, user.userId);
    // Create and return the new note
    return this.notesService.create(noteWithUser);
  }

  /**
   * Updates an existing note for the authenticated user
   * @param user - The authenticated user
   * @param id - The note ID
   * @param updateNoteInput - The update data
   * @returns The updated note
   */
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Note)
  async updateNote(
    @CurrentUser() user: UserContext,
    @Args('id', { type: () => ID }) id: string,
    @Args('updateNoteInput') updateNoteInput: UpdateNoteInput,
  ): Promise<Note> {
    // Ensure user is authenticated
    this.ensureAuthenticated(user);
    // Update and return the note
    return this.notesService.update(id, user.userId, updateNoteInput);
  }

  /**
   * Removes a note for the authenticated user
   * @param user - The authenticated user
   * @param id - The note ID
   * @returns The removed note
   */
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Note)
  async removeNote(
    @CurrentUser() user: UserContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Note> {
    // Ensure user is authenticated
    this.ensureAuthenticated(user);
    // Remove and return the note
    return this.notesService.remove(id, user.userId);
  }

  /**
   * Ensures the user is authenticated
   * @param user - The user to check
   */
  private ensureAuthenticated(user: UserContext): void {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
  }

  /**
   * Prepares note data with user ID
   * @param createNoteInput - The note input data
   * @param userId - The user ID
   * @returns The note data with user ID
   */
  private prepareNoteWithUser(
    createNoteInput: CreateNoteInput,
    userId: string,
  ): CreateNoteWithUser {
    return {
      ...createNoteInput,
      user_id: userId,
    };
  }
}
