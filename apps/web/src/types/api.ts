/**
 * API Request/Response Types
 *
 * Shared types for API contracts between client and server.
 * Spec ref: clean_code_guidelines.md#1.2 (Explicit Contracts)
 */

import type { Database } from './database';

// Internal database types (with UUID id)
export type FolderDb = Database['public']['Tables']['folders']['Row'];
export type LinkCanonicalDb = Database['public']['Tables']['link_canonicals']['Row'];
export type LinkInstance = Database['public']['Tables']['link_instances']['Row'];
export type Tag = Database['public']['Tables']['tags']['Row'];

// Public API types (using short_id as id, excluding internal fields)
export interface Folder {
  id: string; // short_id
  name: string;
  icon: string | null;
  parent_id: string | null; // parent's short_id
  position: number;
  created_at: string;
  updated_at: string;
}

export interface LinkCanonical {
  id: string; // short_id
  url_key: string;
  original_url: string;
  domain: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  favicon: string | null;
  created_at: string;
  updated_at: string;
}

// ============ Folders API ============

export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
}

export interface UpdateFolderRequest {
  name?: string;
  icon?: string | null;
  parentId?: string | null;
  position?: number;
}

export interface FolderWithChildren extends Folder {
  children?: FolderWithChildren[];
}

// ============ Links API ============

export interface CreateLinkRequest {
  url: string;
  folderId: string;
  tags?: string[]; // Tag names - will create if not exist
  userTitle?: string;
  userDescription?: string;
}

export interface UpdateLinkRequest {
  folderId?: string;
  userTitle?: string;
  userDescription?: string;
  position?: number;
}

export interface LinkWithDetails extends LinkInstance {
  canonical: LinkCanonical;
  tags: Tag[];
}

// ============ Tags API ============

export interface CreateTagRequest {
  name: string;
}

export interface AddTagToLinkRequest {
  tagName: string; // Will create if not exist
}

// ============ API Response Types ============

export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  data?: never;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// Common error codes
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
