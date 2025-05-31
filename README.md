# Sunlit Garden Notes API

A NestJS-based GraphQL API for managing personal notes with authentication.
test pipeline

## API Overview

The Sunlit Garden Notes API provides a GraphQL interface for managing personal notes. It features:

- JWT-based authentication
- Note creation, retrieval, updating, and deletion
- Pagination support for note listing
- User-specific note management

## Authentication

The API uses JWT (JSON Web Token) authentication. To use the protected endpoints:

1. Register a new user or sign in to get an access token
2. Include the token in the Authorization header: `Bearer <your_token>`

### Authentication Endpoints

```graphql
# Register a new user
mutation {
  register(username: "user", password: "password") {
    access_token
  }
}

# Sign in
mutation {
  login(username: "user", password: "password") {
    access_token
  }
}
```

## Notes API

### Queries

```graphql
# Get all notes (paginated)
query {
  notes(pagination: { page: 1, limit: 10 }) {
    items {
      _id
      thoughts
      triggers
      places
      feelings
      created_at
      updated_at
      is_deleted
      version
    }
    total
    page
    limit
    totalPages
    hasNext
    hasPrevious
  }
}

# Get a single note by ID
query {
  note(id: "noteId") {
      _id
      thoughts
      triggers
      places
      feelings
      created_at
      is_deleted
      version
    updated_at
  }
}
```

### Mutations

```graphql
# Create a new note
mutation {
  createNote(
    createNoteInput: {
      thoughts: ["Sample thought"]
      triggers: ["Sample trigger"]
      places: ["Sample place"]
      feelings: ["Sample feeling"]
    }
  ) {
    _id
    thoughts
    triggers
    places
    created_at
  }
}

# Update a note
mutation {
  updateNote(
    id: "noteId"
    updateNoteInput: {
      _id: "noteId"
      thoughts: ["Updated thought"]
      triggers: ["Updated trigger"]
      places: ["Updated place"]
    }
  ) {
      _id
      thoughts
      triggers
      places
      feelings
      updated_at
      is_deleted
      version
  }
}

# Delete a note
mutation {
  removeNote(id: "noteId") {
    _id
  }
}
```

## Data Models

### Note

```typescript
type Note {
  _id: ID!                    // Unique identifier
  thoughts: [String!]!        // Array of thoughts (max 50, 1000 chars each)
  triggers: [String!]!        // Array of triggers (max 20, 100 chars each)
  places: [String!]!         // Array of places (max 20, 100 chars each)
  feelings: [String!]!       // Array of feelings (max 20, 100 chars each)
  user_id: String!          // Owner's user ID
  created_at: DateTime!     // Creation timestamp
  updated_at: DateTime!     // Last update timestamp
  is_deleted: Boolean!      // Soft delete flag
  version: Int!            // Document version
}
```

### Pagination Input

```typescript
input PaginationInput {
  page: Int! = 1            // Page number (default: 1)
  limit: Int! = 10          // Items per page (default: 10)
}
```

### Paginated Response

```typescript
type PaginatedNotesResult {
  items: [Note!]!           // Array of notes
  total: Int!              // Total number of notes
  page: Int!               // Current page
  limit: Int!             // Items per page
  totalPages: Int!        // Total number of pages
  hasNext: Boolean!       // Has next page
  hasPrevious: Boolean!  // Has previous page
}
```

## Error Handling

The API returns standard GraphQL errors with the following possible status codes:

- `401 Unauthorized`: Invalid or missing authentication
- `404 Not Found`: Note not found or invalid ID
- `409 Conflict`: Username already exists during registration
- `400 Bad Request`: Invalid input data

## Project Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run in production mode
npm run start:prod

# Run tests
npm run test
npm run test:e2e
```

## Environment Variables

Create a `.env` file in the root directory:

```env
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_uri
```

## React Native App Development

### Prompt for LLM to Create React Native App

Use this prompt to ask an LLM (like GPT-4) to create a React Native app for this API:

```
Create a React Native app for a journaling application that connects to a GraphQL API. The app should:

1. Core Features:
   - User authentication (login/register)
   - Note management (create, read, update, delete)
   - Rich text support for thoughts
   - Tags for triggers, places, and feelings
   - Offline support with synchronization

2. Technical Requirements:
   - Use Apollo Client for GraphQL integration
   - Implement secure token storage
   - Follow clean architecture principles
   - Use TypeScript for type safety
   - Implement error handling and loading states
   - Add proper input validation

3. UI/UX Requirements:
   - Modern, clean interface
   - Dark/light theme support
   - Smooth transitions and animations
   - Pull-to-refresh functionality
   - Infinite scroll for notes list
   - Haptic feedback for actions

4. Data Model Integration:
   Notes have the following structure:
   - thoughts: Array of strings (max 50, 1000 chars each)
   - triggers: Array of strings (max 20, 100 chars each)
   - places: Array of strings (max 20, 100 chars each)
   - feelings: Array of strings (max 20, 100 chars each)

5. Authentication Flow:
   - Implement JWT-based authentication
   - Handle token refresh
   - Add secure biometric authentication
   - Implement logout functionality

Please provide the implementation focusing on:
1. Project structure and setup
2. Key components and screens
3. State management solution
4. Navigation configuration
5. API integration
6. Error handling
7. Testing strategy
```

### Development Setup

When developing a React Native app that consumes this API:

1. Install a GraphQL client (recommended: Apollo Client):

```bash
npm install @apollo/client graphql
```

2. Setup Apollo Client:

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'YOUR_API_URL',
});

const authLink = setContext((_, { headers }) => {
  const token = // Get token from secure storage
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});
```

3. Example queries/mutations in React Native:

```typescript
import { gql, useQuery, useMutation } from '@apollo/client';

// Query notes
const GET_NOTES = gql`
  query GetNotes($page: Int!, $limit: Int!) {
    notes(pagination: { page: $page, limit: $limit }) {
      items {
        _id
        thoughts
        triggers
        places
        feelings
        created_at
        is_deleted
        version
      }
      total
      hasNext
    }
  }
`;

// Create note mutation
const CREATE_NOTE = gql`
  mutation CreateNote($input: CreateNoteInput!) {
    createNote(createNoteInput: $input) {
      _id
      thoughts
      triggers
      places
    }
  }
`;
```

4. Using in components:

```typescript
function NotesList() {
  const { loading, error, data } = useQuery(GET_NOTES, {
    variables: { page: 1, limit: 10 }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <FlatList
      data={data.notes.items}
      renderItem={({ item }) => <NoteCard note={item} />}
      keyExtractor={item => item._id}
    />
  );
}
```

This documentation should provide everything needed to develop a React Native app that interacts with the Sunlit Garden Notes API.
