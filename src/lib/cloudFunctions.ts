/**
 * Helper to invoke Lovable Cloud edge functions.
 *
 * The app uses a custom `db.ts` Supabase client that points at the
 * ORIGINAL production database.  Edge functions, however, are deployed
 * on the Lovable Cloud project whose URL comes from `VITE_SUPABASE_URL`.
 * Calling `supabase.functions.invoke(…)` via db.ts therefore hits the
 * wrong project and silently fails.
 *
 * This module provides a thin wrapper that always targets the correct
 * Lovable Cloud functions endpoint.
 */

const CLOUD_URL = (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, '');
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

interface InvokeOptions {
  body?: Record<string, unknown>;
}

interface InvokeResult<T = any> {
  data: T | null;
  error: Error | null;
}

export async function invokeCloudFunction<T = any>(
  functionName: string,
  options?: InvokeOptions,
): Promise<InvokeResult<T>> {
  try {
    const url = `${CLOUD_URL}/functions/v1/${functionName}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await res.text();
    let data: T | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      // non-JSON response
    }

    if (!res.ok) {
      const msg = (data as any)?.error || `Edge function error (${res.status})`;
      return { data: null, error: new Error(msg) };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}