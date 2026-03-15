import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, ChevronDown, ChevronUp, Users, Target, CheckCircle, Shield, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { LeadEnrichmentProfile } from './LeadEnrichmentProfile';
import { useLeads } from '@/hooks/useLeads';
import type { EnrichedLead, QualificationTier } from './mockLeads';

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-600 border-blue-200',
  booked: 'bg-primary/10 text-primary border-primary/20',
  qualified: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  'non-accredited': 'bg-amber-500/10 text-amber-600 border-amber-200',
  abandoned: 'bg-destructive/10 text-destructive border-destructive/20',
};

const enrichmentColors: Record<string, string> = {
  verified: 'bg-emerald-500/10 text-emerald-600',
  spouse: 'bg-blue-500/10 text-blue-600',
  'no-match': 'bg-destructive/10 text-destructive',
  pending: 'bg-amber-500/10 text-amber-600',
};

const tierColors: Record<QualificationTier, string> = {
  qualified: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  borderline: 'bg-amber-500/10 text-amber-600 border-amber-200',
  unqualified: 'bg-destructive/10 text-destructive border-destructive/20',
};

const routingLabels: Record<string, { label: string; className: string }> = {
  closer: { label: '→ Discovery Call', className: 'text-emerald-600' },
  setter: { label: '→ Discovery Call', className: 'text-amber-600' },
  downsell: { label: '→ Discovery Call', className: 'text-muted-foreground' },
};

export function LeadsTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: leads = [], isLoading, refetch, isFetching } = useLeads();

  const filtered = leads.filter((lead) => {
    const matchesSearch = lead.leadName.toLowerCase().includes(search.toLowerCase()) ||
      lead.leadEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesTier = tierFilter === 'all' || lead.qualificationTier === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
  });

  const totalLeads = leads.length;
  const enriched = leads.filter(l => l.enrichmentStatus === 'verified' || l.enrichmentStatus === 'spouse').length;
  const verified = leads.filter(l => l.enrichmentStatus === 'verified').length;
  const attempted = leads.filter(l => l.enrichmentStatus !== 'pending').length;
  const enrichmentPct = totalLeads > 0 ? ((enriched / totalLeads) * 100).toFixed(1) : '0';
  const accuracyPct = attempted > 0 ? ((verified / attempted) * 100).toFixed(1) : '0';
  const qualifiedCount = leads.filter(l => l.qualificationTier === 'qualified').length;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: totalLeads, icon: Users },
          { label: 'Qualified', value: qualifiedCount, icon: Shield },
          { label: 'Enrichment %', value: `${enrichmentPct}%`, icon: Target },
          { label: 'Accuracy %', value: `${accuracyPct}%`, icon: CheckCircle },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-xl font-bold">{kpi.value}</p>
                </div>
                <kpi.icon className="w-5 h-5 text-primary" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5">
          {['all', 'new', 'booked', 'qualified', 'non-accredited', 'abandoned'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 border-l border-border pl-3">
          {['all', 'qualified', 'borderline', 'unqualified'].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                tierFilter === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t === 'all' ? 'All Tiers' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            if (filtered.length === 0) return;
            const headers = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Tier', 'Score', 'Routing', 'Investment', 'Enrichment', 'Created'];
            const rows = filtered.map(l => [
              l.leadName, l.leadEmail, l.leadPhone, l.source, l.status,
              l.qualificationTier, l.qualificationScore, l.routingDestination,
              l.investmentRange, l.enrichmentStatus, l.createdAt,
            ]);
            const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
          Loading leads from database...
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <Card className="border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Name</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Routing</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Investment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrichment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    isExpanded={expandedId === lead.id}
                    onToggle={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live — auto-refreshes every 30s
      </div>
    </div>
  );
}

function LeadRow({ lead, isExpanded, onToggle }: { lead: EnrichedLead; isExpanded: boolean; onToggle: () => void }) {
  const routing = routingLabels[lead.routingDestination];

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <TableCell>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{lead.leadName}</span>
            {lead.showedUp === false && lead.appointmentDate && (
              <Badge variant="outline" className="text-[9px] text-destructive border-destructive/20">No-show</Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tierColors[lead.qualificationTier]}`}>
              {lead.qualificationScore}
            </span>
            <span className={`text-[9px] font-medium ${tierColors[lead.qualificationTier].split(' ')[1]}`}>
              {lead.qualificationTier.charAt(0).toUpperCase() + lead.qualificationTier.slice(1)}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <span className={`text-xs font-medium ${routing.className}`}>
            {routing.label}
          </span>
        </TableCell>
        <TableCell>
          <div className="text-xs space-y-0.5">
            <p>{lead.leadEmail}</p>
            <p className="text-muted-foreground">{lead.leadPhone}</p>
          </div>
        </TableCell>
        <TableCell className="text-xs font-medium">{lead.investmentRange}</TableCell>
        <TableCell>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[lead.status]}`}>
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace('-', ' ')}
          </span>
        </TableCell>
        <TableCell>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${enrichmentColors[lead.enrichmentStatus]}`}>
            {lead.enrichmentStatus === 'verified' ? '✓ Verified' :
             lead.enrichmentStatus === 'spouse' ? '👥 Spouse' :
             lead.enrichmentStatus === 'no-match' ? '✗ No Match' : '⏳ Pending'}
          </span>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={8} className="p-0 bg-muted/20">
            <LeadEnrichmentProfile lead={lead} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
