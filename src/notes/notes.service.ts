import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note, NoteDocument } from './schemas/note.schema';
import { UpdateNoteInput } from './dto/update-note.input';
import { Types } from 'mongoose';
import {
  CreateNoteWithUser,
  NoteQueryFilters,
  PaginationParams,
  DEFAULT_PAGINATION,
  PaginatedNotesResult,
} from './types/notes.types';

@Injectable()
export class NotesService {
  constructor(@InjectModel(Note.name) private noteModel: Model<NoteDocument>) {}

  /**
   * Creates a new note
   * @param createNoteInput - The note data with user ID
   * @returns The created note
   */
  async create(createNoteInput: CreateNoteWithUser): Promise<Note> {
    // Create a new note model instance
    const noteData = this.prepareNoteData(createNoteInput);
    const createdNote = new this.noteModel(noteData);
    // Save and return the new note
    return this.saveNote(createdNote);
  }

  /**
   * Finds all notes for a user with pagination
   * @param userId - The user ID
   * @param pagination - The pagination parameters
   * @returns A paginated notes result
   */
  async findAll(
    userId: string,
    pagination: PaginationParams = DEFAULT_PAGINATION,
  ): Promise<PaginatedNotesResult> {
    // Create query filters
    const filters = this.createUserFilter(userId);
    // Calculate pagination values
    const { page, limit } = this.normalizePaginationParams(pagination);
    const skip = (page - 1) * limit;
    // Execute queries
    const [items, total] = await Promise.all([
      this.findNotesByFilterWithPagination(filters, skip, limit),
      this.countNotesByFilter(filters),
    ]);
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrevious,
    };
  }

  /**
   * Finds a single note by ID for a user
   * @param id - The note ID
   * @param userId - The user ID
   * @returns The found note
   */
  async findOne(id: string, userId: string): Promise<Note> {
    // Validate the note ID
    this.validateNoteId(id);
    // Create query filters
    const filters = this.createNoteFilter(id, userId);
    // Find the note
    const note = await this.findNoteByFilter(filters);
    // Validate the note exists
    this.validateNoteExists(note, id);
    // Return the found note as non-null (validated above)
    return note!;
  }

  /**
   * Updates a note
   * @param id - The note ID
   * @param userId - The user ID
   * @param updateNoteInput - The update data
   * @returns The updated note
   */
  async update(
    id: string,
    userId: string,
    updateNoteInput: UpdateNoteInput,
  ): Promise<Note> {
    // Validate the note ID
    this.validateNoteId(id);
    // Create query filters
    const filters = this.createNoteFilter(id, userId);
    // Update the note
    const updatedNote = await this.updateNoteByFilter(filters, updateNoteInput);
    // Validate the note exists
    this.validateNoteExists(updatedNote, id);
    // Return the updated note as non-null (validated above)
    return updatedNote!;
  }

  /**
   * Removes a note
   * @param id - The note ID
   * @param userId - The user ID
   * @returns The removed note
   */
  async remove(id: string, userId: string): Promise<Note> {
    // Validate the note ID
    this.validateNoteId(id);
    // Create query filters
    const filters = this.createNoteFilter(id, userId);
    // Delete the note
    const deletedNote = await this.deleteNoteByFilter(filters);
    // Validate the note exists
    this.validateNoteExists(deletedNote, id);
    // Return the deleted note as non-null (validated above)
    return deletedNote!;
  }

  /**
   * Prepares note data for creation
   * @param createNoteInput - The note input data
   * @returns The prepared note data
   */
  private prepareNoteData(
    createNoteInput: CreateNoteWithUser,
  ): CreateNoteWithUser {
    return {
      ...createNoteInput,
      user_id: createNoteInput.user_id,
    };
  }

  /**
   * Saves a note to the database
   * @param note - The note to save
   * @returns The saved note
   */
  private async saveNote(note: NoteDocument): Promise<Note> {
    return note.save();
  }

  /**
   * Creates a filter for user-specific queries
   * @param userId - The user ID
   * @returns The query filter
   */
  private createUserFilter(userId: string): NoteQueryFilters {
    return { user_id: userId };
  }

  /**
   * Creates a filter for note-specific queries
   * @param id - The note ID
   * @param userId - The user ID
   * @returns The query filter
   */
  private createNoteFilter(id: string, userId: string): NoteQueryFilters {
    return { _id: id, user_id: userId };
  }

  /**
   * Finds notes by filter
   * @param filter - The query filter
   * @returns An array of notes
   */
  private async findNotesByFilter(filter: NoteQueryFilters): Promise<Note[]> {
    return this.noteModel.find(filter).exec();
  }

  /**
   * Finds notes by filter with pagination
   * @param filter - The query filter
   * @param skip - The number of documents to skip
   * @param limit - The maximum number of documents to return
   * @returns An array of notes
   */
  private async findNotesByFilterWithPagination(
    filter: NoteQueryFilters,
    skip: number,
    limit: number,
  ): Promise<Note[]> {
    return this.noteModel
      .find(filter)
      .sort({ created_at: -1 }) // Sort by creation date, newest first
      .skip(skip)
      .limit(limit)
      .exec();
  }

  /**
   * Counts notes by filter
   * @param filter - The query filter
   * @returns The count of notes
   */
  private async countNotesByFilter(filter: NoteQueryFilters): Promise<number> {
    return this.noteModel.countDocuments(filter).exec();
  }
  /**
   * Normalizes pagination parameters
   * @param pagination - The pagination parameters
   * @returns Normalized pagination parameters
   */
  private normalizePaginationParams(
    pagination: PaginationParams,
  ): PaginationParams {
    const page = Math.max(1, pagination.page || DEFAULT_PAGINATION.page);
    const limit = Math.max(1, pagination.limit || DEFAULT_PAGINATION.limit);
    return { page, limit };
  }

  /**
   * Finds a single note by filter
   * @param filter - The query filter
   * @returns The found note or null
   */
  private async findNoteByFilter(
    filter: NoteQueryFilters,
  ): Promise<Note | null> {
    return this.noteModel.findOne(filter).exec();
  }

  /**
   * Updates a note by filter
   * @param filter - The query filter
   * @param updateData - The update data
   * @returns The updated note or null
   */
  private async updateNoteByFilter(
    filter: NoteQueryFilters,
    updateData: UpdateNoteInput,
  ): Promise<Note | null> {
    return this.noteModel
      .findOneAndUpdate(filter, updateData, { new: true })
      .exec();
  }

  /**
   * Deletes a note by filter
   * @param filter - The query filter
   * @returns The deleted note or null
   */
  private async deleteNoteByFilter(
    filter: NoteQueryFilters,
  ): Promise<Note | null> {
    return this.noteModel.findOneAndDelete(filter).exec();
  }

  /**
   * Validates a note ID
   * @param id - The note ID to validate
   */
  private validateNoteId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid note ID: ${id}`);
    }
  }

  /**
   * Validates a note exists
   * @param note - The note to validate
   * @param id - The note ID
   */
  private validateNoteExists(note: Note | null, id: string): void {
    if (!note) {
      throw new NotFoundException(`Note #${id} not found or unauthorized`);
    }
  }
}
