export type AdPlatform = 'Facebook' | 'Instagram' | 'LinkedIn' | 'TikTok';
export type AdFormat = 'Static' | 'Video' | 'Carousel';
export type AdStatus = 'Active' | 'Paused' | 'Ended';
export type AdCategory =
  | 'Real Estate Investment'
  | 'Alternative Investments'
  | 'Financial Services'
  | 'Business Services'
  | 'E-commerce & Retail'
  | 'Health & Wellness';

export interface CompetitorAd {
  id: string;
  companyName: string;
  headline: string;
  imageUrl: string;
  status: AdStatus;
  platform: AdPlatform;
  format: AdFormat;
  category: AdCategory;
  saves: number;
  views: number;
  tags: string[];
  firstSeen: string;
}

export const CATEGORIES: AdCategory[] = [
  'Real Estate Investment',
  'Alternative Investments',
  'Financial Services',
  'Business Services',
  'E-commerce & Retail',
  'Health & Wellness',
];

export const PLATFORMS: AdPlatform[] = ['Facebook', 'Instagram', 'LinkedIn', 'TikTok'];
export const FORMATS: AdFormat[] = ['Static', 'Video', 'Carousel'];
export const STATUSES: AdStatus[] = ['Active', 'Paused', 'Ended'];

export const MOCK_ADS: CompetitorAd[] = [
  {
    id: 'ad-1',
    companyName: 'EquityNest',
    headline: 'Passive Income Through Real Estate — No Landlord Hassle',
    imageUrl: '',
    status: 'Active',
    platform: 'Facebook',
    format: 'Video',
    category: 'Real Estate Investment',
    saves: 1240,
    views: 58000,
    tags: ['REIT', 'Passive Income'],
    firstSeen: '2026-01-15',
  },
  {
    id: 'ad-2',
    companyName: 'Fundrise',
    headline: 'Start Investing in Real Estate with Just $10',
    imageUrl: '',
    status: 'Active',
    platform: 'Instagram',
    format: 'Carousel',
    category: 'Real Estate Investment',
    saves: 3100,
    views: 120000,
    tags: ['Low Minimum', 'Crowdfunding'],
    firstSeen: '2026-01-20',
  },
  {
    id: 'ad-3',
    companyName: 'Masterworks',
    headline: 'Invest in Blue-Chip Art — Outperform the S&P',
    imageUrl: '',
    status: 'Active',
    platform: 'LinkedIn',
    format: 'Static',
    category: 'Alternative Investments',
    saves: 890,
    views: 42000,
    tags: ['Art', 'Alternative'],
    firstSeen: '2026-01-10',
  },
  {
    id: 'ad-4',
    companyName: 'Yieldstreet',
    headline: 'Diversify Beyond Stocks with Private Market Deals',
    imageUrl: '',
    status: 'Paused',
    platform: 'Facebook',
    format: 'Video',
    category: 'Alternative Investments',
    saves: 670,
    views: 31000,
    tags: ['Private Credit', 'Diversification'],
    firstSeen: '2025-12-05',
  },
  {
    id: 'ad-5',
    companyName: 'Wealthfront',
    headline: 'Automated Investing Made Simple — 4.5% APY',
    imageUrl: '',
    status: 'Active',
    platform: 'Instagram',
    format: 'Static',
    category: 'Financial Services',
    saves: 2300,
    views: 95000,
    tags: ['Robo-Advisor', 'High Yield'],
    firstSeen: '2026-02-01',
  },
  {
    id: 'ad-6',
    companyName: 'Mercury',
    headline: 'Banking Built for Startups — Apply in Minutes',
    imageUrl: '',
    status: 'Active',
    platform: 'LinkedIn',
    format: 'Video',
    category: 'Financial Services',
    saves: 1800,
    views: 72000,
    tags: ['Banking', 'Startups'],
    firstSeen: '2026-01-25',
  },
  {
    id: 'ad-7',
    companyName: 'Notion',
    headline: 'The All-in-One Workspace Your Team Needs',
    imageUrl: '',
    status: 'Ended',
    platform: 'Facebook',
    format: 'Carousel',
    category: 'Business Services',
    saves: 4200,
    views: 210000,
    tags: ['SaaS', 'Productivity'],
    firstSeen: '2025-11-15',
  },
  {
    id: 'ad-8',
    companyName: 'Gusto',
    headline: 'Payroll, Benefits, HR — All in One Place',
    imageUrl: '',
    status: 'Active',
    platform: 'LinkedIn',
    format: 'Static',
    category: 'Business Services',
    saves: 560,
    views: 28000,
    tags: ['HR', 'Payroll'],
    firstSeen: '2026-02-03',
  },
  {
    id: 'ad-9',
    companyName: 'Warby Parker',
    headline: 'Try 5 Frames at Home — Free Shipping Both Ways',
    imageUrl: '',
    status: 'Active',
    platform: 'Instagram',
    format: 'Video',
    category: 'E-commerce & Retail',
    saves: 5600,
    views: 340000,
    tags: ['DTC', 'Free Trial'],
    firstSeen: '2026-01-28',
  },
  {
    id: 'ad-10',
    companyName: 'Shopify',
    headline: 'Turn Your Passion Into a Business — Start Free',
    imageUrl: '',
    status: 'Active',
    platform: 'TikTok',
    format: 'Video',
    category: 'E-commerce & Retail',
    saves: 7800,
    views: 520000,
    tags: ['E-commerce', 'Free Trial'],
    firstSeen: '2026-02-05',
  },
  {
    id: 'ad-11',
    companyName: 'Hims & Hers',
    headline: 'Personalized Health — Delivered to Your Door',
    imageUrl: '',
    status: 'Paused',
    platform: 'Facebook',
    format: 'Carousel',
    category: 'Health & Wellness',
    saves: 2100,
    views: 89000,
    tags: ['Telehealth', 'DTC'],
    firstSeen: '2026-01-12',
  },
  {
    id: 'ad-12',
    companyName: 'Noom',
    headline: 'Lose Weight for Good with Psychology-Based Coaching',
    imageUrl: '',
    status: 'Active',
    platform: 'TikTok',
    format: 'Video',
    category: 'Health & Wellness',
    saves: 3400,
    views: 180000,
    tags: ['Weight Loss', 'Coaching'],
    firstSeen: '2026-01-30',
  },
];
