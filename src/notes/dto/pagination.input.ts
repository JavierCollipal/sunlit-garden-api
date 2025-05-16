import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, Min } from 'class-validator';
import { DEFAULT_PAGINATION } from '../types/notes.types';

@InputType()
export class PaginationInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  page: number = DEFAULT_PAGINATION.page;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  limit: number = DEFAULT_PAGINATION.limit;
}
