import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PASSWORD = "HPA1234$";

// Capital Raising onboarding task templates
const CAPITAL_RAISING_TASKS = [
  { category: 'Client Setup', title: 'DNS & Domain configured', sort_order: 1 },
  { category: 'Client Setup', title: 'GHL sub-account created', sort_order: 2 },
  { category: 'Client Setup', title: 'GHL API key saved', sort_order: 3 },
  { category: 'Client Setup', title: 'Meta Ad Account access granted', sort_order: 4 },
  { category: 'Client Setup', title: 'Meta Pixel installed', sort_order: 5 },
  { category: 'Client Setup', title: 'Business Manager access granted', sort_order: 6 },
  { category: 'System Config', title: 'Reporting dashboard connected', sort_order: 7 },
  { category: 'System Config', title: 'Calendar IDs mapped', sort_order: 8 },
  { category: 'System Config', title: 'Pipeline stages configured', sort_order: 9 },
  { category: 'System Config', title: 'Slack channel mapped', sort_order: 10 },
  { category: 'System Config', title: 'Webhook integrations set up', sort_order: 11 },
  { category: 'Funnel & Creative', title: 'Quiz funnel created', sort_order: 12 },
  { category: 'Funnel & Creative', title: 'Thank-you / booking page live', sort_order: 13 },
  { category: 'Funnel & Creative', title: 'Brand assets collected (logo, colors, fonts)', sort_order: 14 },
  { category: 'Funnel & Creative', title: 'Ad creatives designed & approved', sort_order: 15 },
  { category: 'Funnel & Creative', title: 'Ad copy written & approved', sort_order: 16 },
  { category: 'Media Buying', title: 'Target audiences built', sort_order: 17 },
  { category: 'Media Buying', title: 'Campaign structure created', sort_order: 18 },
  { category: 'Media Buying', title: 'Conversion events configured', sort_order: 19 },
  { category: 'Media Buying', title: 'Campaign launched', sort_order: 20 },
];

const ECOM_TASKS = [
  { category: 'Client Setup', title: 'Domain & hosting configured', sort_order: 1 },
  { category: 'Client Setup', title: 'Meta Ad Account access granted', sort_order: 2 },
  { category: 'Client Setup', title: 'Meta Pixel installed', sort_order: 3 },
  { category: 'Client Setup', title: 'Business Manager access granted', sort_order: 4 },
  { category: 'System Config', title: 'Reporting dashboard connected', sort_order: 5 },
  { category: 'System Config', title: 'Slack channel mapped', sort_order: 6 },
  { category: 'Funnel & Creative', title: 'Product catalog set up', sort_order: 7 },
  { category: 'Funnel & Creative', title: 'Brand assets collected', sort_order: 8 },
  { category: 'Funnel & Creative', title: 'Ad creatives designed & approved', sort_order: 9 },
  { category: 'Funnel & Creative', title: 'Ad copy written & approved', sort_order: 10 },
  { category: 'Media Buying', title: 'Target audiences built', sort_order: 11 },
  { category: 'Media Buying', title: 'Campaign structure created', sort_order: 12 },
  { category: 'Media Buying', title: 'Campaign launched', sort_order: 13 },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Auth check
    if (body.password !== PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Connect to the production database
    const originalUrl = Deno.env.get("ORIGINAL_SUPABASE_URL");
    const originalKey = Deno.env.get("ORIGINAL_SUPABASE_SERVICE_ROLE_KEY");

    if (!originalUrl || !originalKey) {
      throw new Error("Missing ORIGINAL_SUPABASE_URL or ORIGINAL_SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(originalUrl, originalKey);

    // Extract onboarding data
    const {
      company_name,
      contact_name,
      contact_email,
      contact_phone,
      fund_type,
      website,
      raise_amount,
      timeline,
      min_investment,
      target_investor,
      pitch_deck_link,
      pitch_deck_path,
      budget_mode,
      budget_amount,
      investor_list_path,
      brand_notes,
      additional_notes,
      kickoff_date,
      kickoff_time,
      speaker_name,
      industry_focus,
      targeted_returns,
      hold_period,
      distribution_schedule,
      investment_range,
      tax_advantages,
      credibility,
      fund_history,
      client_type,
      // Allow passing an existing source_client_id from aicapitalraising.com
      source_client_id,
    } = body;

    if (!company_name) {
      return new Response(JSON.stringify({ error: "company_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const slug = slugify(company_name);
    const resolvedClientType = client_type || 'CAPITAL_RAISING';

    // Check if client already exists by slug or name
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .or(`slug.eq.${slug},name.ilike.${company_name}`)
      .limit(1);

    let clientId: string;

    if (existing && existing.length > 0) {
      clientId = existing[0].id;
      console.log(`Client already exists: ${clientId}`);
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: company_name,
          slug,
          status: 'onboarding',
          industry: fund_type || industry_focus || null,
          description: [
            fund_type ? `Fund Type: ${fund_type}` : null,
            raise_amount ? `Raise: $${raise_amount}` : null,
            timeline ? `Timeline: ${timeline}` : null,
            speaker_name ? `Speaker: ${speaker_name}` : null,
          ].filter(Boolean).join(' | ') || null,
          website_url: website || null,
          offer_description: [
            targeted_returns ? `Returns: ${targeted_returns}` : null,
            hold_period ? `Hold: ${hold_period}` : null,
            distribution_schedule ? `Distribution: ${distribution_schedule}` : null,
            tax_advantages ? `Tax: ${tax_advantages}` : null,
            credibility || null,
            fund_history || null,
          ].filter(Boolean).join(' | ') || null,
          client_type: resolvedClientType,
        })
        .select('id')
        .single();

      if (clientError) {
        console.error('Client creation error:', clientError);
        throw new Error(`Failed to create client: ${clientError.message}`);
      }

      clientId = newClient.id;
      console.log(`Created new client: ${clientId} (${company_name})`);
    }

    // Save intake data
    const { error: intakeError } = await supabase
      .from('client_intake')
      .upsert({
        client_id: clientId,
        contact_name: contact_name || null,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        fund_type: fund_type || null,
        raise_amount: raise_amount || null,
        timeline: timeline || null,
        min_investment: min_investment || null,
        target_investor: target_investor || null,
        pitch_deck_link: pitch_deck_link || null,
        pitch_deck_path: pitch_deck_path || null,
        budget_mode: budget_mode || 'monthly',
        budget_amount: budget_amount || null,
        investor_list_path: investor_list_path || null,
        brand_notes: brand_notes || null,
        additional_notes: additional_notes || null,
        kickoff_date: kickoff_date || null,
        kickoff_time: kickoff_time || null,
        status: 'submitted',
      }, { onConflict: 'client_id' });

    if (intakeError) {
      console.error('Intake save error:', intakeError);
      // Non-fatal — continue
    }

    // Seed onboarding tasks (only if none exist yet)
    const { data: existingTasks } = await supabase
      .from('client_onboarding_tasks')
      .select('id')
      .eq('client_id', clientId)
      .limit(1);

    if (!existingTasks || existingTasks.length === 0) {
      const templates = resolvedClientType === 'ECOM' ? ECOM_TASKS : CAPITAL_RAISING_TASKS;
      const taskRows = templates.map(t => ({
        client_id: clientId,
        category: t.category,
        title: t.title,
        sort_order: t.sort_order,
        completed: false,
      }));

      const { error: taskError } = await supabase
        .from('client_onboarding_tasks')
        .insert(taskRows);

      if (taskError) {
        console.error('Task seeding error:', taskError);
      } else {
        console.log(`Seeded ${taskRows.length} onboarding tasks for ${company_name}`);
      }
    }

    // Also create initial project management tasks
    const initialTasks = [
      { title: `Onboarding Kickoff - ${company_name}`, priority: 'high', status: 'todo', stage: 'to-do' },
      { title: `Collect Brand Assets - ${company_name}`, priority: 'medium', status: 'todo', stage: 'to-do' },
      { title: `Research & Positioning - ${company_name}`, priority: 'medium', status: 'todo', stage: 'to-do' },
      { title: `Create Quiz Funnel - ${company_name}`, priority: 'medium', status: 'todo', stage: 'to-do' },
      { title: `Ad Creatives - ${company_name}`, priority: 'medium', status: 'todo', stage: 'to-do' },
    ];

    const { error: pmTaskError } = await supabase
      .from('tasks')
      .insert(initialTasks.map(t => ({
        client_id: clientId,
        title: t.title,
        priority: t.priority,
        status: t.status,
        stage: t.stage,
        visible_to_client: true,
      })));

    if (pmTaskError) {
      console.error('PM task creation error:', pmTaskError);
    } else {
      console.log(`Created ${initialTasks.length} PM tasks for ${company_name}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        client_id: clientId,
        slug,
        message: `Client "${company_name}" onboarded successfully`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Onboard client error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
