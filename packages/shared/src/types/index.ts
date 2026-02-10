/**
 * Shared types used across web, extension, and mobile apps
 */

// Link types
export interface LinkCanonical {
  id: string;
  url_key: string;
  original_url: string;
  domain: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  favicon: string | null;
}

export interface LinkInstance {
  id: string;
  user_id: string;
  folder_id: string | null;
  link_canonical_id: string;
  user_title: string | null;
  user_description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// Folder types
export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// Tag types
export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// Mark types
export interface Mark {
  id: string;
  user_id: string;
  link_canonical_id: string;
  text: string;
  color: string;
  note: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// Memo types
export interface Memo {
  id: string;
  user_id: string;
  link_canonical_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Subscription types
export type SubscriptionPlan = 'free' | 'pro' | 'lifetime';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
}

// API types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Extension message types
export type ExtensionMessageType =
  | 'SAVE_LINK'
  | 'UPDATE_LINK'
  | 'DELETE_LINK'
  | 'CHECK_LINK'
  | 'CREATE_MARK'
  | 'UPDATE_MARK'
  | 'DELETE_MARK'
  | 'GET_MARKS'
  | 'GET_CURRENT_TAB'
  | 'GET_FOLDERS'
  | 'GET_TAGS'
  | 'AUTH_STATUS'
  | 'OPEN_POPUP';

export interface ExtensionMessage {
  type: ExtensionMessageType;
  payload?: unknown;
}

export interface SaveLinkPayload {
  url: string;
  title?: string;
  description?: string;
  folderId?: string;
  tags?: string[];
  memo?: string;
  ogImage?: string;
}

export interface CreateMarkPayload {
  url: string;
  text: string;
  color?: string;
  note?: string;
}

export interface CheckLinkPayload {
  url: string;
}

export interface UpdateLinkPayload {
  linkId: string;
  folderId?: string;
  userTitle?: string;
  userDescription?: string;
  tags?: string[];
  memo?: string;
}

export interface DeleteLinkPayload {
  linkId: string;
}

export interface ExistingLinkInfo {
  id: string;
  folderId: string | null;
  userTitle: string | null;
  userDescription: string | null;
  tags: string[];
  memo: string;
  canonical: {
    title: string | null;
    description: string | null;
  };
}

export interface UpdateMarkPayload {
  markId: string;
  color?: string;
  note?: string;
}

export interface DeleteMarkPayload {
  markId: string;
}

export interface GetMarksPayload {
  url: string;
}
