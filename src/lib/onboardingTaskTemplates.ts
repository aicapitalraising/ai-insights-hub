export interface OnboardingTaskTemplate {
  category: string;
  title: string;
  sort_order: number;
}

export const CAPITAL_RAISING_TASKS: OnboardingTaskTemplate[] = [
  // Client Setup
  { category: 'Client Setup', title: 'DNS & Domain configured', sort_order: 1 },
  { category: 'Client Setup', title: 'GHL sub-account created', sort_order: 2 },
  { category: 'Client Setup', title: 'GHL API key saved', sort_order: 3 },
  { category: 'Client Setup', title: 'Meta Ad Account access granted', sort_order: 4 },
  { category: 'Client Setup', title: 'Meta Pixel installed', sort_order: 5 },
  { category: 'Client Setup', title: 'Business Manager access granted', sort_order: 6 },
  // System Configuration
  { category: 'System Config', title: 'Reporting dashboard connected', sort_order: 7 },
  { category: 'System Config', title: 'Calendar IDs mapped', sort_order: 8 },
  { category: 'System Config', title: 'Pipeline stages configured', sort_order: 9 },
  { category: 'System Config', title: 'Slack channel mapped', sort_order: 10 },
  { category: 'System Config', title: 'Webhook integrations set up', sort_order: 11 },
  // Funnel & Creative
  { category: 'Funnel & Creative', title: 'Quiz funnel created', sort_order: 12 },
  { category: 'Funnel & Creative', title: 'Thank-you / booking page live', sort_order: 13 },
  { category: 'Funnel & Creative', title: 'Brand assets collected (logo, colors, fonts)', sort_order: 14 },
  { category: 'Funnel & Creative', title: 'Ad creatives designed & approved', sort_order: 15 },
  { category: 'Funnel & Creative', title: 'Ad copy written & approved', sort_order: 16 },
  // Media Buying
  { category: 'Media Buying', title: 'Target audiences built', sort_order: 17 },
  { category: 'Media Buying', title: 'Campaign structure created', sort_order: 18 },
  { category: 'Media Buying', title: 'Conversion events configured', sort_order: 19 },
  { category: 'Media Buying', title: 'Campaign launched', sort_order: 20 },
];

export const ECOM_TASKS: OnboardingTaskTemplate[] = [
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

export function getTemplatesForClientType(clientType?: string | null): OnboardingTaskTemplate[] {
  return clientType === 'ECOM' ? ECOM_TASKS : CAPITAL_RAISING_TASKS;
}
