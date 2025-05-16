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
      created_at
      updated_at
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
    created_at
    updated_at
  }
}
```

### Mutations

```graphql
# Create a new note
mutation {
  createNote(createNoteInput: {
    thoughts: ["Sample thought"]
    triggers: ["Sample trigger"]
    places: ["Sample place"]
  }) {
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
    updated_at
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
  thoughts: [String!]!        // Array of thoughts
  triggers: [String!]!        // Array of triggers
  places: [String!]!         // Array of places
  user_id: String!           // Owner's user ID
  created_at: DateTime!      // Creation timestamp
  updated_at: DateTime!      // Last update timestamp
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

## Development Guide for React Native App

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
        created_at
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
