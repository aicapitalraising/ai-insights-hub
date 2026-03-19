export type ClientType = 'ecom' | 'capital_raising';

export interface TaskTemplate {
  category: string;
  title: string;
  sort_order: number;
}

export const CAPITAL_RAISING_TASKS: TaskTemplate[] = [
  // Client Setup / Requests
  { category: 'Client Setup / Requests', title: 'Domain DNS Access', sort_order: 1 },
  { category: 'Client Setup / Requests', title: 'Connect Calendar with GHL', sort_order: 2 },
  { category: 'Client Setup / Requests', title: 'Download Phone App for GoHighLevel', sort_order: 3 },
  { category: 'Client Setup / Requests', title: 'Setup Availability', sort_order: 4 },
  { category: 'Client Setup / Requests', title: 'Meta Ad Account Access', sort_order: 5 },
  { category: 'Client Setup / Requests', title: 'Add team members into GHL (emails & numbers)', sort_order: 6 },
  { category: 'Client Setup / Requests', title: 'Purchase Phone Number with Person Identification', sort_order: 7 },
  { category: 'Client Setup / Requests', title: 'Add / FAQ Videos', sort_order: 8 },
  { category: 'Client Setup / Requests', title: 'Add $97/month Subscription to Account', sort_order: 9 },
  { category: 'Client Setup / Requests', title: 'Client to Purchase Phone Number & ID Verification', sort_order: 10 },
  { category: 'Client Setup / Requests', title: 'Create TeamGPT Folder in AI Capital Raising', sort_order: 11 },
  { category: 'Client Setup / Requests', title: 'Ensure Comment Guard is Setup with Moderation & Agent', sort_order: 12 },

  // CRM / Funnel / System Setup
  { category: 'CRM / Funnel / System Setup', title: 'Set-Up for A2P & Phone Numbers', sort_order: 13 },
  { category: 'CRM / Funnel / System Setup', title: 'Reporting Setup (Google Sheets)', sort_order: 14 },
  { category: 'CRM / Funnel / System Setup', title: 'Funnel Setup', sort_order: 15 },
  { category: 'CRM / Funnel / System Setup', title: 'Communicate Status of Setup Completion', sort_order: 16 },
  { category: 'CRM / Funnel / System Setup', title: 'Phase 2 (1 Week After Launch)', sort_order: 17 },
  { category: 'CRM / Funnel / System Setup', title: 'VSL Creation (ONLY if not provided)', sort_order: 18 },

  // Ads (Media Buying)
  { category: 'Ads (Media Buying)', title: 'Pixel Setup on Funnel', sort_order: 19 },
  { category: 'Ads (Media Buying)', title: 'Setup Lead Form (DQ Non-Accredited)', sort_order: 20 },
  { category: 'Ads (Media Buying)', title: 'Create Ad Campaign with Copy & Creatives', sort_order: 21 },
  { category: 'Ads (Media Buying)', title: 'Launch Final Lead Gen Campaign After Approval', sort_order: 22 },
  { category: 'Ads (Media Buying)', title: 'Setup Business Portfolio or Get Access', sort_order: 23 },
  { category: 'Ads (Media Buying)', title: 'Setup Ad Account with Billing', sort_order: 24 },
  { category: 'Ads (Media Buying)', title: 'Ad Account Warm-Up Completed', sort_order: 25 },
  { category: 'Ads (Media Buying)', title: 'Setup Audiences on Meta', sort_order: 26 },
  { category: 'Ads (Media Buying)', title: 'Review Copy & Creatives', sort_order: 27 },
  { category: 'Ads (Media Buying)', title: 'Credit Card is on File (spending limit is good)', sort_order: 28 },
  { category: 'Ads (Media Buying)', title: 'Call Meta Ads Setup', sort_order: 29 },

  // Creatives
  { category: 'Creatives', title: 'Create 15 Creatives for Fund', sort_order: 30 },
  { category: 'Creatives', title: 'Create 4 AI Avatar Video Ads', sort_order: 31 },
];

export const ECOM_TASKS: TaskTemplate[] = [
  // Placeholder — can be populated later
];

export function getTasksForType(type: ClientType): TaskTemplate[] {
  switch (type) {
    case 'capital_raising': return CAPITAL_RAISING_TASKS;
    case 'ecom': return ECOM_TASKS;
    default: return [];
  }
}
