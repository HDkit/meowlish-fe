import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { FlashCardListResponse } from './FlashcardListService';

/** A card's editable content, as copied, compared and proposed. */
export interface FlashCardContent {
  word: string;
  definition: string;
  partOfSpeech?: string;
  pronunciation?: string;
  examples: string[];
  notes?: string;
  tags: string[];
  image?: string;
}

export type CardDiffField =
  | 'word'
  | 'definition'
  | 'partOfSpeech'
  | 'pronunciation'
  | 'examples'
  | 'notes'
  | 'tags';

export interface AddedCardChange {
  /** The card in the copy. */
  sourceCardId: string;
  card: FlashCardContent;
}

export interface ModifiedCardChange {
  /** The card in the original list. */
  targetCardId: string;
  sourceCardId: string;
  fields: CardDiffField[];
  /** The original's values when the change was computed. */
  base: FlashCardContent;
  proposed: FlashCardContent;
  /** On an open proposal: the original card now. */
  current?: FlashCardContent;
  /** The owner changed the same fields since the proposal: a choice is needed. */
  conflict: boolean;
  /** The original card was deleted since (skipped). */
  targetMissing: boolean;
}

export interface RemovedCardChange {
  targetCardId: string;
  base: FlashCardContent;
  current?: FlashCardContent;
  conflict: boolean;
  targetMissing: boolean;
}

export interface FlashCardListChanges {
  added: AddedCardChange[];
  modified: ModifiedCardChange[];
  removed: RemovedCardChange[];
}

export interface FlashCardListDiffResponse {
  sourceListId: string;
  targetListId: string;
  targetListName: string;
  targetOwnerId: string;
  changes: FlashCardListChanges;
  /** The user's open proposal from this copy, if any. */
  openProposalId?: string;
}

export interface PullUpstreamResponse {
  updated: number;
  added: number;
  removed: number;
  skipped: number;
}

export type FlashCardProposalStatus = 'OPEN' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface FlashCardProposalResponse {
  id: string;
  sourceListId?: string;
  sourceListName?: string;
  targetListId: string;
  targetListName: string;
  targetOwnerId: string;
  /** The proposer. */
  authorId: string;
  title: string;
  message: string;
  status: FlashCardProposalStatus;
  addedCount: number;
  modifiedCount: number;
  removedCount: number;
  decidedAt?: string;
  decidedBy?: string;
  decisionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlashCardProposalDetailResponse extends FlashCardProposalResponse {
  changes: FlashCardListChanges;
  conflictCount: number;
  canDecide: boolean;
  canWithdraw: boolean;
}

export interface ListFlashCardProposalsResponse {
  proposals: FlashCardProposalResponse[];
  totalCount: number;
}

export interface ListFlashCardProposalsQuery {
  targetListId?: string;
  sourceListId?: string;
  mine?: boolean;
  status?: FlashCardProposalStatus;
  page?: number;
  limit?: number;
}

export interface ConflictResolution {
  targetCardId: string;
  /** true: apply the proposal's version; false: keep the owner's. */
  apply: boolean;
}

/** The gateway wraps every response as `{ data }`; older callers sometimes get the bare value. */
export const unwrapEntity = <T,>(res: unknown): T =>
  ((res as { data?: T } | null)?.data ?? res) as T;

/** Saved copies ("forks") of public lists and proposals to change the original. */
export class FlashcardProposalService {
  /** Saves a private copy of someone else's public list. */
  public static forkFlashCardList(id: string): CancelablePromise<FlashCardListResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/flash-card-lists/{id}/fork',
      path: { id },
    });
  }

  /** The user's copy compared with its original. */
  public static getFlashCardListDiff(id: string): CancelablePromise<FlashCardListDiffResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/flash-card-lists/{id}/diff',
      path: { id },
    });
  }

  /** Brings the original's changes into the copy (cards the user changed are kept). */
  public static pullFlashCardListUpstream(id: string): CancelablePromise<PullUpstreamResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/flash-card-lists/{id}/pull',
      path: { id },
    });
  }

  public static createFlashCardProposal(
    sourceListId: string,
    payload: { title: string; message?: string },
  ): CancelablePromise<FlashCardProposalResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/flash-card-lists/{id}/proposals',
      path: { id: sourceListId },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static listFlashCardProposals(
    query: ListFlashCardProposalsQuery,
  ): CancelablePromise<ListFlashCardProposalsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/flash-card-proposals',
      query: { ...query },
    });
  }

  public static getFlashCardProposal(id: string): CancelablePromise<FlashCardProposalDetailResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/resources/flash-card-proposals/{id}',
      path: { id },
    });
  }

  public static acceptFlashCardProposal(
    id: string,
    payload: { resolutions: ConflictResolution[]; decisionNote?: string },
  ): CancelablePromise<FlashCardProposalResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/flash-card-proposals/{id}/accept',
      path: { id },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static rejectFlashCardProposal(
    id: string,
    payload: { decisionNote?: string },
  ): CancelablePromise<FlashCardProposalResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/flash-card-proposals/{id}/reject',
      path: { id },
      body: payload,
      mediaType: 'application/json',
    });
  }

  public static withdrawFlashCardProposal(id: string): CancelablePromise<FlashCardProposalResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/resources/flash-card-proposals/{id}/withdraw',
      path: { id },
    });
  }
}
