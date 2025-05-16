import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

@InputType()
export class CreateNoteInput {
  @Field(() => [String])
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  thoughts: string[];

  @Field(() => [String])
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  triggers: string[];

  @Field(() => [String])
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  places: string[];

  @Field(() => [String])
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  feelings: string[];
}
