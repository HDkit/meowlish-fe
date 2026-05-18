import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export interface FlashCardResponse {
  id: string;
  word: string;
  definition: string;
  image?: string;
  partOfSpeech?: string;
  pronunciation?: string;
  examples: string[];
  notes?: string;
  authorId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListFlashCardsResponse {
  flashCards: FlashCardResponse[];
  totalCount: number;
}

export interface CreateFlashCardPayload {
  word: string;
  definition: string;
  image?: string;
  partOfSpeech?: string;
  pronunciation?: string;
  examples?: string[];
  notes?: string;
  authorId: string;
  tags?: string[];
  listId: string;
}

export interface UpdateFlashCardPayload {
  word?: string;
  definition?: string;
  image?: string;
  partOfSpeech?: string;
  pronunciation?: string;
  examples?: string[];
  notes?: string;
  tags?: string[];
}

export class FlashcardService {
  public static listFlashCards(
    authorId?: string,
    page?: number,
    limit?: number,
    tags?: string[],
  ): CancelablePromise<ListFlashCardsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/flash-cards',
      query: { authorId, page, limit, tags },
    });
  }

  public static getFlashCard(id: string): CancelablePromise<FlashCardResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/flash-cards/{id}',
      path: { id },
    });
  }

  public static createFlashCard(
    payload: CreateFlashCardPayload,
  ): CancelablePromise<FlashCardResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/flash-cards',
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static updateFlashCard(
    id: string,
    payload: UpdateFlashCardPayload,
  ): CancelablePromise<FlashCardResponse> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/api/v1/resources/flash-cards/{id}',
      path: { id },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static deleteFlashCard(id: string): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/resources/flash-cards/{id}',
      path: { id },
    });
  }
}
