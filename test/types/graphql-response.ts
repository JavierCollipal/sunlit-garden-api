export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
}

export interface CreateNoteResponse {
  createNote: {
    _id: string;
    user_id: string;
    thoughts: string[];
    triggers: string[];
    places: string[];
    created_at: string;
    updated_at: string;
  };
}

export interface FindAllNotesResponse {
  notes: Array<{
    _id: string;
    user_id: string;
    thoughts: string[];
    triggers: string[];
    places: string[];
  }>;
}

export interface FindOneNoteResponse {
  note: {
    _id: string;
    user_id: string;
    thoughts: string[];
    triggers: string[];
    places: string[];
  };
}

export interface UpdateNoteResponse {
  updateNote: {
    _id: string;
    thoughts: string[];
  };
}

export interface RemoveNoteResponse {
  removeNote: {
    _id: string;
  };
}
