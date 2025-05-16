import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Note } from '../schemas/note.schema';

@ObjectType()
export class PaginatedNotesResult {
  @Field(() => [Note])
  items: Note[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Boolean)
  hasNext: boolean;

  @Field(() => Boolean)
  hasPrevious: boolean;
}
