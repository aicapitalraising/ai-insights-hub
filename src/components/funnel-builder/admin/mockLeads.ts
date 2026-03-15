export type QualificationTier = 'qualified' | 'borderline' | 'unqualified';
export type RoutingDestination = 'closer' | 'setter' | 'downsell';

export interface EnrichedLead {
  id: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  source: string;
  createdAt: string;
  status: 'new' | 'booked' | 'qualified' | 'non-accredited' | 'abandoned';
  accredited: boolean;
  investmentRange: string;
  appointmentDate: string | null;

  // Qualification & Routing
  qualificationTier: QualificationTier;
  qualificationScore: number; // 0-100
  routingDestination: RoutingDestination;

  // Show-up tracking
  showedUp: boolean | null; // null = not applicable (no appointment)

  // Enrichment
  enrichmentStatus: 'verified' | 'spouse' | 'no-match' | 'pending';
  enrichmentMethod: 'phone' | 'email' | null;

  identity: {
    firstName: string; lastName: string; gender: string; age: number;
    birthDate: string; maritalStatus: string; ethnicGroup: string;
    generation: string; religion: string; language: string;
  } | null;

  address: {
    street: string; city: string; state: string; zip: string;
    county: string; lat: number; lng: number; urbanicity: string;
  } | null;

  financial: {
    householdIncome: string; discretionaryIncome: string; creditRange: string;
    financialPower: number; householdNetWorth: string;
  } | null;

  investments: {
    ownsInvestments: boolean; investor: boolean;
    ownsStocksAndBonds: boolean; ownsMutualFunds: boolean;
  } | null;

  home: {
    homeOwnership: string; homeValue: number; dwellingType: string;
    mortgageAmount: number; lengthOfResidence: number; ownsSwimmingPool: boolean;
  } | null;

  household: {
    householdAdults: number; householdPersons: number; hasChildren: boolean;
    childAgeBrackets: string[]; householdVeteran: boolean;
  } | null;

  education: {
    educationLevel: string; occupationType: string; occupationDetail: string;
    occupationCategory: string; whiteCollar: boolean;
  } | null;

  interests: string[];
  vehicles: { make: string; model: string; year: number; bodyType: string; msrp: number; fuelType: string; driveType: string; }[];
  companies: { title: string; companyName: string; phone: string; email: string; linkedIn: string; }[];
  phones: { number: string; carrier: string; phoneType: string; dnc: boolean; contactabilityScore: number; }[];
  emails: { email: string; optIn: boolean; quality: string; rank: number; }[];
  donations: string[];
  reading: string[];
}

export const mockLeads: EnrichedLead[] = [
  {
    id: '1',
    leadName: 'John Doe',
    leadEmail: 'john.doe@example.com',
    leadPhone: '(555) 123-4567',
    source: 'Facebook Ad',
    createdAt: '2026-03-10',
    status: 'qualified',
    accredited: true,
    investmentRange: '$250K - $500K',
    appointmentDate: '2026-03-14',
    qualificationTier: 'qualified',
    qualificationScore: 92,
    routingDestination: 'closer',
    showedUp: true,
    enrichmentStatus: 'verified',
    enrichmentMethod: 'phone',
    identity: {
      firstName: 'John', lastName: 'Doe', gender: 'Male', age: 50,
      birthDate: '1976-04-12', maritalStatus: 'Married', ethnicGroup: 'Western European',
      generation: 'Gen X', religion: 'Christian', language: 'English'
    },
    address: {
      street: '4821 Maple Ridge Dr', city: 'Scottsdale', state: 'AZ', zip: '85260',
      county: 'Maricopa', lat: 33.5841, lng: -111.8861, urbanicity: 'Suburban'
    },
    financial: {
      householdIncome: '$250,000 - $299,999', discretionaryIncome: '$120,000',
      creditRange: '750-799', financialPower: 8, householdNetWorth: '$1M - $2.49M'
    },
    investments: { ownsInvestments: true, investor: true, ownsStocksAndBonds: true, ownsMutualFunds: true },
    home: { homeOwnership: 'Home Owner', homeValue: 826500, dwellingType: 'Single Family', mortgageAmount: 312000, lengthOfResidence: 8, ownsSwimmingPool: true },
    household: { householdAdults: 2, householdPersons: 4, hasChildren: true, childAgeBrackets: ['10-12', '14-17'], householdVeteran: false },
    education: { educationLevel: 'Completed College', occupationType: 'Executive', occupationDetail: 'Chief Executive Officer', occupationCategory: 'Upper Management', whiteCollar: true },
    interests: ['Golf', 'Travel', 'Fine Dining', 'Investments', 'Real Estate', 'Wine', 'Fitness', 'Books'],
    vehicles: [
      { make: 'BMW', model: 'X5', year: 2024, bodyType: 'SUV', msrp: 65700, fuelType: 'Gasoline', driveType: 'AWD' },
      { make: 'Tesla', model: 'Model S', year: 2023, bodyType: 'Sedan', msrp: 89990, fuelType: 'Electric', driveType: 'AWD' },
    ],
    companies: [{ title: 'CEO', companyName: 'Doe Capital Partners', phone: '(555) 999-0001', email: 'john@doecapital.com', linkedIn: 'linkedin.com/in/johndoe' }],
    phones: [
      { number: '(555) 123-4567', carrier: 'Verizon', phoneType: 'Mobile', dnc: false, contactabilityScore: 92 },
      { number: '(555) 999-0001', carrier: 'AT&T', phoneType: 'Landline', dnc: false, contactabilityScore: 78 },
    ],
    emails: [
      { email: 'john.doe@example.com', optIn: true, quality: 'High', rank: 1 },
      { email: 'john@doecapital.com', optIn: false, quality: 'Medium', rank: 2 },
    ],
    donations: ['Arts', 'Environmental', 'Veterans'],
    reading: ['Finance', 'Technology', 'History'],
  },
  {
    id: '2',
    leadName: 'Sarah Mitchell',
    leadEmail: 'sarah.m@gmail.com',
    leadPhone: '(555) 234-5678',
    source: 'Google Ad',
    createdAt: '2026-03-09',
    status: 'booked',
    accredited: true,
    investmentRange: '$100K - $250K',
    appointmentDate: '2026-03-13',
    qualificationTier: 'qualified',
    qualificationScore: 78,
    routingDestination: 'closer',
    showedUp: true,
    enrichmentStatus: 'verified',
    enrichmentMethod: 'email',
    identity: {
      firstName: 'Sarah', lastName: 'Mitchell', gender: 'Female', age: 42,
      birthDate: '1984-08-22', maritalStatus: 'Married', ethnicGroup: 'English',
      generation: 'Millennial', religion: 'None', language: 'English'
    },
    address: {
      street: '1023 Elm St', city: 'Austin', state: 'TX', zip: '78701',
      county: 'Travis', lat: 30.2672, lng: -97.7431, urbanicity: 'Urban'
    },
    financial: {
      householdIncome: '$175,000 - $199,999', discretionaryIncome: '$85,000',
      creditRange: '700-749', financialPower: 7, householdNetWorth: '$500K - $749K'
    },
    investments: { ownsInvestments: true, investor: true, ownsStocksAndBonds: true, ownsMutualFunds: false },
    home: { homeOwnership: 'Home Owner', homeValue: 545000, dwellingType: 'Condo', mortgageAmount: 280000, lengthOfResidence: 4, ownsSwimmingPool: false },
    household: { householdAdults: 2, householdPersons: 3, hasChildren: true, childAgeBrackets: ['4-6'], householdVeteran: false },
    education: { educationLevel: 'Graduate Degree', occupationType: 'Professional', occupationDetail: 'Financial Analyst', occupationCategory: 'Finance', whiteCollar: true },
    interests: ['Yoga', 'Travel', 'Cooking', 'Investments', 'Fashion', 'Fitness'],
    vehicles: [{ make: 'Audi', model: 'Q7', year: 2023, bodyType: 'SUV', msrp: 58900, fuelType: 'Gasoline', driveType: 'AWD' }],
    companies: [{ title: 'Senior Analyst', companyName: 'Mitchell Financial Group', phone: '(555) 234-9999', email: 'sarah@mitchellfg.com', linkedIn: 'linkedin.com/in/sarahmitchell' }],
    phones: [{ number: '(555) 234-5678', carrier: 'T-Mobile', phoneType: 'Mobile', dnc: false, contactabilityScore: 88 }],
    emails: [{ email: 'sarah.m@gmail.com', optIn: true, quality: 'High', rank: 1 }],
    donations: ['Children', 'Environmental'],
    reading: ['Fashion', 'Finance', 'Health'],
  },
  {
    id: '3',
    leadName: 'Robert Chen',
    leadEmail: 'rchen@outlook.com',
    leadPhone: '(555) 345-6789',
    source: 'LinkedIn Ad',
    createdAt: '2026-03-08',
    status: 'new',
    accredited: false,
    investmentRange: '$50K - $100K',
    appointmentDate: null,
    qualificationTier: 'borderline',
    qualificationScore: 52,
    routingDestination: 'setter',
    showedUp: null,
    enrichmentStatus: 'spouse',
    enrichmentMethod: 'phone',
    identity: {
      firstName: 'Linda', lastName: 'Chen', gender: 'Female', age: 47,
      birthDate: '1979-01-15', maritalStatus: 'Married', ethnicGroup: 'East Asian',
      generation: 'Gen X', religion: 'Buddhist', language: 'English'
    },
    address: {
      street: '789 Oak Blvd', city: 'San Jose', state: 'CA', zip: '95112',
      county: 'Santa Clara', lat: 37.3382, lng: -121.8863, urbanicity: 'Urban'
    },
    financial: {
      householdIncome: '$150,000 - $174,999', discretionaryIncome: '$65,000',
      creditRange: '700-749', financialPower: 6, householdNetWorth: '$250K - $499K'
    },
    investments: { ownsInvestments: true, investor: false, ownsStocksAndBonds: false, ownsMutualFunds: true },
    home: { homeOwnership: 'Home Owner', homeValue: 980000, dwellingType: 'Single Family', mortgageAmount: 520000, lengthOfResidence: 6, ownsSwimmingPool: false },
    household: { householdAdults: 2, householdPersons: 3, hasChildren: true, childAgeBrackets: ['7-9'], householdVeteran: false },
    education: { educationLevel: 'Completed College', occupationType: 'Professional', occupationDetail: 'Software Engineer', occupationCategory: 'Technology', whiteCollar: true },
    interests: ['Gardening', 'Cooking', 'DIY', 'Reading', 'Hiking'],
    vehicles: [{ make: 'Toyota', model: 'Highlander', year: 2022, bodyType: 'SUV', msrp: 38400, fuelType: 'Hybrid', driveType: 'AWD' }],
    companies: [{ title: 'Staff Engineer', companyName: 'TechFlow Inc.', phone: '(555) 345-0000', email: 'rchen@techflow.io', linkedIn: 'linkedin.com/in/robertchen' }],
    phones: [{ number: '(555) 345-6789', carrier: 'Verizon', phoneType: 'Mobile', dnc: false, contactabilityScore: 85 }],
    emails: [{ email: 'rchen@outlook.com', optIn: true, quality: 'Medium', rank: 1 }],
    donations: ['Arts', 'Children'],
    reading: ['Science', 'Technology'],
  },
  {
    id: '4',
    leadName: 'Michael Torres',
    leadEmail: 'mtorres@yahoo.com',
    leadPhone: '(555) 456-7890',
    source: 'Facebook Ad',
    createdAt: '2026-03-07',
    status: 'non-accredited',
    accredited: false,
    investmentRange: '$25K - $50K',
    appointmentDate: null,
    qualificationTier: 'unqualified',
    qualificationScore: 12,
    routingDestination: 'downsell',
    showedUp: null,
    enrichmentStatus: 'no-match',
    enrichmentMethod: 'phone',
    identity: null, address: null, financial: null, investments: null, home: null,
    household: null, education: null,
    interests: [], vehicles: [], companies: [], phones: [], emails: [],
    donations: [], reading: [],
  },
  {
    id: '5',
    leadName: 'Amanda Williams',
    leadEmail: 'awilliams@gmail.com',
    leadPhone: '(555) 567-8901',
    source: 'Google Ad',
    createdAt: '2026-03-06',
    status: 'qualified',
    accredited: true,
    investmentRange: '$500K+',
    appointmentDate: '2026-03-15',
    qualificationTier: 'qualified',
    qualificationScore: 97,
    routingDestination: 'closer',
    showedUp: false,
    enrichmentStatus: 'verified',
    enrichmentMethod: 'phone',
    identity: {
      firstName: 'Amanda', lastName: 'Williams', gender: 'Female', age: 55,
      birthDate: '1971-11-03', maritalStatus: 'Divorced', ethnicGroup: 'English',
      generation: 'Gen X', religion: 'Christian', language: 'English'
    },
    address: {
      street: '2200 Palm Beach Ln', city: 'Naples', state: 'FL', zip: '34102',
      county: 'Collier', lat: 26.1420, lng: -81.7948, urbanicity: 'Suburban'
    },
    financial: {
      householdIncome: '$300,000+', discretionaryIncome: '$180,000',
      creditRange: '800+', financialPower: 9, householdNetWorth: '$2.5M - $4.99M'
    },
    investments: { ownsInvestments: true, investor: true, ownsStocksAndBonds: true, ownsMutualFunds: true },
    home: { homeOwnership: 'Home Owner', homeValue: 1250000, dwellingType: 'Single Family', mortgageAmount: 0, lengthOfResidence: 12, ownsSwimmingPool: true },
    household: { householdAdults: 1, householdPersons: 1, hasChildren: false, childAgeBrackets: [], householdVeteran: false },
    education: { educationLevel: 'Graduate Degree', occupationType: 'Executive', occupationDetail: 'Managing Director', occupationCategory: 'Finance', whiteCollar: true },
    interests: ['Golf', 'Luxury', 'Travel', 'Wine', 'Art', 'Philanthropy', 'Investments', 'Real Estate', 'Boating'],
    vehicles: [
      { make: 'Mercedes-Benz', model: 'GLE 450', year: 2025, bodyType: 'SUV', msrp: 72950, fuelType: 'Gasoline', driveType: 'AWD' },
      { make: 'Porsche', model: '911 Carrera', year: 2024, bodyType: 'Coupe', msrp: 115200, fuelType: 'Gasoline', driveType: 'RWD' },
    ],
    companies: [{ title: 'Managing Director', companyName: 'Williams Wealth Advisory', phone: '(555) 567-0001', email: 'amanda@williamswm.com', linkedIn: 'linkedin.com/in/amandawilliams' }],
    phones: [{ number: '(555) 567-8901', carrier: 'AT&T', phoneType: 'Mobile', dnc: false, contactabilityScore: 95 }],
    emails: [
      { email: 'awilliams@gmail.com', optIn: true, quality: 'High', rank: 1 },
      { email: 'amanda@williamswm.com', optIn: true, quality: 'High', rank: 2 },
    ],
    donations: ['Arts', 'Children', 'Environmental', 'Veterans'],
    reading: ['Finance', 'Art', 'Travel'],
  },
  {
    id: '6',
    leadName: 'David Park',
    leadEmail: 'dpark@proton.me',
    leadPhone: '(555) 678-9012',
    source: 'LinkedIn Ad',
    createdAt: '2026-03-05',
    status: 'booked',
    accredited: true,
    investmentRange: '$100K - $250K',
    appointmentDate: '2026-03-12',
    qualificationTier: 'borderline',
    qualificationScore: 45,
    routingDestination: 'setter',
    showedUp: true,
    enrichmentStatus: 'pending',
    enrichmentMethod: null,
    identity: null, address: null, financial: null, investments: null, home: null,
    household: null, education: null,
    interests: [], vehicles: [], companies: [], phones: [], emails: [],
    donations: [], reading: [],
  },
  {
    id: '7',
    leadName: 'Jennifer Adams',
    leadEmail: 'jadams@hotmail.com',
    leadPhone: '(555) 789-0123',
    source: 'Facebook Ad',
    createdAt: '2026-03-04',
    status: 'abandoned',
    accredited: false,
    investmentRange: '$50K - $100K',
    appointmentDate: null,
    qualificationTier: 'unqualified',
    qualificationScore: 28,
    routingDestination: 'downsell',
    showedUp: null,
    enrichmentStatus: 'pending',
    enrichmentMethod: null,
    identity: null, address: null, financial: null, investments: null, home: null,
    household: null, education: null,
    interests: [], vehicles: [], companies: [], phones: [], emails: [],
    donations: [], reading: [],
  },
  {
    id: '8',
    leadName: 'Marcus Johnson',
    leadEmail: 'mjohnson@gmail.com',
    leadPhone: '(555) 890-1234',
    source: 'Google Ad',
    createdAt: '2026-03-03',
    status: 'booked',
    accredited: true,
    investmentRange: '$250K - $500K',
    appointmentDate: '2026-03-11',
    qualificationTier: 'qualified',
    qualificationScore: 85,
    routingDestination: 'closer',
    showedUp: false,
    enrichmentStatus: 'verified',
    enrichmentMethod: 'phone',
    identity: {
      firstName: 'Marcus', lastName: 'Johnson', gender: 'Male', age: 48,
      birthDate: '1978-06-30', maritalStatus: 'Married', ethnicGroup: 'African American',
      generation: 'Gen X', religion: 'Christian', language: 'English'
    },
    address: {
      street: '512 Peachtree Blvd', city: 'Atlanta', state: 'GA', zip: '30309',
      county: 'Fulton', lat: 33.7815, lng: -84.3834, urbanicity: 'Urban'
    },
    financial: {
      householdIncome: '$200,000 - $249,999', discretionaryIncome: '$95,000',
      creditRange: '750-799', financialPower: 7, householdNetWorth: '$750K - $999K'
    },
    investments: { ownsInvestments: true, investor: true, ownsStocksAndBonds: true, ownsMutualFunds: false },
    home: { homeOwnership: 'Home Owner', homeValue: 720000, dwellingType: 'Single Family', mortgageAmount: 380000, lengthOfResidence: 5, ownsSwimmingPool: false },
    household: { householdAdults: 2, householdPersons: 4, hasChildren: true, childAgeBrackets: ['7-9', '10-12'], householdVeteran: true },
    education: { educationLevel: 'Graduate Degree', occupationType: 'Professional', occupationDetail: 'Attorney', occupationCategory: 'Legal', whiteCollar: true },
    interests: ['Golf', 'Travel', 'Investments', 'Wine', 'Fitness', 'Cigars'],
    vehicles: [{ make: 'Lexus', model: 'RX 450h', year: 2024, bodyType: 'SUV', msrp: 52350, fuelType: 'Hybrid', driveType: 'AWD' }],
    companies: [{ title: 'Partner', companyName: 'Johnson & Associates LLP', phone: '(555) 890-0001', email: 'marcus@johnsonlaw.com', linkedIn: 'linkedin.com/in/marcusjohnson' }],
    phones: [{ number: '(555) 890-1234', carrier: 'AT&T', phoneType: 'Mobile', dnc: false, contactabilityScore: 90 }],
    emails: [{ email: 'mjohnson@gmail.com', optIn: true, quality: 'High', rank: 1 }],
    donations: ['Veterans', 'Children'],
    reading: ['Finance', 'History', 'Politics'],
  },
];
