import { INestApplication } from '@nestjs/common';
import {
  createTestingApp,
  closeTestingApp,
  loginUserAndGetToken,
  request,
} from './test-utils';
import { CreateUserInput } from '../src/users/dto/create-user.input';

// Define GraphQL response types
interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface NotesData {
  notes: {
    items: Array<{
      _id: string;
      user_id: string;
      thoughts: string[];
      triggers: string[];
      places: string[];
      feelings: string[];
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

interface NoteData {
  note: {
    _id: string;
    user_id: string;
    thoughts: string[];
    triggers: string[];
    places: string[];
    feelings: string[];
  };
}

interface CreateNoteData {
  createNote: {
    _id: string;
    user_id: string;
    thoughts: string[];
    triggers: string[];
    places: string[];
    feelings: string[];
  };
}

describe('NotesResolver (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let noteId: string;

  beforeAll(async () => {
    app = await createTestingApp();

    // Create a test user and get token
    const createUserInput: CreateUserInput = {
      username: `testuser_notes_${Date.now()}`,
      password: 'testpassword',
    };
    accessToken = await loginUserAndGetToken(app, createUserInput);
  });

  afterAll(async () => {
    await closeTestingApp();
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting according to environment', async () => {
      const promises = Array.from({ length: 6 }, () =>
        request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            query: `
              {
                notes {
                  items {
                    _id
                  }
                  total
                }
              }
            `,
          }),
      );

      const results = await Promise.all(promises);

      if (process.env.NODE_ENV === 'production') {
        const lastResponse = results[results.length - 1];
        const responseBody = lastResponse.body as GraphQLResponse<null>;
        const isRateLimited =
          responseBody.errors?.[0]?.message.includes('Too many requests');
        expect(isRateLimited).toBe(true);
      } else {
        const allSuccessful = results.every((response) => {
          const responseBody = response.body as GraphQLResponse<NotesData>;
          return responseBody.data?.notes !== undefined;
        });
        expect(allSuccessful).toBe(true);
      }
    });
  });

  describe('Note Operations', () => {
    describe('Creating Notes', () => {
      it('should create a note when authenticated', async () => {
        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            query: `
              mutation {
                createNote(createNoteInput: {
                  thoughts: ["Test thought"],
                  triggers: ["Test trigger"],
                  places: ["Test place"],
                  feelings: ["Test feeling"]
                }) {
                  _id
                  user_id
                  thoughts
                  triggers
                  places
                  feelings
                }
              }
            `,
          });

        expect(response.status).toBe(200);
        const responseData = response.body as GraphQLResponse<CreateNoteData>;
        expect(responseData.data?.createNote).toBeDefined();
        noteId = responseData.data?.createNote._id || '';
        expect(noteId).toBeTruthy();
      });

      it('should fail to create a note without authentication', async () => {
        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              mutation {
                createNote(createNoteInput: {
                  thoughts: ["Test thought"],
                  triggers: ["Test trigger"],
                  places: ["Test place"],
                  feelings: ["Test feeling"]
                }) {
                  _id
                  user_id
                }
              }
            `,
          });

        const responseBody = response.body as GraphQLResponse<null>;
        expect(responseBody.errors).toBeDefined();
        // Accept either validation error or auth error as both are valid failure cases
        expect(responseBody.errors?.[0].message).toMatch(
          /(No JWT token provided|Unauthorized)/,
        );
      });
    });

    describe('Querying Notes', () => {
      it('should retrieve notes with pagination when authenticated', async () => {
        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            query: `
              {
                notes(pagination: { page: 1, limit: 10 }) {
                  items {
                    _id
                    thoughts
                    triggers
                    places
                    feelings
                  }
                  total
                  page
                  limit
                }
              }
            `,
          });

        expect(response.status).toBe(200);
        const responseData = response.body as GraphQLResponse<NotesData>;
        expect(responseData.data?.notes.items).toBeDefined();
        expect(Array.isArray(responseData.data?.notes.items)).toBe(true);
      });

      it('should fail to retrieve notes without authentication', async () => {
        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              {
                notes {
                  items {
                    _id
                  }
                }
              }
            `,
          });

        const responseBody = response.body as GraphQLResponse<null>;
        expect(responseBody.errors).toBeDefined();
        // Accept either "No JWT token provided" or "Unauthorized" for compatibility
        expect(responseBody.errors?.[0].message).toMatch(
          /(No JWT token provided|Unauthorized)/,
        );
      });

      it('should retrieve a single note by ID when authenticated', async () => {
        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            query: `
              query {
                note(id: "${noteId}") {
                  _id
                  thoughts
                  triggers
                  places
                  feelings
                }
              }
            `,
          });

        expect(response.status).toBe(200);
        const responseData = response.body as GraphQLResponse<NoteData>;
        expect(responseData.data?.note._id).toBe(noteId);
      });
    });

    describe('Updating and Deleting Notes', () => {
      it('should update a note when authenticated', async () => {
        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            query: `
              mutation {
                updateNote(
                  id: "${noteId}",
                  updateNoteInput: {
                    _id: "${noteId}",
                    thoughts: ["Updated thought"],
                    triggers: ["Updated trigger"],
                    places: ["Updated place"],
                    feelings: ["Updated feeling"]
                  }
                ) {
                  _id
                  thoughts
                  triggers
                  places
                  feelings
                }
              }
            `,
          });

        expect(response.status).toBe(200);
        const responseData = response.body as GraphQLResponse<{
          updateNote: { thoughts: string[] };
        }>;
        expect(responseData.data?.updateNote.thoughts).toContain(
          'Updated thought',
        );
      });

      it('should delete a note when authenticated', async () => {
        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            query: `
              mutation {
                removeNote(id: "${noteId}") {
                  _id
                }
              }
            `,
          });

        expect(response.status).toBe(200);
        const responseData = response.body as GraphQLResponse<{
          removeNote: { _id: string };
        }>;
        expect(responseData.data?.removeNote._id).toBe(noteId);
      });
    });
  });
});
