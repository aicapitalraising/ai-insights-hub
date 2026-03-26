export interface TaskTemplateItem {
  title: string;
  category: string;
  assignees: string[];
  priority: 'low' | 'medium' | 'high';
  sort_order: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  tasks: TaskTemplateItem[];
}

export const CAPITAL_RAISING_TEMPLATE: TaskTemplate = {
  id: 'capital-raising-2025',
  name: 'Capital Raising (2025)',
  description: '31 tasks across Client Setup, CRM, Ads, and Creatives',
  tasks: [
    // Client Setup / Requests
    { title: 'Domain DNS Access', category: 'Client Setup / Requests', assignees: ['Emily'], priority: 'high', sort_order: 1 },
    { title: 'Connect Calendar with GHL', category: 'Client Setup / Requests', assignees: ['Emily'], priority: 'high', sort_order: 2 },
    { title: 'Download Phone App for GoHighLevel', category: 'Client Setup / Requests', assignees: ['Emily'], priority: 'medium', sort_order: 3 },
    { title: 'Setup Availability', category: 'Client Setup / Requests', assignees: ['Emily'], priority: 'high', sort_order: 4 },
    { title: 'Meta Ad Account Access', category: 'Client Setup / Requests', assignees: ['Emily'], priority: 'high', sort_order: 5 },
    { title: 'Add team members to GHL based on emails & numbers provided', category: 'Client Setup / Requests', assignees: ['Louie Avila', 'Emily', 'Gled'], priority: 'high', sort_order: 6 },
    { title: 'Purchase Phone Number with Person Identification', category: 'Client Setup / Requests', assignees: ['Emily'], priority: 'high', sort_order: 7 },
    { title: 'Ad / FAQ Videos', category: 'Client Setup / Requests', assignees: ['Emily'], priority: 'low', sort_order: 8 },
    { title: 'Add $97/month Subscription to NK Account (If using our platform)', category: 'Client Setup / Requests', assignees: ['Emily'], priority: 'medium', sort_order: 9 },
    { title: 'Client to Purchase Phone Number & ID Verification', category: 'Client Setup / Requests', assignees: ['Emily'], priority: 'medium', sort_order: 10 },
    { title: 'Create TEAMGPT folder in AI Capital Raising', category: 'Client Setup / Requests', assignees: ['Emily'], priority: 'medium', sort_order: 11 },

    // CRM
    { title: 'Set-Up For A2P & Phone Number', category: 'CRM', assignees: ['Louie Avila', 'Gled'], priority: 'high', sort_order: 12 },
    { title: 'Reporting Setup - Google Sheets', category: 'CRM', assignees: ['Louie Avila', 'Gled'], priority: 'low', sort_order: 13 },
    { title: 'Funnel Setup', category: 'CRM', assignees: ['Louie Avila', 'Gled'], priority: 'high', sort_order: 14 },
    { title: 'Communicate Status of Setup Completion', category: 'CRM', assignees: ['Louie Avila', 'Gled'], priority: 'high', sort_order: 15 },
    { title: 'Phase 2 (1 Week Out After Launch)', category: 'CRM', assignees: ['Louie Avila', 'Gled'], priority: 'low', sort_order: 16 },
    { title: 'VSL Creation (ONLY IF NOT PROVIDED)', category: 'CRM', assignees: ['Louie Avila', 'Gled'], priority: 'high', sort_order: 17 },

    // Ads
    { title: 'Pixel is Setup on Funnel', category: 'Ads', assignees: ['Bill Media Buyer'], priority: 'medium', sort_order: 18 },
    { title: 'Setup Lead Form - DQ Non Accredited', category: 'Ads', assignees: ['Bill Media Buyer'], priority: 'medium', sort_order: 19 },
    { title: 'Create Ad Campaign with Copy & Creatives', category: 'Ads', assignees: ['Bill Media Buyer'], priority: 'medium', sort_order: 20 },
    { title: 'Launch Final Lead Gen - Ad Campaign After Approval', category: 'Ads', assignees: ['Bill Media Buyer'], priority: 'medium', sort_order: 21 },
    { title: 'Setup Business Portfolio or Get Access', category: 'Ads', assignees: ['Bill Media Buyer'], priority: 'medium', sort_order: 22 },
    { title: 'Setup Ad Account with Billing', category: 'Ads', assignees: ['Bill Media Buyer'], priority: 'medium', sort_order: 23 },
    { title: 'Ad Account Warm Up Completed', category: 'Ads', assignees: ['Bill Media Buyer'], priority: 'medium', sort_order: 24 },
    { title: 'Setup Audiences on Meta', category: 'Ads', assignees: ['Bill Media Buyer'], priority: 'high', sort_order: 25 },
    { title: 'Review Copy & Creatives', category: 'Ads', assignees: ['Bill Media Buyer', 'Coleton'], priority: 'medium', sort_order: 26 },
    { title: 'Credit Card is on File (spending limit is good)', category: 'Ads', assignees: ['Bill Media Buyer'], priority: 'medium', sort_order: 27 },
    { title: 'API Meta Ads Setup', category: 'Ads', assignees: ['Bill Media Buyer'], priority: 'medium', sort_order: 28 },
    { title: 'Make Sure Comment Guard is setup with MODERATION & AGENT', category: 'Ads', assignees: ['Bill Media Buyer'], priority: 'medium', sort_order: 29 },

    // Creatives
    { title: 'Create 20 Creatives for Fund', category: 'Creatives', assignees: ['Floramie', 'Gled'], priority: 'high', sort_order: 30 },
    { title: 'Create 2 Video Ads', category: 'Creatives', assignees: ['Floramie'], priority: 'medium', sort_order: 31 },
  ],
};

export const ECOM_TEMPLATE: TaskTemplate = {
  id: 'ecom-2025',
  name: 'E-Commerce',
  description: '13 tasks for e-commerce client onboarding',
  tasks: [
    { title: 'Domain & hosting configured', category: 'Client Setup', assignees: [], priority: 'high', sort_order: 1 },
    { title: 'Meta Ad Account access granted', category: 'Client Setup', assignees: [], priority: 'high', sort_order: 2 },
    { title: 'Meta Pixel installed', category: 'Client Setup', assignees: [], priority: 'high', sort_order: 3 },
    { title: 'Business Manager access granted', category: 'Client Setup', assignees: [], priority: 'high', sort_order: 4 },
    { title: 'Reporting dashboard connected', category: 'System Config', assignees: [], priority: 'medium', sort_order: 5 },
    { title: 'Slack channel mapped', category: 'System Config', assignees: [], priority: 'medium', sort_order: 6 },
    { title: 'Product catalog set up', category: 'Funnel & Creative', assignees: [], priority: 'high', sort_order: 7 },
    { title: 'Brand assets collected', category: 'Funnel & Creative', assignees: [], priority: 'medium', sort_order: 8 },
    { title: 'Ad creatives designed & approved', category: 'Funnel & Creative', assignees: [], priority: 'high', sort_order: 9 },
    { title: 'Ad copy written & approved', category: 'Funnel & Creative', assignees: [], priority: 'medium', sort_order: 10 },
    { title: 'Target audiences built', category: 'Media Buying', assignees: [], priority: 'high', sort_order: 11 },
    { title: 'Campaign structure created', category: 'Media Buying', assignees: [], priority: 'high', sort_order: 12 },
    { title: 'Campaign launched', category: 'Media Buying', assignees: [], priority: 'high', sort_order: 13 },
  ],
};

export const ALL_TASK_TEMPLATES: TaskTemplate[] = [
  CAPITAL_RAISING_TEMPLATE,
  ECOM_TEMPLATE,
];

export function getTaskTemplateById(id: string): TaskTemplate | undefined {
  return ALL_TASK_TEMPLATES.find(t => t.id === id);
}
