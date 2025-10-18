// Shared validation schemas and utilities for edge functions
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Domain validation
export const ALLOWED_DOMAINS = ['healthcare', 'agriculture', 'finance', 'technology'] as const;

export const processQuerySchema = z.object({
  query: z.string().trim().min(1, "Query cannot be empty").max(2000, "Query too long"),
  domain: z.string().optional(),
  useCache: z.boolean().optional().default(true),
});

export const generateDummyDataSchema = z.object({
  domain: z.enum(ALLOWED_DOMAINS).default('technology'),
});

export const optimizeAgentsSchema = z.object({
  inactiveThresholdMinutes: z.number().int().min(1).max(1440).default(5),
});

export const reloadCacheSchema = z.object({
  cacheType: z.enum(['all', 'queries', 'embeddings']).default('all'),
  minAccessCount: z.number().int().min(0).max(1000).default(1),
});

// Safe error response helper
export function createErrorResponse(status: number, publicMessage: string, corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: publicMessage }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Auth verification helper
export function verifyAuth(req: Request, corsHeaders: Record<string, string>) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return createErrorResponse(401, 'Authentication required', corsHeaders);
  }
  return null;
}
