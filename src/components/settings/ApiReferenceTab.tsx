import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const API_ENDPOINT = 'https://jgwwmtuvjlmzapwqiabu.supabase.co/functions/v1/external-data-api';
const PASSWORD = 'HPA1234$';

interface ApiCall {
  title: string;
  description: string;
  body: Record<string, unknown>;
}

interface ApiSection {
  title: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  calls: ApiCall[];
}

const API_SECTIONS: ApiSection[] = [
  {
    title: '🔍 Discovery',
    calls: [
      {
        title: 'List All Tables & Actions',
        description: 'Returns all allowed tables, buckets, relations, and composite action schemas.',
        body: { password: PASSWORD, action: 'list_tables' },
      },
    ],
  },
  {
    title: '📋 Read Data (SELECT)',
    calls: [
      {
        title: 'Select All Clients',
        description: 'Fetch all clients with basic info, API keys, GHL locations, Meta tokens.',
        body: {
          password: PASSWORD, action: 'select', table: 'clients',
          select_columns: 'id,name,slug,status,client_type,ghl_location_id,ghl_api_key,meta_ad_account_id,meta_access_token,business_manager_url,website_url,logo_url,brand_colors,brand_fonts,description,offer_description,product_url,hubspot_portal_id,hubspot_access_token',
          limit: 100,
        },
      },
      {
        title: 'Select Leads (Filtered)',
        description: 'Fetch leads for a specific client with date filter.',
        body: {
          password: PASSWORD, action: 'select', table: 'leads',
          filters: { client_id: '<CLIENT_UUID>', created_at: { op: 'gte', value: '2026-01-01' } },
          order_by: 'created_at', order_dir: 'desc', limit: 50,
        },
      },
      {
        title: 'Select Calls with Filters',
        description: 'Fetch calls that showed, ordered by date.',
        body: {
          password: PASSWORD, action: 'select', table: 'calls',
          filters: { client_id: '<CLIENT_UUID>', showed: true },
          order_by: 'booked_at', order_dir: 'desc', limit: 50,
        },
      },
      {
        title: 'Select Funded Investors',
        description: 'Get funded investors for a client.',
        body: {
          password: PASSWORD, action: 'select', table: 'funded_investors',
          filters: { client_id: '<CLIENT_UUID>' },
          order_by: 'funded_at', order_dir: 'desc',
        },
      },
      {
        title: 'Select Daily Metrics',
        description: 'Get daily performance metrics (ad spend, leads, calls, funded, etc.).',
        body: {
          password: PASSWORD, action: 'select', table: 'daily_metrics',
          filters: { client_id: '<CLIENT_UUID>', date: { op: 'gte', value: '2026-01-01' } },
          order_by: 'date', order_dir: 'desc',
        },
      },
      {
        title: 'Select Client Settings',
        description: 'Get thresholds, pipeline IDs, calendar IDs, webhook mappings.',
        body: {
          password: PASSWORD, action: 'select', table: 'client_settings',
          filters: { client_id: '<CLIENT_UUID>' },
        },
      },
      {
        title: 'Select Agency Members',
        description: 'List all team members with their pod info.',
        body: {
          password: PASSWORD, action: 'select', table: 'agency_members',
          include: ['pod'],
        },
      },
      {
        title: 'Count Records',
        description: 'Count leads for a specific client.',
        body: {
          password: PASSWORD, action: 'count', table: 'leads',
          filters: { client_id: '<CLIENT_UUID>' },
        },
      },
    ],
  },
  {
    title: '📊 Meta Ads (Internal DB)',
    badge: 'Composite',
    calls: [
      {
        title: 'Get Ads Overview (Campaigns → Ad Sets → Ads)',
        description: 'Full Meta ads hierarchy with aggregated spend & attribution metrics.',
        body: {
          password: PASSWORD, action: 'get_ads_overview',
          client_id: '<CLIENT_UUID>',
          status: 'ACTIVE',
          date_start: '2026-01-01',
          date_end: '2026-03-23',
        },
      },
      {
        title: 'Select Campaigns',
        description: 'List campaigns with nested ad sets.',
        body: {
          password: PASSWORD, action: 'select', table: 'meta_campaigns',
          filters: { client_id: '<CLIENT_UUID>' },
          include: ['ad_sets', 'client'],
          order_by: 'spend', order_dir: 'desc',
        },
      },
      {
        title: 'Select Ad Sets',
        description: 'List ad sets with nested ads.',
        body: {
          password: PASSWORD, action: 'select', table: 'meta_ad_sets',
          filters: { client_id: '<CLIENT_UUID>' },
          include: ['ads', 'campaign'],
        },
      },
      {
        title: 'Select Individual Ads',
        description: 'List ads with ad set and client info.',
        body: {
          password: PASSWORD, action: 'select', table: 'meta_ads',
          filters: { client_id: '<CLIENT_UUID>' },
          include: ['ad_set', 'client'],
        },
      },
    ],
  },
  {
    title: '📡 Meta Graph API (Live)',
    badge: 'External',
    calls: [
      {
        title: 'Get Campaign Insights (Graph API)',
        description: 'Direct call to Meta Graph API for live insights. Requires client meta_access_token from clients table.',
        body: {
          _note: 'This is a direct GET request to Meta, NOT through the Jarvis API.',
          method: 'GET',
          url: 'https://graph.facebook.com/v21.0/act_<AD_ACCOUNT_ID>/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,insights.date_preset(last_30d){spend,impressions,clicks,ctr,cpc,cpm,actions,cost_per_action_type}&access_token=<META_ACCESS_TOKEN>',
        },
      },
      {
        title: 'Get Ad Set Insights (Graph API)',
        description: 'Live ad set data from Meta. Replace placeholders with values from clients table.',
        body: {
          _note: 'Direct GET to Meta Graph API.',
          method: 'GET',
          url: 'https://graph.facebook.com/v21.0/act_<AD_ACCOUNT_ID>/adsets?fields=id,name,status,targeting,bid_strategy,daily_budget,insights.date_preset(last_30d){spend,impressions,clicks,ctr,actions}&access_token=<META_ACCESS_TOKEN>',
        },
      },
      {
        title: 'Get Ad Creative Previews (Graph API)',
        description: 'Fetch ad previews and creative data from Meta.',
        body: {
          _note: 'Direct GET to Meta Graph API.',
          method: 'GET',
          url: 'https://graph.facebook.com/v21.0/act_<AD_ACCOUNT_ID>/ads?fields=id,name,status,creative{title,body,image_url,thumbnail_url,video_id,call_to_action_type,object_story_spec},insights.date_preset(last_7d){spend,impressions,clicks}&access_token=<META_ACCESS_TOKEN>',
        },
      },
      {
        title: 'Token Validation',
        description: 'Check if a Meta access token is still valid before making API calls.',
        body: {
          _note: 'Direct GET to Meta Graph API. If status 200, token is valid. Error code 190 = expired.',
          method: 'GET',
          url: 'https://graph.facebook.com/v21.0/me?access_token=<META_ACCESS_TOKEN>',
        },
      },
    ],
  },
  {
    title: '✅ Tasks (Full CRUD)',
    badge: 'Composite',
    calls: [
      {
        title: 'Create Task (with Assignees, Subtasks, Comments)',
        description: 'One-call task creation with full metadata.',
        body: {
          password: PASSWORD, action: 'create_task',
          task: {
            title: 'Launch Campaign',
            description: 'Full launch preparation',
            client_id: '<CLIENT_UUID>',
            priority: 'high',
            stage: 'backlog',
            status: 'todo',
            due_date: '2026-03-01',
            recurrence_type: 'weekly',
            recurrence_interval: 1,
            created_by: 'api',
          },
          assignees: [
            { member_id: '<MEMBER_UUID>' },
            { pod_id: '<POD_UUID>' },
          ],
          subtasks: [
            { title: 'Design assets', priority: 'medium', due_date: '2026-02-25' },
            { title: 'Write copy' },
          ],
          comments: [
            { author_name: 'PM', content: 'Kick-off notes', comment_type: 'text' },
          ],
        },
      },
      {
        title: 'Select Tasks (with Relations)',
        description: 'Get tasks with subtasks, assignees, comments, files, history.',
        body: {
          password: PASSWORD, action: 'select', table: 'tasks',
          filters: { status: 'todo' },
          include: ['assignees', 'subtasks', 'comments', 'files', 'history', 'notifications'],
          order_by: 'created_at', order_dir: 'desc', limit: 50,
        },
      },
      {
        title: 'Update Task',
        description: 'Update status, priority, or any field.',
        body: {
          password: PASSWORD, action: 'update', table: 'tasks',
          match: { id: '<TASK_UUID>' },
          data: { status: 'done', completed_at: '2026-02-20T00:00:00Z' },
        },
      },
      {
        title: 'Delete Task',
        description: 'Delete a task by ID.',
        body: {
          password: PASSWORD, action: 'delete', table: 'tasks',
          match: { id: '<TASK_UUID>' },
        },
      },
      {
        title: 'Add Comment to Task',
        description: 'Insert a comment on an existing task.',
        body: {
          password: PASSWORD, action: 'insert', table: 'task_comments',
          data: { task_id: '<TASK_UUID>', author_name: 'API', content: 'Status update', comment_type: 'text' },
        },
      },
      {
        title: 'Add Assignee to Task',
        description: 'Assign a member or pod to a task.',
        body: {
          password: PASSWORD, action: 'insert', table: 'task_assignees',
          data: { task_id: '<TASK_UUID>', member_id: '<MEMBER_UUID>' },
        },
      },
    ],
  },
  {
    title: '📝 Client Onboarding & Intake',
    calls: [
      {
        title: 'Select Client Intake',
        description: 'Get onboarding intake form data for a client.',
        body: {
          password: PASSWORD, action: 'select', table: 'client_intake',
          filters: { client_id: '<CLIENT_UUID>' },
        },
      },
      {
        title: 'Upsert Client Intake',
        description: 'Submit or update intake data (fund_type, raise_amount, timeline, budget, etc.).',
        body: {
          password: PASSWORD, action: 'upsert', table: 'client_intake',
          data: {
            client_id: '<CLIENT_UUID>',
            contact_name: 'John Doe',
            contact_email: 'john@fund.com',
            fund_type: 'Real Estate',
            raise_amount: '$10M',
            timeline: '6 months',
            min_investment: '$50,000',
            target_investor: 'Accredited individuals',
            budget_mode: 'monthly',
            budget_amount: '$15,000',
            brand_notes: 'Conservative branding',
            status: 'submitted',
          },
        },
      },
      {
        title: 'Select Onboarding Tasks',
        description: 'Get onboarding checklist items for a client.',
        body: {
          password: PASSWORD, action: 'select', table: 'client_onboarding_tasks',
          filters: { client_id: '<CLIENT_UUID>' },
          order_by: 'sort_order', order_dir: 'asc',
        },
      },
      {
        title: 'Select Generated Assets',
        description: 'Get AI-generated content (research, angles, emails, ad copy, scripts, etc.).',
        body: {
          password: PASSWORD, action: 'select', table: 'client_assets',
          filters: { client_id: '<CLIENT_UUID>' },
          order_by: 'created_at', order_dir: 'desc',
        },
      },
    ],
  },
  {
    title: '📊 Quiz Funnels & Submissions',
    calls: [
      {
        title: 'Select Quiz Funnels',
        description: 'Get quiz funnel configs for a client (questions, branding, calendar URL).',
        body: {
          password: PASSWORD, action: 'select', table: 'quiz_funnels',
          filters: { client_id: '<CLIENT_UUID>' },
        },
      },
      {
        title: 'Select Quiz Submissions',
        description: 'Get quiz submissions / leads from funnels.',
        body: {
          password: PASSWORD, action: 'select', table: 'quiz_submissions',
          filters: { client_id: '<CLIENT_UUID>' },
          order_by: 'created_at', order_dir: 'desc', limit: 100,
        },
      },
    ],
  },
  {
    title: '🎯 Client Offers',
    calls: [
      {
        title: 'Select Client Offers',
        description: 'Get offer pages/configurations for a client.',
        body: {
          password: PASSWORD, action: 'select', table: 'client_offers',
          filters: { client_id: '<CLIENT_UUID>' },
          include: ['client'],
        },
      },
    ],
  },
  {
    title: '✏️ Write Data',
    calls: [
      {
        title: 'Insert Record',
        description: 'Insert a lead into the database.',
        body: {
          password: PASSWORD, action: 'insert', table: 'leads',
          data: { client_id: '<CLIENT_UUID>', name: 'John Doe', email: 'john@example.com', source: 'facebook', external_id: 'ghl_123' },
        },
      },
      {
        title: 'Upsert Record',
        description: 'Insert or update daily metrics (matched by unique constraints).',
        body: {
          password: PASSWORD, action: 'upsert', table: 'daily_metrics',
          data: { client_id: '<CLIENT_UUID>', date: '2026-02-20', leads: 5, ad_spend: 250 },
        },
      },
      {
        title: 'Update Record',
        description: 'Update a specific record by match criteria.',
        body: {
          password: PASSWORD, action: 'update', table: 'clients',
          match: { id: '<CLIENT_UUID>' },
          data: { status: 'active', description: 'Updated via API' },
        },
      },
      {
        title: 'Delete Record',
        description: 'Delete a specific record.',
        body: {
          password: PASSWORD, action: 'delete', table: 'leads',
          match: { id: '<LEAD_UUID>' },
        },
      },
    ],
  },
  {
    title: '🗂️ Pipelines & Opportunities',
    calls: [
      {
        title: 'Select Pipelines with Stages',
        description: 'Get client pipelines with stage info.',
        body: {
          password: PASSWORD, action: 'select', table: 'client_pipelines',
          filters: { client_id: '<CLIENT_UUID>' },
          include: ['stages'],
        },
      },
      {
        title: 'Select Opportunities with Stage',
        description: 'Get pipeline opportunities.',
        body: {
          password: PASSWORD, action: 'select', table: 'pipeline_opportunities',
          include: ['stage'],
          order_by: 'updated_at', order_dir: 'desc',
        },
      },
    ],
  },
  {
    title: '🎨 Creatives',
    calls: [
      {
        title: 'Select Creatives',
        description: 'Get creatives with client info.',
        body: {
          password: PASSWORD, action: 'select', table: 'creatives',
          filters: { client_id: '<CLIENT_UUID>' },
          include: ['client'],
          order_by: 'created_at', order_dir: 'desc',
        },
      },
    ],
  },
  {
    title: '📁 Storage',
    calls: [
      {
        title: 'List Files in Bucket',
        description: 'List files in a storage bucket (creatives, task-files, gpt-files, live-ads, client-offers).',
        body: {
          password: PASSWORD, action: 'list_storage',
          bucket: 'creatives', file_path: '', limit: 100,
        },
      },
      {
        title: 'Get File URL',
        description: 'Get the public URL for a file.',
        body: {
          password: PASSWORD, action: 'get_file_url',
          bucket: 'task-files', file_path: 'path/to/file.pdf',
        },
      },
      {
        title: 'Upload File (Base64)',
        description: 'Upload a file using base64 encoded data.',
        body: {
          password: PASSWORD, action: 'upload_file_base64',
          bucket: 'creatives', file_path: 'client/image.png',
          data: '<BASE64_STRING>', content_type: 'image/png',
        },
      },
      {
        title: 'Upload File (Multipart)',
        description: 'Upload via multipart/form-data. Fields: password, bucket, file_path, file.',
        body: {
          _note: 'Use multipart/form-data content-type. File goes as "file" field.',
          password: PASSWORD,
          bucket: 'creatives',
          file_path: 'client-slug/image.png',
          file: '<FILE_BINARY>',
        },
      },
      {
        title: 'Delete File',
        description: 'Delete a file from storage.',
        body: {
          password: PASSWORD, action: 'delete_file',
          bucket: 'creatives', file_path: 'client/old-image.png',
        },
      },
    ],
  },
  {
    title: '👥 Team & Pods',
    calls: [
      {
        title: 'Select Agency Members',
        description: 'Get team members with pod assignments.',
        body: {
          password: PASSWORD, action: 'select', table: 'agency_members',
          include: ['pod'],
        },
      },
      {
        title: 'Select Pods',
        description: 'List all agency pods.',
        body: { password: PASSWORD, action: 'select', table: 'agency_pods' },
      },
      {
        title: 'Select Meetings',
        description: 'Get agency meetings.',
        body: {
          password: PASSWORD, action: 'select', table: 'agency_meetings',
          order_by: 'meeting_date', order_dir: 'desc', limit: 20,
        },
      },
    ],
  },
  {
    title: '🔄 Sync & Logs',
    calls: [
      {
        title: 'Select Sync Logs',
        description: 'Get sync history for a client.',
        body: {
          password: PASSWORD, action: 'select', table: 'sync_logs',
          filters: { client_id: '<CLIENT_UUID>' },
          order_by: 'started_at', order_dir: 'desc', limit: 20,
        },
      },
      {
        title: 'Select Webhook Logs',
        description: 'Get webhook processing logs.',
        body: {
          password: PASSWORD, action: 'select', table: 'webhook_logs',
          filters: { client_id: '<CLIENT_UUID>' },
          order_by: 'processed_at', order_dir: 'desc', limit: 50,
        },
      },
      {
        title: 'Select CSV Import Logs',
        description: 'Get CSV import history for a client.',
        body: {
          password: PASSWORD, action: 'select', table: 'csv_import_logs',
          filters: { client_id: '<CLIENT_UUID>' },
          order_by: 'created_at', order_dir: 'desc',
        },
      },
    ],
  },
  {
    title: '🤖 AI Hub & GPTs',
    calls: [
      {
        title: 'Select AI Conversations',
        description: 'Get AI hub conversations.',
        body: {
          password: PASSWORD, action: 'select', table: 'ai_hub_conversations',
          order_by: 'created_at', order_dir: 'desc', limit: 20,
        },
      },
      {
        title: 'Select Custom GPTs',
        description: 'Get custom GPT configurations.',
        body: { password: PASSWORD, action: 'select', table: 'custom_gpts' },
      },
      {
        title: 'Select Creative Briefs',
        description: 'Get creative briefs.',
        body: {
          password: PASSWORD, action: 'select', table: 'creative_briefs',
          order_by: 'created_at', order_dir: 'desc',
        },
      },
      {
        title: 'Select Ad Scripts',
        description: 'Get generated ad scripts.',
        body: {
          password: PASSWORD, action: 'select', table: 'ad_scripts',
          order_by: 'created_at', order_dir: 'desc',
        },
      },
    ],
  },
  {
    title: '⚙️ Configuration',
    calls: [
      {
        title: 'Select Agency Settings',
        description: 'Get agency-wide settings.',
        body: { password: PASSWORD, action: 'select', table: 'agency_settings' },
      },
      {
        title: 'Select Alert Configs',
        description: 'Get alert threshold configurations.',
        body: {
          password: PASSWORD, action: 'select', table: 'alert_configs',
          filters: { client_id: '<CLIENT_UUID>' },
        },
      },
      {
        title: 'Select Dashboard Preferences',
        description: 'Get saved dashboard preferences.',
        body: { password: PASSWORD, action: 'select', table: 'dashboard_preferences' },
      },
    ],
  },
];

const ALL_TABLES = [
  'clients', 'leads', 'calls', 'funded_investors', 'daily_metrics',
  'agency_members', 'agency_pods', 'agency_settings', 'agency_meetings',
  'tasks', 'task_comments', 'task_files', 'task_history', 'task_assignees', 'task_notifications',
  'creatives', 'client_settings', 'client_pipelines', 'client_custom_tabs',
  'client_funnel_steps', 'client_live_ads', 'client_pod_assignments', 'client_voice_notes',
  'client_offers', 'client_intake', 'client_assets', 'client_onboarding_tasks',
  'pipeline_stages', 'pipeline_opportunities', 'funnel_campaigns', 'funnel_step_variants',
  'ad_spend_reports', 'alert_configs', 'chat_conversations', 'chat_messages',
  'creative_briefs', 'ad_scripts',
  'ai_hub_conversations', 'ai_hub_messages', 'custom_gpts', 'gpt_files',
  'gpt_knowledge_base', 'knowledge_base_documents', 'csv_import_logs',
  'contact_timeline_events', 'data_discrepancies', 'sync_logs', 'sync_queue',
  'sync_outbound_events', 'pixel_verifications', 'pixel_expected_events',
  'email_parsed_investors', 'pending_meeting_tasks', 'member_activity_log',
  'dashboard_preferences', 'spam_blacklist', 'webhook_logs',
  'meta_campaigns', 'meta_ad_sets', 'meta_ads',
  'quiz_funnels', 'quiz_submissions',
];

const ALL_BUCKETS = ['creatives', 'task-files', 'gpt-files', 'live-ads', 'client-offers'];

function CopyBlock({ json }: { json: Record<string, unknown> }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(json, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-muted border border-border rounded-md p-3 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
        {text}
      </pre>
      <Button
        variant="outline"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );
}

function ApiCallCard({ call }: { call: ApiCall }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 px-3 hover:bg-muted/50 rounded-md transition-colors">
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        <div className="min-w-0">
          <span className="font-medium text-sm">{call.title}</span>
          <span className="text-xs text-muted-foreground ml-2">{call.description}</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-9 pr-3 pb-2">
        <CopyBlock json={call.body} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ApiReferenceTab() {
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(API_ENDPOINT);
    setCopiedEndpoint(true);
    toast.success('Endpoint copied');
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const handleCopyAll = async () => {
    let clientDirectory = '';
    try {
      const { supabase } = await import('@/integrations/supabase/db');

      const [clientsRes, settingsRes, funnelsRes] = await Promise.all([
        supabase.from('clients').select('id, name, slug, status, client_type, ghl_api_key, ghl_location_id, website_url, business_manager_url, meta_ad_account_id, meta_access_token, logo_url, brand_colors, brand_fonts, description, offer_description, product_url, hubspot_portal_id, hubspot_access_token').order('name'),
        supabase.from('client_settings').select('client_id, funded_pipeline_id, hubspot_funded_pipeline_id, ads_library_url, tracked_calendar_ids, reconnect_calendar_ids, funded_stage_ids, hubspot_funded_stage_ids, hubspot_committed_stage_ids, slack_channel_id, slack_webhook_url, meetgeek_enabled, meetgeek_api_key'),
        supabase.from('client_funnel_steps').select('client_id, name, url, sort_order').order('client_id').order('sort_order'),
      ]);

      const clients = clientsRes.data || [];
      const settings = settingsRes.data || [];
      const funnels = funnelsRes.data || [];

      const settingsMap = Object.fromEntries(settings.map(s => [s.client_id, s]));
      const funnelMap: Record<string, typeof funnels> = {};
      for (const f of funnels) {
        if (!funnelMap[f.client_id]) funnelMap[f.client_id] = [];
        funnelMap[f.client_id].push(f);
      }

      const dirLines: string[] = [];
      dirLines.push('## Client Directory (Master Admin — CONFIDENTIAL)');
      dirLines.push('');
      dirLines.push('> Each client entry includes all API keys, GHL locations, Meta tokens, and pipeline IDs needed for integration.');
      dirLines.push('');

      for (const c of clients) {
        const s = settingsMap[c.id];
        dirLines.push(`### ${c.name} [${c.status}] ${c.client_type ? `(${c.client_type})` : ''}`);
        dirLines.push(`- **Client ID**: \`${c.id}\``);
        if (c.slug) dirLines.push(`- **Slug**: ${c.slug}`);
        
        // GHL
        if (c.ghl_location_id) dirLines.push(`- **GHL Location ID**: \`${c.ghl_location_id}\``);
        if (c.ghl_api_key) dirLines.push(`- **GHL API Key**: \`${c.ghl_api_key}\``);
        
        // Meta
        if (c.meta_ad_account_id) dirLines.push(`- **Meta Ad Account ID**: \`${c.meta_ad_account_id}\``);
        if (c.meta_access_token) {
          const token = c.meta_access_token.substring(0, 20) + '...' + c.meta_access_token.slice(-10);
          dirLines.push(`- **Meta Access Token**: \`${token}\` (${c.meta_access_token.length} chars)`);
        }
        if (c.business_manager_url) dirLines.push(`- **Ads Manager URL**: ${c.business_manager_url}`);
        
        // HubSpot
        if (c.hubspot_portal_id) dirLines.push(`- **HubSpot Portal ID**: \`${c.hubspot_portal_id}\``);
        if (c.hubspot_access_token) {
          const ht = c.hubspot_access_token.substring(0, 15) + '...';
          dirLines.push(`- **HubSpot Token**: \`${ht}\``);
        }
        
        // Brand
        if (c.website_url) dirLines.push(`- **Website**: ${c.website_url}`);
        if (c.logo_url) dirLines.push(`- **Logo**: ${c.logo_url}`);
        if (c.description) dirLines.push(`- **Description**: ${c.description}`);
        if (c.offer_description) dirLines.push(`- **Offer**: ${c.offer_description}`);
        if (c.product_url) dirLines.push(`- **Product URL**: ${c.product_url}`);
        if (c.brand_colors?.length) dirLines.push(`- **Brand Colors**: ${c.brand_colors.join(', ')}`);
        if (c.brand_fonts?.length) dirLines.push(`- **Brand Fonts**: ${c.brand_fonts.join(', ')}`);
        
        // Settings
        if (s) {
          if (s.funded_pipeline_id) dirLines.push(`- **GHL Funded Pipeline ID**: \`${s.funded_pipeline_id}\``);
          if (s.funded_stage_ids?.length) dirLines.push(`- **Funded Stage IDs**: ${JSON.stringify(s.funded_stage_ids)}`);
          if (s.hubspot_funded_pipeline_id) dirLines.push(`- **HubSpot Funded Pipeline**: \`${s.hubspot_funded_pipeline_id}\``);
          if (s.hubspot_funded_stage_ids?.length) dirLines.push(`- **HubSpot Funded Stages**: ${JSON.stringify(s.hubspot_funded_stage_ids)}`);
          if (s.hubspot_committed_stage_ids?.length) dirLines.push(`- **HubSpot Committed Stages**: ${JSON.stringify(s.hubspot_committed_stage_ids)}`);
          if (s.tracked_calendar_ids?.length) dirLines.push(`- **Tracked Calendar IDs**: ${JSON.stringify(s.tracked_calendar_ids)}`);
          if (s.reconnect_calendar_ids?.length) dirLines.push(`- **Reconnect Calendar IDs**: ${JSON.stringify(s.reconnect_calendar_ids)}`);
          if (s.ads_library_url) dirLines.push(`- **Ads Library**: ${s.ads_library_url}`);
          if (s.slack_channel_id) dirLines.push(`- **Slack Channel**: \`${s.slack_channel_id}\``);
          if (s.slack_webhook_url) dirLines.push(`- **Slack Webhook**: ${s.slack_webhook_url}`);
          if (s.meetgeek_enabled) dirLines.push(`- **MeetGeek**: Enabled`);
        }
        
        const clientFunnels = funnelMap[c.id];
        if (clientFunnels?.length) {
          dirLines.push(`- **Funnel Pages**:`);
          for (const f of clientFunnels) {
            dirLines.push(`  - ${f.name}: ${f.url}`);
          }
        }
        dirLines.push('');
      }
      
      clientDirectory = dirLines.join('\n');
    } catch (err) {
      console.error('Failed to fetch client data for copy:', err);
      clientDirectory = '## Client Directory\n(Failed to load — try again)\n';
    }

    const lines: string[] = [];
    lines.push('# OpenClaw / Jarvis API Reference');
    lines.push('');
    lines.push(`## Endpoint`);
    lines.push(`POST ${API_ENDPOINT}`);
    lines.push('');
    lines.push(`## Authentication`);
    lines.push(`Password: ${PASSWORD}`);
    lines.push('All requests are POST with JSON body. Every request must include the "password" field.');
    lines.push('');
    lines.push('## Filter Operators');
    lines.push('eq (default), gt, gte, lt, lte, neq, like, ilike, in, is');
    lines.push('Usage: {"field": {"op": "gte", "value": "2026-01-01"}}');
    lines.push('Array shorthand: {"field": ["value1", "value2"]} => IN filter');
    lines.push('Null check: {"field": null} => IS NULL');
    lines.push('');
    lines.push('## Select Options');
    lines.push('- `select_columns`: Comma-separated columns to return (default: "*")');
    lines.push('- `include`: Array of relation names to join (see list_tables for available relations per table)');
    lines.push('- `order_by`: Column name to sort by');
    lines.push('- `order_dir`: "asc" or "desc"');
    lines.push('- `limit`: Max rows (default 1000)');
    lines.push('- `offset`: Skip rows for pagination');
    lines.push('');

    // Meta Graph API section
    lines.push('## Meta Graph API (Direct — Live Data)');
    lines.push('');
    lines.push('For live Meta Ads data, make direct GET requests to the Graph API using each client\'s `meta_access_token` and `meta_ad_account_id` from the clients table.');
    lines.push('');
    lines.push('### Campaign Insights');
    lines.push('```');
    lines.push('GET https://graph.facebook.com/v21.0/act_{AD_ACCOUNT_ID}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,insights.date_preset(last_30d){spend,impressions,clicks,ctr,cpc,cpm,actions,cost_per_action_type}&access_token={TOKEN}');
    lines.push('```');
    lines.push('');
    lines.push('### Ad Set Insights');
    lines.push('```');
    lines.push('GET https://graph.facebook.com/v21.0/act_{AD_ACCOUNT_ID}/adsets?fields=id,name,status,targeting,bid_strategy,daily_budget,insights.date_preset(last_30d){spend,impressions,clicks,ctr,actions}&access_token={TOKEN}');
    lines.push('```');
    lines.push('');
    lines.push('### Ad Creative Previews');
    lines.push('```');
    lines.push('GET https://graph.facebook.com/v21.0/act_{AD_ACCOUNT_ID}/ads?fields=id,name,status,creative{title,body,image_url,thumbnail_url,video_id,call_to_action_type},insights.date_preset(last_7d){spend,impressions,clicks}&access_token={TOKEN}');
    lines.push('```');
    lines.push('');
    lines.push('### Token Validation');
    lines.push('```');
    lines.push('GET https://graph.facebook.com/v21.0/me?access_token={TOKEN}');
    lines.push('```');
    lines.push('Error code 190 = expired token. Regenerate in Meta Business Manager.');
    lines.push('');

    // Client directory with all keys
    lines.push(clientDirectory);

    for (const section of API_SECTIONS) {
      lines.push(`## ${section.title}${section.badge ? ` [${section.badge}]` : ''}`);
      lines.push('');
      for (const call of section.calls) {
        lines.push(`### ${call.title}`);
        lines.push(call.description);
        lines.push('```json');
        lines.push(JSON.stringify(call.body, null, 2));
        lines.push('```');
        lines.push('');
      }
    }

    lines.push('## All Available Tables');
    lines.push(ALL_TABLES.join(', '));
    lines.push('');
    lines.push('## Storage Buckets');
    lines.push(ALL_BUCKETS.join(', '));
    lines.push('');
    lines.push('## Available Actions');
    lines.push('list_tables, select, count, insert, upsert, update, delete, create_task, get_ads_overview, list_storage, get_file_url, delete_file, upload_file_base64');
    lines.push('');
    lines.push('## Available Relations (include parameter)');
    lines.push('- tasks: subtasks, assignees, comments, files, history, notifications');
    lines.push('- creatives: client');
    lines.push('- pipeline_opportunities: stage');
    lines.push('- client_pipelines: stages');
    lines.push('- agency_members: pod');
    lines.push('- task_assignees: member, pod');
    lines.push('- meta_campaigns: ad_sets, client');
    lines.push('- meta_ad_sets: ads, campaign, client');
    lines.push('- meta_ads: ad_set, client');
    lines.push('- client_offers: client');

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedAll(true);
    toast.success('Full API reference copied to clipboard');
    setTimeout(() => setCopiedAll(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Copy All Banner */}
      <div className="flex items-center justify-between border-2 border-primary/30 bg-primary/5 rounded-md p-3">
        <div>
          <h4 className="font-medium text-sm">Full API Documentation</h4>
          <p className="text-xs text-muted-foreground">Copy the entire API reference to paste into OpenClaw</p>
        </div>
        <Button variant="default" size="sm" onClick={handleCopyAll} className="shrink-0">
          {copiedAll ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copiedAll ? 'Copied!' : 'Copy All'}
        </Button>
      </div>

      {/* Endpoint */}
      <div className="border-2 border-border p-4 space-y-2">
        <h4 className="font-medium text-sm">API Endpoint</h4>
        <p className="text-xs text-muted-foreground">All requests are POST with JSON body. Every request must include the password field.</p>
        <div className="flex gap-2 items-center">
          <code className="bg-muted border border-border rounded px-2 py-1 text-xs font-mono flex-1 truncate">
            POST {API_ENDPOINT}
          </code>
          <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopyEndpoint}>
            {copiedEndpoint ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Filter Operators Reference */}
      <div className="border border-border p-3 rounded-md bg-muted/30">
        <h4 className="font-medium text-xs mb-1">Filter Operators</h4>
        <div className="flex flex-wrap gap-1">
          {['eq (default)', 'gt', 'gte', 'lt', 'lte', 'neq', 'like', 'ilike', 'in', 'is'].map(op => (
            <Badge key={op} variant="outline" className="text-[10px] font-mono">{op}</Badge>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Usage: <code className="bg-muted px-1 rounded">{'{"field": {"op": "gte", "value": "2026-01-01"}}'}</code>
        </p>
        <p className="text-[10px] text-muted-foreground">
          Array: <code className="bg-muted px-1 rounded">{'{"field": ["val1", "val2"]}'}</code> → IN filter
        </p>
      </div>

      {/* Sections */}
      {API_SECTIONS.map((section) => (
        <div key={section.title} className="border-2 border-border rounded-md">
          <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
            <h4 className="font-medium text-sm">{section.title}</h4>
            {section.badge && <Badge variant="secondary" className="text-[10px]">{section.badge}</Badge>}
          </div>
          <div className="divide-y divide-border/50">
            {section.calls.map((call) => (
              <ApiCallCard key={call.title} call={call} />
            ))}
          </div>
        </div>
      ))}

      {/* Available Tables */}
      <div className="border border-border p-3 rounded-md bg-muted/30">
        <h4 className="font-medium text-xs mb-2">All Available Tables ({ALL_TABLES.length})</h4>
        <div className="flex flex-wrap gap-1">
          {ALL_TABLES.map(t => (
            <Badge key={t} variant="outline" className="text-[10px] font-mono">{t}</Badge>
          ))}
        </div>
      </div>

      {/* Storage Buckets */}
      <div className="border border-border p-3 rounded-md bg-muted/30">
        <h4 className="font-medium text-xs mb-2">Storage Buckets</h4>
        <div className="flex flex-wrap gap-1">
          {ALL_BUCKETS.map(b => (
            <Badge key={b} variant="secondary" className="text-[10px] font-mono">{b}</Badge>
          ))}
        </div>
      </div>

      {/* Relations */}
      <div className="border border-border p-3 rounded-md bg-muted/30">
        <h4 className="font-medium text-xs mb-2">Available Relations (include parameter)</h4>
        <div className="text-xs font-mono space-y-0.5">
          <p><span className="text-primary">tasks</span>: subtasks, assignees, comments, files, history, notifications</p>
          <p><span className="text-primary">creatives</span>: client</p>
          <p><span className="text-primary">meta_campaigns</span>: ad_sets, client</p>
          <p><span className="text-primary">meta_ad_sets</span>: ads, campaign, client</p>
          <p><span className="text-primary">meta_ads</span>: ad_set, client</p>
          <p><span className="text-primary">client_pipelines</span>: stages</p>
          <p><span className="text-primary">pipeline_opportunities</span>: stage</p>
          <p><span className="text-primary">agency_members</span>: pod</p>
          <p><span className="text-primary">task_assignees</span>: member, pod</p>
          <p><span className="text-primary">client_offers</span>: client</p>
        </div>
      </div>
    </div>
  );
}
