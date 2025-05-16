import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NoteDocument = Note & Document;

@ObjectType()
@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  collection: 'notes',
})
export class Note {
  @Field(() => ID)
  _id: MongooseSchema.Types.ObjectId;

  @Field(() => String)
  @Prop({
    required: true,
    index: true,
  })
  user_id: string;

  @Field(() => [String])
  @Prop({
    type: [String],
    required: true,
    validate: [
      (arr: string[]) =>
        arr.every((str) => str.length <= 1000) && arr.length <= 50,
      'Thoughts validation failed: max 50 thoughts, 1000 chars each',
    ],
  })
  thoughts: string[];

  @Field(() => [String])
  @Prop({
    type: [String],
    required: true,
    validate: [
      (arr: string[]) =>
        arr.every((str) => str.length <= 100) && arr.length <= 20,
      'Triggers validation failed: max 20 triggers, 100 chars each',
    ],
  })
  triggers: string[];

  @Field(() => [String])
  @Prop({
    type: [String],
    required: true,
    validate: [
      (arr: string[]) =>
        arr.every((str) => str.length <= 100) && arr.length <= 20,
      'Places validation failed: max 20 places, 100 chars each',
    ],
  })
  places: string[];

  @Field(() => [String])
  @Prop({
    type: [String],
    required: true,
    validate: [
      (arr: string[]) =>
        arr.every((str) => str.length <= 100) && arr.length <= 20,
      'Places validation failed: max 20 places, 100 chars each',
    ],
  })
  feelings: string[];

  @Field(() => Date)
  @Prop()
  created_at?: Date;

  @Field(() => Date)
  @Prop()
  updated_at?: Date;

  @Field(() => Boolean, { defaultValue: false })
  @Prop({ default: false })
  is_deleted?: boolean;

  @Field(() => Number)
  @Prop({ default: 1 })
  version: number;
}

export const NoteSchema = SchemaFactory.createForClass(Note);

// Compound indexes for production performance
NoteSchema.index({ user_id: 1, is_deleted: 1 });
NoteSchema.index({ user_id: 1, created_at: -1 });
