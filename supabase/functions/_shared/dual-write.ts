import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Creates both production and cloud database clients for dual-write operations.
 * Production DB = ORIGINAL_SUPABASE_URL (primary data store)
 * Cloud DB = SUPABASE_URL (Lovable Cloud, for frontend reads)
 */
export function createDualClients() {
  const prodUrl = Deno.env.get("ORIGINAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
  const prodKey = Deno.env.get("ORIGINAL_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const cloudUrl = Deno.env.get("SUPABASE_URL")!;
  const cloudKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const prodDb = createClient(prodUrl, prodKey);
  // Only create a separate cloud client if URLs differ
  const isDistinct = prodUrl !== cloudUrl;
  const cloudDb = isDistinct ? createClient(cloudUrl, cloudKey) : null;

  return { prodDb, cloudDb, cloudUrl, cloudKey };
}

/**
 * Fire-and-forget mirror write to cloudDb. 
 * Logs warning on failure but never throws.
 */
export async function mirrorWrite(
  cloudDb: any | null,
  label: string,
  writeFn: (db: any) => Promise<any>
): Promise<void> {
  if (!cloudDb) return;
  try {
    const result = await writeFn(cloudDb);
    if (result?.error) {
      console.warn(`[dual-write] ${label} cloud write error:`, result.error.message);
    }
  } catch (err) {
    console.warn(`[dual-write] ${label} cloud write exception:`, err);
  }
}

/**
 * Update integration_status after a sync completes.
 */
export async function updateIntegrationStatus(
  prodDb: any,
  cloudDb: any | null,
  integrationName: string,
  status: string,
  recordCount: number,
  errorMessage?: string | null,
) {
  const row = {
    integration_name: integrationName,
    status,
    last_sync_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    config: { records_synced: recordCount },
    error_message: errorMessage || null,
  };

  await prodDb.from("integration_status").upsert(row, { onConflict: "integration_name" });
  await mirrorWrite(cloudDb, `integration_status:${integrationName}`, (db) =>
    db.from("integration_status").upsert(row, { onConflict: "integration_name" })
  );
}
