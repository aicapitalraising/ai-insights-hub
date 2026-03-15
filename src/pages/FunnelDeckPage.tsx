import DeckHero from '@/components/deck/DeckHero';
import ChallengeSection from '@/components/deck/ChallengeSection';
import OpportunitySection from '@/components/deck/OpportunitySection';
import FrameworkSection from '@/components/deck/FrameworkSection';
import ConversionFlow from '@/components/deck/ConversionFlow';
import LeadGenDeepDive from '@/components/deck/LeadGenDeepDive';
import FunnelDeepDive from '@/components/deck/FunnelDeepDive';
import AutomationDeepDive from '@/components/deck/AutomationDeepDive';
import AnalyticsDeepDive from '@/components/deck/AnalyticsDeepDive';
import CaseStudies from '@/components/deck/CaseStudies';
import BrokerComparison from '@/components/deck/BrokerComparison';
import DeckLeadEnrichment from '@/components/deck/DeckLeadEnrichment';
import CapitalRaisingCalculator from '@/components/deck/CapitalRaisingCalculator';
import ExecutiveTeam from '@/components/deck/ExecutiveTeam';
import WhatYouGet from '@/components/deck/WhatYouGet';
import InvestmentSteps from '@/components/deck/InvestmentSteps';
import DeckCTA from '@/components/deck/DeckCTA';

const Deck = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DeckHero />
      <ChallengeSection />
      <OpportunitySection />
      <FrameworkSection />
      <ConversionFlow />
      <LeadGenDeepDive />
      <FunnelDeepDive />
      <AutomationDeepDive />
      <AnalyticsDeepDive />
      <CaseStudies />
      <BrokerComparison />
      <DeckLeadEnrichment />
      <CapitalRaisingCalculator />
      <ExecutiveTeam />
      <WhatYouGet />
      <InvestmentSteps />
      <DeckCTA />
    </div>
  );
};

export default Deck;
