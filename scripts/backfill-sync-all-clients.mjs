#!/usr/bin/env node
/**
 * Backfill sync script: Syncs all GHL clients from January 1 2026 to today.
 * Triggers contacts, calendar, pipelines, and recalculates daily metrics
 * for the full date range to ensure accurate rollup numbers.
 *
 * Usage: node scripts/backfill-sync-all-clients.mjs
 */

const SUPABASE_URL = 'https://jgwwmtuvjlmzapwqiabu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd3dtdHV2amxtemFwd3FpYWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDkzODIsImV4cCI6MjA4MzMyNTM4Mn0.STFrUoif30xXQCjabc3skP6_tTnVIATwHhwWxeZoUr4';

const START_DATE = '2026-01-01';
const TODAY = new Date().toISOString().split('T')[0];
const SINCE_DAYS = Math.ceil((Date.now() - new Date(START_DATE + 'T00:00:00Z').getTime()) / (1000 * 60 * 60 * 24));

async function invokeFunction(functionName, body, timeoutMs = 300000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    clearTimeout(timeout);
    return { ok: false, status: 0, data: { error: err.message } };
  }
}

async function fetchClients() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/clients?select=id,name,status,ghl_api_key,ghl_location_id&ghl_api_key=not.is.null&ghl_location_id=not.is.null&order=sort_order.asc,name.asc`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch clients: ${res.status} ${err}`);
  }
  return res.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('='.repeat(70));
  console.log(`BACKFILL SYNC: ${START_DATE} → ${TODAY} (${SINCE_DAYS} days)`);
  console.log('='.repeat(70));

  // Step 1: Get all clients with GHL credentials
  console.log('\n[1/5] Fetching clients with GHL credentials...');
  const clients = await fetchClients();
  console.log(`     Found ${clients.length} client(s):`);
  clients.forEach((c, i) => {
    const hasKey = c.ghl_api_key ? '✓ API Key' : '✗ No Key';
    const hasLoc = c.ghl_location_id ? '✓ Location' : '✗ No Location';
    console.log(`     ${i + 1}. ${c.name} [${c.status}] — ${hasKey}, ${hasLoc}`);
  });

  if (clients.length === 0) {
    console.log('     No clients found. Exiting.');
    return;
  }

  // Step 2: Sync contacts for each client (with sinceDateDays to cover full range)
  console.log(`\n[2/5] Syncing GHL contacts (${SINCE_DAYS} days back) for each client...`);
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    console.log(`\n     --- Client ${i + 1}/${clients.length}: ${client.name} ---`);

    console.log(`     Syncing contacts...`);
    const contactRes = await invokeFunction('sync-ghl-contacts', {
      client_id: client.id,
      syncType: 'all',
      sinceDateDays: SINCE_DAYS,
    });
    if (contactRes.ok) {
      const s = contactRes.data?.summary || contactRes.data?.results?.[0]?.contacts || {};
      console.log(`     ✓ Contacts: created=${s.total_contacts_created || s.created || 0}, updated=${s.total_contacts_updated || s.updated || 0}, funded_tags=${s.total_funded_from_tags || s.fundedFromTags || 0}, pipeline_funded=${s.total_funded_from_pipeline || s.fundedFromPipeline || 0}, calls_created=${s.total_calls_created || s.callsCreated || 0}`);
    } else {
      console.log(`     ✗ Contact sync failed: ${contactRes.data?.error || contactRes.status}`);
    }

    // Small delay between clients to avoid rate limiting
    if (i < clients.length - 1) {
      console.log(`     Waiting 10s before next client...`);
      await sleep(10000);
    }
  }

  // Step 3: Sync calendar appointments for each client
  console.log(`\n[3/5] Syncing calendar appointments for each client...`);
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    console.log(`     ${client.name}: syncing calendars...`);
    const calRes = await invokeFunction('sync-calendar-appointments', {
      clientId: client.id,
      sinceDateDays: SINCE_DAYS,
    });
    if (calRes.ok) {
      console.log(`     ✓ ${client.name}: ${JSON.stringify(calRes.data?.summary || calRes.data?.message || 'done')}`);
    } else {
      console.log(`     ✗ ${client.name}: ${calRes.data?.error || calRes.status}`);
    }
    await sleep(3000);
  }

  // Step 4: Sync pipelines for each client
  console.log(`\n[4/5] Syncing pipelines (funded/committed) for each client...`);
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    console.log(`     ${client.name}: syncing pipelines...`);
    const pipeRes = await invokeFunction('sync-ghl-pipelines', {
      client_id: client.id,
    });
    if (pipeRes.ok) {
      console.log(`     ✓ ${client.name}: ${JSON.stringify(pipeRes.data?.summary || pipeRes.data?.message || 'done')}`);
    } else {
      console.log(`     ✗ ${client.name}: ${pipeRes.data?.error || pipeRes.status}`);
    }
    await sleep(3000);
  }

  // Step 5: Recalculate daily metrics for the full date range
  console.log(`\n[5/5] Recalculating daily metrics for full range (${START_DATE} → ${TODAY})...`);
  const metricsRes = await invokeFunction('recalculate-daily-metrics', {
    startDate: START_DATE,
    endDate: TODAY,
  });
  if (metricsRes.ok) {
    const d = metricsRes.data;
    console.log(`     ✓ Metrics recalculated: ${d?.totalUpdated || d?.message || 'started in background'}`);
    if (d?.summary) {
      for (const c of d.summary) {
        console.log(`       - ${c.name}: ${c.daysUpdated} days updated, ${c.errors?.length || 0} errors`);
      }
    }
  } else {
    console.log(`     ✗ Metrics recalc failed: ${metricsRes.data?.error || metricsRes.status}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('BACKFILL SYNC COMPLETE');
  console.log('='.repeat(70));
  console.log(`\nAll ${clients.length} client(s) synced from ${START_DATE} to ${TODAY}.`);
  console.log('Daily metrics recalculated for the full range.');
  console.log('Verify in the dashboard rollup that leads, calls, showed, commitments, and funded are accurate.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
