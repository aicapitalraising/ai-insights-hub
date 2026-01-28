

# Make KPIs and Records Clickable on Client Dashboard

## Problem Analysis

1. **KPIGrid on ClientDetail.tsx** (line 386-392) is missing the `onMetricClick` handler that exists on the agency dashboard
2. No drill-down modals are imported or rendered on the ClientDetail page
3. Records within drill-down modals are only clickable via the Eye icon, not the entire row

## Solution

### 1. Add Clickable KPIs to Client Dashboard

**File: `src/pages/ClientDetail.tsx`**

Add state and imports:
```typescript
// Add to imports
import { LeadsDrillDownModal } from '@/components/drilldown/LeadsDrillDownModal';
import { CallsDrillDownModal } from '@/components/drilldown/CallsDrillDownModal';
import { AdSpendDrillDownModal } from '@/components/drilldown/AdSpendDrillDownModal';
import { FundedInvestorsDrillDownModal } from '@/components/drilldown/FundedInvestorsDrillDownModal';

// Add state
const [drillDownModal, setDrillDownModal] = useState<string | null>(null);
```

Update KPIGrid to include click handler:
```tsx
<KPIGrid 
  metrics={aggregatedMetrics} 
  priorMetrics={priorMetrics || undefined}
  showFundedMetrics 
  thresholds={thresholds}
  fundedInvestorLabel={fundedInvestorLabel}
  onMetricClick={(metric) => setDrillDownModal(metric)}  // ADD THIS
/>
```

Add drill-down modals before closing `</div>`:
```tsx
{/* Drill-Down Modals */}
<LeadsDrillDownModal
  clientId={clientId}
  open={drillDownModal === 'leads'}
  onOpenChange={(open) => !open && setDrillDownModal(null)}
/>

<CallsDrillDownModal
  clientId={clientId}
  open={drillDownModal === 'calls'}
  onOpenChange={(open) => !open && setDrillDownModal(null)}
/>

<CallsDrillDownModal
  clientId={clientId}
  showedOnly
  open={drillDownModal === 'showedCalls'}
  onOpenChange={(open) => !open && setDrillDownModal(null)}
/>

<AdSpendDrillDownModal
  clientId={clientId}
  open={drillDownModal === 'totalAdSpend'}
  onOpenChange={(open) => !open && setDrillDownModal(null)}
/>

<FundedInvestorsDrillDownModal
  clientId={clientId}
  open={drillDownModal === 'fundedInvestors'}
  onOpenChange={(open) => !open && setDrillDownModal(null)}
/>
```

### 2. Make Entire Row Clickable in Drill-Down Modals

Update the table rows to be clickable (not just the Eye icon):

**LeadsDrillDownModal.tsx** - Line 280:
```tsx
<TableRow 
  key={lead.id} 
  className="border-b hover:bg-muted/50 cursor-pointer"
  onClick={() => viewLeadActivity(lead)}  // ADD onClick
>
```

**CallsDrillDownModal.tsx** - Line 277:
```tsx
<TableRow 
  key={call.id} 
  className="border-b hover:bg-muted/50 cursor-pointer"
  onClick={() => viewCallActivity(call)}  // ADD onClick
>
```

**FundedInvestorsDrillDownModal.tsx** - Line 285:
```tsx
<TableRow 
  key={investor.id} 
  className="border-b hover:bg-muted/50 cursor-pointer"
  onClick={() => viewInvestorActivity(investor)}  // ADD onClick
>
```

## User Experience Flow

```
┌──────────────────────────────────────────────────────────┐
│           Client Dashboard - Overview Tab                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Leads: 45 ▼]   [Calls: 32 ▼]   [Showed: 18 ▼]        │
│  Click to drill  Click to drill  Click to drill         │
│                                                          │
│  [Ad Spend: $5,000 ▼]   [Funded: 5 ▼]                   │
│  Click to drill          Click to drill                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
                        │ Click KPI
                        ▼
┌──────────────────────────────────────────────────────────┐
│                  Leads Drill-Down Modal                  │
├──────────────────────────────────────────────────────────┤
│ Leads (45)                            [Export] [+Add]    │
│ ─────────────────────────────────────────────────────── │
│ Date     │ Name       │ Email          │ Campaign │...  │
│ 1/27     │ John Doe ▶ │ john@email.com │ FB_Camp  │     │
│ 1/26     │ Jane Doe ▶ │ jane@email.com │ IG_Camp  │     │
│          Click row to see full details                   │
└──────────────────────────────────────────────────────────┘
                        │ Click row
                        ▼
┌──────────────────────────────────────────────────────────┐
│              Record Activity Modal                       │
├──────────────────────────────────────────────────────────┤
│ Contact Info         │  Activity Timeline               │
│ ──────────────────── │  ────────────────                │
│ 👤 John Doe          │  ● Lead Created (1/27)           │
│ 📧 john@email.com    │  ● Call Booked (1/28)            │
│ 📞 +1-555-1234       │  ● Call Showed (1/28)            │
│                      │  💰 Funded $50,000 (2/10)        │
│ Campaign: FB_Camp    │                                   │
│ Ad Set: Interest_1   │                                   │
│ Survey Responses...  │                                   │
└──────────────────────────────────────────────────────────┘
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ClientDetail.tsx` | Add imports, state, onMetricClick, drill-down modals |
| `src/components/drilldown/LeadsDrillDownModal.tsx` | Add onClick to TableRow |
| `src/components/drilldown/CallsDrillDownModal.tsx` | Add onClick to TableRow |
| `src/components/drilldown/FundedInvestorsDrillDownModal.tsx` | Add onClick to TableRow |

## Estimated Changes
- ~30 lines added to ClientDetail.tsx (imports + modals)
- ~3 lines modified per drill-down modal (3 files)
- Total: ~40 lines

