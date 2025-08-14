import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------

/**
 * Server-side authentication utilities
 * Centralized auth verification for API routes
 */

// Initialize Supabase client with service role key (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Extract Bearer token from Authorization header
 * @param {Request} request - Next.js request object
 * @returns {string|null} - Extracted token or null
 */
export function extractBearerToken(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return null;
    }

    if (!authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return null;
    }

    return token;
  } catch (error) {
    console.error('Error extracting bearer token:', error);
    return null;
  }
}

/**
 * Verify user authentication using Supabase
 * @param {Request} request - Next.js request object
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function verifyAuth(request) {
  try {
    // Extract token from Authorization header
    const token = extractBearerToken(request);

    if (!token) {
      return {
        user: null,
        error: 'Missing or invalid authorization header. Expected: Bearer <token>',
      };
    }

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Supabase auth error:', error);
      return {
        user: null,
        error: `Authentication failed: ${error.message}`,
      };
    }

    if (!user) {
      return {
        user: null,
        error: 'Invalid or expired token',
      };
    }

    // Return user with additional metadata
    return {
      user: {
        ...user,
        // Add commonly used fields for convenience
        userId: user.id,
        email: user.email,
        isAuthenticated: true,
      },
      error: null,
    };
  } catch (error) {
    console.error('Authentication verification failed:', error);
    return {
      user: null,
      error: 'Authentication verification failed',
    };
  }
}

/**
 * Verify authentication and return user or throw error
 * Convenience function for API routes that require authentication
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object>} - User object (throws if not authenticated)
 * @throws {Error} - If authentication fails
 */
export async function requireAuth(request) {
  const { user, error } = await verifyAuth(request);

  if (error || !user) {
    const errorMessage = error || 'Authentication required';
    const authError = new Error(errorMessage);
    authError.status = 401;
    authError.code = 'UNAUTHORIZED';
    throw authError;
  }

  return user;
}

/**
 * Middleware wrapper for API routes that require authentication
 * @param {Function} handler - API route handler function
 * @returns {Function} - Wrapped handler with authentication
 */
export function withAuth(handler) {
  return async (request, context) => {
    try {
      // Verify authentication
      const user = await requireAuth(request);

      // Add user to request context
      request.user = user;

      // Call original handler
      return await handler(request, context);
    } catch (error) {
      // Handle authentication errors
      if (error.status === 401) {
        return new Response(
          JSON.stringify({
            error: error.message,
            code: error.code || 'UNAUTHORIZED',
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Re-throw other errors
      throw error;
    }
  };
}

/**
 * Check if user has specific role or permission
 * @param {Object} user - User object from verifyAuth
 * @param {string|Array<string>} requiredRoles - Required role(s)
 * @returns {boolean} - Whether user has required role
 */
export function hasRole(user, requiredRoles) {
  if (!user || !user.role) {
    return false;
  }

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(user.role);
}

/**
 * Verify authentication and check role
 * @param {Request} request - Next.js request object
 * @param {string|Array<string>} requiredRoles - Required role(s)
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function verifyAuthWithRole(request, requiredRoles) {
  const { user, error } = await verifyAuth(request);

  if (error || !user) {
    return { user: null, error };
  }

  if (!hasRole(user, requiredRoles)) {
    return {
      user: null,
      error: `Insufficient permissions. Required role(s): ${Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles}`,
    };
  }

  return { user, error: null };
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, consider using Redis or external rate limiting service
 */
const rateLimitStore = new Map();

export function checkRateLimit(userId, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or create user's request history
  let userRequests = rateLimitStore.get(userId) || [];

  // Remove old requests outside the window
  userRequests = userRequests.filter((timestamp) => timestamp > windowStart);

  // Check if limit exceeded
  if (userRequests.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: Math.min(...userRequests) + windowMs,
    };
  }

  // Add current request
  userRequests.push(now);
  rateLimitStore.set(userId, userRequests);

  return {
    allowed: true,
    remaining: limit - userRequests.length,
    resetTime: now + windowMs,
  };
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimit() {
  const now = Date.now();
  const maxAge = 60000; // 1 minute

  for (const [userId, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter((timestamp) => now - timestamp < maxAge);

    if (validRequests.length === 0) {
      rateLimitStore.delete(userId);
    } else {
      rateLimitStore.set(userId, validRequests);
    }
  }
}

// Clean up rate limit store every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000);
}

/**
 * Export Supabase client for advanced use cases
 */
export { supabase };

/**
 * Default export with all utilities
 */
export default {
  verifyAuth,
  requireAuth,
  withAuth,
  hasRole,
  verifyAuthWithRole,
  extractBearerToken,
  checkRateLimit,
  cleanupRateLimit,
  supabase,
};
