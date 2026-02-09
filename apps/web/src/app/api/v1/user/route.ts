/**
 * User API - Get current user info
 *
 * GET /api/v1/user - Returns email and created_at for the authenticated user
 */

import { requireAuth, success, handleError } from '@/lib/api';

export async function GET() {
  try {
    const user = await requireAuth();

    return success({
      email: user.email ?? '',
      created_at: user.created_at,
    });
  } catch (err) {
    return handleError(err);
  }
}
