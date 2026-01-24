/**
 * API Validation Schemas
 *
 * Zod schemas for request validation.
 */

import { z } from 'zod';
import { ValidationError } from './errors';

// ============ Common Validators ============

const uuidSchema = z.string().uuid();

// URL validation that's not too strict
const urlSchema = z.string().min(1).max(2048);

// ============ Folders ============

export const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().nullable().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  parentId: z.string().uuid().nullable().optional(),
  position: z.number().int().min(0).optional(),
});

// ============ Links ============

export const createLinkSchema = z.object({
  url: urlSchema,
  folderId: uuidSchema,
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  userTitle: z.string().max(500).optional(),
  userDescription: z.string().max(2000).optional(),
});

export const updateLinkSchema = z.object({
  folderId: uuidSchema.optional(),
  userTitle: z.string().max(500).nullable().optional(),
  userDescription: z.string().max(2000).nullable().optional(),
  position: z.number().int().min(0).optional(),
});

// ============ Tags ============

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
});

export const addTagToLinkSchema = z.object({
  tagName: z.string().min(1).max(50),
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
