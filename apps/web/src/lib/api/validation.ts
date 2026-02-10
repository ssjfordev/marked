/**
 * API Validation Schemas
 *
 * Zod schemas for request validation.
 * All text fields are sanitized and have consistent max lengths.
 */

import { z } from 'zod';
import { ValidationError } from './errors';
import { sanitizeText, TEXT_LIMITS } from './sanitize';

// ============ Common Validators ============

const uuidSchema = z.string().uuid();
const shortIdSchema = z.string().min(1).max(50);

// Sanitized string transformer
const sanitized = z.string().transform((val) => sanitizeText(val));

// URL validation
const urlSchema = z.string().min(1).max(TEXT_LIMITS.URL);

// ============ Folders ============

export const createFolderSchema = z.object({
  name: sanitized.pipe(z.string().min(1).max(TEXT_LIMITS.NAME)),
  parentId: shortIdSchema.nullable().optional(),
});

export const updateFolderSchema = z.object({
  name: sanitized.pipe(z.string().min(1).max(TEXT_LIMITS.NAME)).optional(),
  icon: z.string().max(TEXT_LIMITS.ICON).nullable().optional(),
  description: sanitized.pipe(z.string().max(TEXT_LIMITS.DESCRIPTION)).nullable().optional(),
  parentId: z.string().max(50).nullable().optional(),
  position: z.number().int().min(0).optional(),
});

// ============ Links ============

export const createLinkSchema = z.object({
  url: urlSchema,
  folderId: shortIdSchema,
  tags: z
    .array(sanitized.pipe(z.string().min(1).max(TEXT_LIMITS.NAME)))
    .max(20)
    .optional(),
  userTitle: sanitized.pipe(z.string().max(TEXT_LIMITS.TITLE)).optional(),
  userDescription: sanitized.pipe(z.string().max(TEXT_LIMITS.DESCRIPTION)).optional(),
  ogImage: z.string().max(TEXT_LIMITS.URL).optional(),
});

export const updateLinkSchema = z.object({
  folderId: shortIdSchema.optional(),
  userTitle: sanitized.pipe(z.string().max(TEXT_LIMITS.TITLE)).nullable().optional(),
  userDescription: sanitized.pipe(z.string().max(TEXT_LIMITS.DESCRIPTION)).nullable().optional(),
  position: z.number().int().min(0).optional(),
});

// ============ Tags ============

export const createTagSchema = z.object({
  name: sanitized.pipe(z.string().min(1).max(TEXT_LIMITS.NAME)),
});

export const addTagToLinkSchema = z.object({
  tagName: sanitized.pipe(z.string().min(1).max(TEXT_LIMITS.NAME)),
});

// ============ Validation Helper ============

/**
 * Validate request body against a Zod schema.
 * Throws ValidationError if invalid.
 */
export async function validateRequest<T extends z.ZodSchema>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Invalid JSON body');
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    throw new ValidationError('Validation failed', { fields: fieldErrors });
  }

  return result.data;
}

/**
 * Validate a UUID parameter
 */
export function validateUuid(value: string | undefined, name: string): string {
  if (!value) {
    throw new ValidationError(`${name} is required`);
  }

  const result = uuidSchema.safeParse(value);
  if (!result.success) {
    throw new ValidationError(`Invalid ${name} format`);
  }

  return result.data;
}
