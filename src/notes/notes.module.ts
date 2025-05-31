import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../common/common.module';
import { NotesService } from './notes.service';
import { NotesResolver } from './notes.resolver';
import { Note, NoteSchema } from './schemas/note.schema';

@Module({
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Note.name,
        schema: NoteSchema,
        collection: 'notes',
      },
    ]),
  ],
  providers: [NotesResolver, NotesService],
})
export class NotesModule {}
