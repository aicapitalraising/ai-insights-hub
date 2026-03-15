import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  User, MapPin, DollarSign, Home, Users, GraduationCap,
  Heart, Car, Building2, Phone, Mail, BookOpen, HandHeart, Shield
} from 'lucide-react';
import type { EnrichedLead, QualificationTier } from './mockLeads';

interface Props {
  lead: EnrichedLead;
}

const tierConfig: Record<QualificationTier, { label: string; color: string; bg: string }> = {
  qualified: { label: 'Qualified Investor', color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-200' },
  borderline: { label: 'Borderline', color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-200' },
  unqualified: { label: 'Unqualified', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
};

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {title}
      </h4>
      <div className="text-sm space-y-1">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | boolean | undefined | null }) {
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xs font-medium text-right">{display}</span>
    </div>
  );
}

export function LeadEnrichmentProfile({ lead }: Props) {
  if (lead.enrichmentStatus === 'no-match') {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        <p>Enrichment attempted via {lead.enrichmentMethod} — no verified match found. Data discarded.</p>
      </div>
    );
  }

  if (lead.enrichmentStatus === 'pending') {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        <div className="inline-flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Enrichment pending — awaiting API processing
        </div>
      </div>
    );
  }

  const { identity, address, financial, investments, home, household, education } = lead;
  const tier = tierConfig[lead.qualificationTier];

  return (
    <div className="p-4 space-y-4">
      {/* Qualification Score + Status bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${tier.bg}`}>
          <Shield className={`w-4 h-4 ${tier.color}`} />
          <span className={`text-sm font-bold ${tier.color}`}>{lead.qualificationScore}</span>
          <span className={`text-xs font-medium ${tier.color}`}>{tier.label}</span>
        </div>
        <Badge variant={lead.enrichmentStatus === 'verified' ? 'default' : 'secondary'}>
          {lead.enrichmentStatus === 'verified' ? '✓ Verified' : '👥 Spouse Match'}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          via {lead.enrichmentMethod === 'phone' ? 'Phone' : 'Email'}
        </Badge>
        {lead.showedUp === true && (
          <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/10">✓ Showed Up</Badge>
        )}
        {lead.showedUp === false && (
          <Badge variant="outline" className="text-[10px] text-destructive border-destructive/20">✗ No-show</Badge>
        )}
        {lead.enrichmentStatus === 'spouse' && identity && (
          <span className="text-xs text-muted-foreground">
            Matched: {identity.firstName} {identity.lastName} (same address)
          </span>
        )}
      </div>

      {/* Main grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {identity && (
          <Card className="border-border">
            <CardContent className="p-3">
              <Section icon={User} title="Identity">
                <Field label="Name" value={`${identity.firstName} ${identity.lastName}`} />
                <Field label="Gender" value={identity.gender} />
                <Field label="Age" value={identity.age} />
                <Field label="DOB" value={identity.birthDate} />
                <Field label="Marital" value={identity.maritalStatus} />
                <Field label="Ethnicity" value={identity.ethnicGroup} />
                <Field label="Generation" value={identity.generation} />
                <Field label="Religion" value={identity.religion} />
                <Field label="Language" value={identity.language} />
              </Section>
            </CardContent>
          </Card>
        )}

        {address && (
          <Card className="border-border">
            <CardContent className="p-3">
              <Section icon={MapPin} title="Address">
                <Field label="Street" value={address.street} />
                <Field label="City" value={address.city} />
                <Field label="State" value={address.state} />
                <Field label="Zip" value={address.zip} />
                <Field label="County" value={address.county} />
                <Field label="Urbanicity" value={address.urbanicity} />
              </Section>
            </CardContent>
          </Card>
        )}

        {financial && (
          <Card className="border-border">
            <CardContent className="p-3">
              <Section icon={DollarSign} title="Financial">
                <Field label="HH Income" value={financial.householdIncome} />
                <Field label="Discr. Income" value={financial.discretionaryIncome} />
                <Field label="Credit Range" value={financial.creditRange} />
                <Field label="Fin. Power" value={`${financial.financialPower}/10`} />
                <Field label="Net Worth" value={financial.householdNetWorth} />
                {investments && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {investments.investor && <Badge variant="outline" className="text-[9px]">Investor</Badge>}
                    {investments.ownsStocksAndBonds && <Badge variant="outline" className="text-[9px]">Stocks</Badge>}
                    {investments.ownsMutualFunds && <Badge variant="outline" className="text-[9px]">Mutual Funds</Badge>}
                  </div>
                )}
              </Section>
            </CardContent>
          </Card>
        )}

        {home && (
          <Card className="border-border">
            <CardContent className="p-3">
              <Section icon={Home} title="Home">
                <Field label="Ownership" value={home.homeOwnership} />
                <Field label="Value" value={`$${home.homeValue.toLocaleString()}`} />
                <Field label="Type" value={home.dwellingType} />
                <Field label="Mortgage" value={`$${home.mortgageAmount.toLocaleString()}`} />
                <Field label="Residence" value={`${home.lengthOfResidence} yrs`} />
                <Field label="Pool" value={home.ownsSwimmingPool} />
              </Section>
            </CardContent>
          </Card>
        )}

        {household && (
          <Card className="border-border">
            <CardContent className="p-3">
              <Section icon={Users} title="Household">
                <Field label="Adults" value={household.householdAdults} />
                <Field label="Total Persons" value={household.householdPersons} />
                <Field label="Children" value={household.hasChildren} />
                {household.childAgeBrackets.length > 0 && (
                  <Field label="Ages" value={household.childAgeBrackets.join(', ')} />
                )}
                <Field label="Veteran" value={household.householdVeteran} />
              </Section>
            </CardContent>
          </Card>
        )}

        {education && (
          <Card className="border-border">
            <CardContent className="p-3">
              <Section icon={GraduationCap} title="Education & Career">
                <Field label="Education" value={education.educationLevel} />
                <Field label="Occupation" value={education.occupationDetail} />
                <Field label="Category" value={education.occupationCategory} />
                <Field label="Type" value={education.occupationType} />
                <Field label="White Collar" value={education.whiteCollar} />
              </Section>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Interests */}
      {lead.interests.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-3">
            <Section icon={Heart} title="Interests">
              <div className="flex flex-wrap gap-1.5">
                {lead.interests.map((i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] font-normal">{i}</Badge>
                ))}
              </div>
            </Section>
          </CardContent>
        </Card>
      )}

      {/* Bottom row */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lead.vehicles.length > 0 && (
          <Card className="border-border">
            <CardContent className="p-3">
              <Section icon={Car} title="Vehicles">
                {lead.vehicles.map((v, i) => (
                  <div key={i} className="bg-muted/50 rounded p-2 text-xs space-y-0.5">
                    <p className="font-semibold">{v.year} {v.make} {v.model}</p>
                    <p className="text-muted-foreground">{v.bodyType} · {v.driveType} · {v.fuelType}</p>
                    <p className="text-muted-foreground">MSRP: ${v.msrp.toLocaleString()}</p>
                  </div>
                ))}
              </Section>
            </CardContent>
          </Card>
        )}

        {lead.companies.length > 0 && (
          <Card className="border-border">
            <CardContent className="p-3">
              <Section icon={Building2} title="Companies">
                {lead.companies.map((c, i) => (
                  <div key={i} className="bg-muted/50 rounded p-2 text-xs space-y-0.5">
                    <p className="font-semibold">{c.title}</p>
                    <p className="text-muted-foreground">{c.companyName}</p>
                    {c.linkedIn && <p className="text-primary text-[10px]">{c.linkedIn}</p>}
                  </div>
                ))}
              </Section>
            </CardContent>
          </Card>
        )}

        {(lead.phones.length > 0 || lead.emails.length > 0) && (
          <Card className="border-border">
            <CardContent className="p-3 space-y-3">
              {lead.phones.length > 0 && (
                <Section icon={Phone} title="Phones">
                  {lead.phones.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{p.number}</span>
                      <span className="text-muted-foreground">{p.carrier} · {p.phoneType} · Score: {p.contactabilityScore}</span>
                    </div>
                  ))}
                </Section>
              )}
              {lead.emails.length > 0 && (
                <Section icon={Mail} title="Emails">
                  {lead.emails.map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{e.email}</span>
                      <span className="text-muted-foreground">{e.quality} · {e.optIn ? 'Opt-in' : 'No opt-in'}</span>
                    </div>
                  ))}
                </Section>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reading & Donations */}
      {(lead.reading.length > 0 || lead.donations.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {lead.reading.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-3">
                <Section icon={BookOpen} title="Reading Interests">
                  <div className="flex flex-wrap gap-1.5">
                    {lead.reading.map((r) => (
                      <Badge key={r} variant="outline" className="text-[10px] font-normal">{r}</Badge>
                    ))}
                  </div>
                </Section>
              </CardContent>
            </Card>
          )}
          {lead.donations.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-3">
                <Section icon={HandHeart} title="Charitable Causes">
                  <div className="flex flex-wrap gap-1.5">
                    {lead.donations.map((d) => (
                      <Badge key={d} variant="outline" className="text-[10px] font-normal">{d}</Badge>
                    ))}
                  </div>
                </Section>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
