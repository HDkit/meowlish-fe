import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { FlashCardResponse, ListFlashCardsResponse } from './FlashcardService';

export interface FlashCardListResponse {
  id: string;
  name: string;
  description: string;
  authorId: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FlashCardListDetailResponse extends FlashCardListResponse {
  flashCards: FlashCardResponse[];
  totalCards: number;
}

export interface ListFlashCardListsResponse {
  lists: FlashCardListResponse[];
  totalCount: number;
}

export interface CreateFlashCardListPayload {
  name: string;
  description?: string;
  authorId: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateFlashCardListPayload {
  name?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface AddCardToListPayload {
  flashCardId: string;
  position?: number;
}

export class FlashcardListService {
  public static listFlashCardLists(
    authorId?: string,
    isPublic?: boolean,
    page?: number,
    limit?: number,
    tags?: string[],
  ): CancelablePromise<ListFlashCardListsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/flash-card-lists',
      query: { authorId, isPublic, page, limit, tags },
    });
  }

  public static getFlashCardList(
    id: string,
  ): CancelablePromise<FlashCardListDetailResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/flash-card-lists/{id}',
      path: { id },
    });
  }

  public static createFlashCardList(
    payload: CreateFlashCardListPayload,
  ): CancelablePromise<FlashCardListResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/flash-card-lists',
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static updateFlashCardList(
    id: string,
    payload: UpdateFlashCardListPayload,
  ): CancelablePromise<FlashCardListResponse> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/api/v1/resources/flash-card-lists/{id}',
      path: { id },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static deleteFlashCardList(id: string): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/resources/flash-card-lists/{id}',
      path: { id },
    });
  }

  public static listCardsInList(
    id: string,
    page?: number,
    limit?: number,
  ): CancelablePromise<ListFlashCardsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/flash-card-lists/{id}/cards',
      path: { id },
      query: { page, limit },
    });
  }

  public static addCardToList(
    id: string,
    payload: AddCardToListPayload,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/flash-card-lists/{id}/cards',
      path: { id },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static removeCardFromList(
    listId: string,
    cardId: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/resources/flash-card-lists/{listId}/cards/{cardId}',
      path: { listId, cardId },
    });
  }
}
