import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// WEBHOOK PROCESSING
// ============================================================
// - ad_spend: processed inline for real-time spend tracking
// - contact/opportunity webhooks: trigger automatic full sync
//   for end-to-end attribution tracking
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const localDb = createClient(supabaseUrl, supabaseKey);

  // Production DB — source of truth for reads and writes
  const prodUrl = Deno.env.get('ORIGINAL_SUPABASE_URL') || supabaseUrl;
  const prodKey = Deno.env.get('ORIGINAL_SUPABASE_SERVICE_ROLE_KEY') || supabaseKey;
  const isDistinct = prodUrl !== supabaseUrl;
  const prodDb = isDistinct ? createClient(prodUrl, prodKey) : null;
  // Use production DB for reads (client lookup, lead queries), local for function invocations
  const supabase = prodDb || localDb;
  // Mirror writes to local Lovable Cloud DB (fire-and-forget)
  const mirrorToLocal = async (label: string, fn: (db: any) => Promise<any>) => {
    if (!isDistinct) return;
    try { const r = await fn(localDb); if (r?.error) console.warn(`[dual-write-local] ${label}:`, r.error.message); }
    catch (e) { console.warn(`[dual-write-local] ${label}:`, e); }
  };

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const clientId = pathParts[1];
    const webhookType = pathParts[2];

    if (!clientId || !webhookType) {
      return new Response(
        JSON.stringify({ error: 'Missing clientId or webhookType in URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, ghl_api_key, ghl_location_id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error('Client not found:', clientId);
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // AD SPEND WEBHOOKS - Process inline
    // ============================================================
    if (webhookType === 'ad_spend') {
      console.log(`[ACTIVE] Ad spend webhook - Client: ${client.name} (${clientId})`);
      
      const records = Array.isArray(payload) ? payload : [payload];
      let insertedCount = 0;
      
      for (const record of records) {
        const reportedAt = record.reported_at || record.date || new Date().toISOString().split('T')[0];
        
        const adSpendRecord = {
          client_id: clientId,
          reported_at: reportedAt,
          spend: parseFloat(record.spend) || 0,
          impressions: parseInt(record.impressions) || null,
          clicks: parseInt(record.clicks) || null,
          platform: record.platform || 'facebook',
          campaign_name: record.campaign_name || record.campaign || null,
          ad_set_name: record.ad_set_name || record.adset || null,
        };

        const { error: insertError } = await supabase
          .from('ad_spend_reports')
          .upsert(adSpendRecord, { 
            onConflict: 'client_id,reported_at,platform,campaign_name',
            ignoreDuplicates: false 
          });

        if (insertError) {
          console.error('Error inserting ad spend:', insertError);
        } else {
          insertedCount++;
          // Dual-write ad spend to production
          await mirrorToProd("ad_spend", (db) => db.from('ad_spend_reports').upsert(adSpendRecord, {
            onConflict: 'client_id,reported_at,platform,campaign_name',
            ignoreDuplicates: false
          }));
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: 'processed',
          message: `Processed ${insertedCount} ad spend records`,
          webhook_type: webhookType,
          client_id: clientId,
          received_at: new Date().toISOString(),
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // ============================================================
    // CONTACT & OPPORTUNITY WEBHOOKS - Auto-sync everything
    // ============================================================
    const contactWebhookTypes = [
      'contact', 'contacts', 'contact_created', 'contact_updated',
      'ContactCreate', 'ContactUpdate', 'ContactDndUpdate',
      'ContactTagUpdate', 'ContactDelete',
      'opportunity', 'opportunities', 'opportunity_created', 'opportunity_updated',
      'OpportunityCreate', 'OpportunityUpdate', 'OpportunityStageUpdate',
      'OpportunityStatusUpdate', 'OpportunityMonetaryValueUpdate',
      'appointment', 'appointments', 'AppointmentCreate', 'AppointmentUpdate',
      'TaskCreate', 'TaskUpdate', 'NoteCreate', 'NoteUpdate',
    ];

    // Extract the GHL contact ID from various webhook payload formats
    const extractContactId = (payload: any): string | null => {
      // Direct contactId field
      if (payload.contactId) return payload.contactId;
      if (payload.contact_id) return payload.contact_id;
      // Contact object with id
      if (payload.contact?.id) return payload.contact.id;
      // For opportunity webhooks
      if (payload.opportunity?.contactId) return payload.opportunity.contactId;
      if (payload.opportunity?.contact_id) return payload.opportunity.contact_id;
      // For appointment webhooks
      if (payload.appointment?.contactId) return payload.appointment.contactId;
      // The payload itself might be the contact
      if (payload.id && (payload.firstName || payload.lastName || payload.email || payload.phone)) {
        return payload.id;
      }
      return null;
    };

    if (contactWebhookTypes.some(t => webhookType.toLowerCase().includes(t.toLowerCase()) || webhookType === t)) {
      const contactId = extractContactId(payload);
      
      console.log(`[AUTO-SYNC] ${webhookType} webhook - Client: ${client.name}, ContactId: ${contactId || 'unknown'}`);

      // Log webhook to webhook_logs table
      const logStatus = (contactId && client.ghl_api_key && client.ghl_location_id) ? 'success' : 'acknowledged';
      const webhookLogData = {
        client_id: clientId,
        webhook_type: webhookType,
        status: logStatus,
        payload: payload,
        error_message: !contactId ? 'No contact ID extracted' : (!client.ghl_api_key ? 'No GHL credentials' : null),
      };
      await supabase.from('webhook_logs').insert(webhookLogData).then(({ error: logErr }) => {
        if (logErr) console.error('[WEBHOOK-LOG] Failed to log:', logErr);
      });
      // Dual-write webhook log to production
      await mirrorToProd("webhook_log", (db) => db.from('webhook_logs').insert(webhookLogData));
      
      if (contactId && client.ghl_api_key && client.ghl_location_id) {
        // Full lead pipeline: 5s delay → sync contact → enrich → 5s delay → sync notes back
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const authHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        };

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const pipelinePromise = (async () => {
          try {
            // Step 1: Wait 5s for GHL to persist the contact
            console.log(`[PIPELINE] Step 1: Waiting 5s before sync for contact ${contactId}`);
            await delay(5000);

            // Step 2: Sync contact from GHL into our database
            console.log(`[PIPELINE] Step 2: Syncing contact ${contactId} from GHL`);
            const syncRes = await fetch(`${supabaseUrl}/functions/v1/sync-ghl-contacts`, {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({ mode: 'single_contact', client_id: clientId, contact_id: contactId }),
            });
            const syncResult = await syncRes.text();
            console.log(`[PIPELINE] Sync result: ${syncRes.status} - ${syncResult.substring(0, 200)}`);

            // Step 3: Look up the lead to get enrichment inputs
            const { data: lead } = await supabase
              .from('leads')
              .select('id, name, email, phone, external_id')
              .eq('client_id', clientId)
              .eq('external_id', contactId)
              .maybeSingle();

            if (!lead) {
              console.log(`[PIPELINE] No lead found for contact ${contactId}, skipping enrichment`);
              return;
            }

            // Step 4: Enrich via RetargetIQ
            console.log(`[PIPELINE] Step 3: Enriching lead ${lead.id} (${lead.name || contactId})`);
            const nameParts = (lead.name || '').split(' ');
            const enrichRes = await fetch(`${supabaseUrl}/functions/v1/enrich-lead-retargetiq`, {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({
                client_id: clientId,
                lead_id: lead.id,
                external_id: contactId,
                phone: lead.phone || undefined,
                email: lead.email || undefined,
                first_name: nameParts[0] || undefined,
                last_name: nameParts.slice(1).join(' ') || undefined,
              }),
            });
            const enrichResult = await enrichRes.text();
            console.log(`[PIPELINE] Enrichment result: ${enrichRes.status} - ${enrichResult.substring(0, 300)}`);

            // The enrich-lead-retargetiq function already handles the 5s delay + GHL note sync
            console.log(`[PIPELINE] ✅ Full pipeline completed for contact ${contactId}`);

          } catch (err) {
            console.error(`[PIPELINE] Error in lead pipeline for ${contactId}:`, err);
          }
        })();

        // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
          // @ts-ignore
          EdgeRuntime.waitUntil(pipelinePromise);
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            status: 'auto_sync_triggered',
            message: `Webhook received. Full contact sync triggered for ${contactId} (contact info, fields, pipelines, value, timelines).`,
            webhook_type: webhookType,
            client_id: clientId,
            contact_id: contactId,
            received_at: new Date().toISOString(),
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        // No contact ID or no GHL credentials - acknowledge but can't sync
        console.log(`[AUTO-SYNC] Cannot sync - contactId: ${contactId}, hasApiKey: ${!!client.ghl_api_key}, hasLocationId: ${!!client.ghl_location_id}`);
        
        return new Response(
          JSON.stringify({
            success: true,
            status: 'acknowledged',
            message: contactId 
              ? 'Webhook received but client has no GHL credentials configured for auto-sync.'
              : 'Webhook received but no contact ID could be extracted from payload.',
            webhook_type: webhookType,
            client_id: clientId,
            received_at: new Date().toISOString(),
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // All other webhook types - acknowledge without processing
    console.log(`[ACK] Webhook received - Type: ${webhookType}, Client: ${client.name} (${clientId})`);

    return new Response(
      JSON.stringify({
        success: true,
        status: 'acknowledged',
        message: 'Webhook acknowledged.',
        webhook_type: webhookType,
        client_id: clientId,
        received_at: new Date().toISOString(),
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
