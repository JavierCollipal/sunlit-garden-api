import { CreateNoteInput } from './create-note.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IsMongoId } from 'class-validator';

@InputType()
export class UpdateNoteInput extends PartialType(CreateNoteInput) {
  @Field(() => ID)
  @IsMongoId()
  _id: string;
}
