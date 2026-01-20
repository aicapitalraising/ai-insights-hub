import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DollarSign, 
  Users, 
  Phone, 
  TrendingUp,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Mail,
  User,
  Globe,
  Clock
} from 'lucide-react';
import { CashBagLoader } from '@/components/ui/CashBagLoader';
import { exportToCSV } from '@/lib/exportUtils';
import { DailyMetric } from '@/hooks/useMetrics';
import { Lead, Call } from '@/hooks/useLeadsAndCalls';

interface FundedInvestor {
  id: string;
  name: string | null;
  funded_amount: number;
  funded_at: string;
  first_contact_at: string | null;
  time_to_fund_days: number | null;
  calls_to_fund: number;
  lead_id: string | null;
}

interface InlineRecordsViewProps {
  dailyMetrics: DailyMetric[];
  leads: Lead[];
  calls: Call[];
  fundedInvestors: FundedInvestor[];
  isLoading?: boolean;
  onRecordSelect?: (record: any, type: string) => void;
  selectedRecord?: any;
  selectedType?: string;
}

const PAGE_SIZE = 150;

export function InlineRecordsView({
  dailyMetrics,
  leads,
  calls,
  fundedInvestors,
  isLoading,
  onRecordSelect,
  selectedRecord,
  selectedType,
}: InlineRecordsViewProps) {
  const [activeTab, setActiveTab] = useState('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery('');
  };

  // Filter data based on search
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    const query = searchQuery.toLowerCase();
    return leads.filter((lead) =>
      (lead.name?.toLowerCase().includes(query)) ||
      (lead.email?.toLowerCase().includes(query)) ||
      (lead.phone?.includes(query)) ||
      (lead.source?.toLowerCase().includes(query))
    );
  }, [leads, searchQuery]);

  const filteredCalls = useMemo(() => {
    if (!searchQuery) return calls;
    const query = searchQuery.toLowerCase();
    return calls.filter((call) =>
      (call.outcome?.toLowerCase().includes(query)) ||
      (call.scheduled_at?.includes(query))
    );
  }, [calls, searchQuery]);

  const filteredAdSpend = useMemo(() => {
    if (!searchQuery) return dailyMetrics;
    const query = searchQuery.toLowerCase();
    return dailyMetrics.filter((m) =>
      m.date.includes(query)
    );
  }, [dailyMetrics, searchQuery]);

  const filteredFunded = useMemo(() => {
    if (!searchQuery) return fundedInvestors;
    const query = searchQuery.toLowerCase();
    return fundedInvestors.filter((f) =>
      (f.name?.toLowerCase().includes(query))
    );
  }, [fundedInvestors, searchQuery]);

  // Get current data length based on tab
  const currentDataLength = useMemo(() => {
    switch (activeTab) {
      case 'leads': return filteredLeads.length;
      case 'calls': return filteredCalls.length;
      case 'adspend': return filteredAdSpend.length;
      case 'funded': return filteredFunded.length;
      default: return 0;
    }
  }, [activeTab, filteredLeads.length, filteredCalls.length, filteredAdSpend.length, filteredFunded.length]);

  const totalPages = Math.ceil(currentDataLength / PAGE_SIZE);
  
  // Paginate each dataset separately
  const paginatedLeads = useMemo(() => {
    if (activeTab !== 'leads') return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLeads.slice(start, start + PAGE_SIZE);
  }, [filteredLeads, currentPage, activeTab]);

  const paginatedCalls = useMemo(() => {
    if (activeTab !== 'calls') return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCalls.slice(start, start + PAGE_SIZE);
  }, [filteredCalls, currentPage, activeTab]);

  const paginatedAdSpend = useMemo(() => {
    if (activeTab !== 'adspend') return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAdSpend.slice(start, start + PAGE_SIZE);
  }, [filteredAdSpend, currentPage, activeTab]);

  const paginatedFunded = useMemo(() => {
    if (activeTab !== 'funded') return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredFunded.slice(start, start + PAGE_SIZE);
  }, [filteredFunded, currentPage, activeTab]);

  const paginatedDataLength = useMemo(() => {
    switch (activeTab) {
      case 'leads': return paginatedLeads.length;
      case 'calls': return paginatedCalls.length;
      case 'adspend': return paginatedAdSpend.length;
      case 'funded': return paginatedFunded.length;
      default: return 0;
    }
  }, [activeTab, paginatedLeads.length, paginatedCalls.length, paginatedAdSpend.length, paginatedFunded.length]);

  const handleExport = (exportAll: boolean) => {
    let data: any[] = [];
    switch (activeTab) {
      case 'leads': data = exportAll ? filteredLeads : paginatedLeads; break;
      case 'calls': data = exportAll ? filteredCalls : paginatedCalls; break;
      case 'adspend': data = exportAll ? filteredAdSpend : paginatedAdSpend; break;
      case 'funded': data = exportAll ? filteredFunded : paginatedFunded; break;
    }
    exportToCSV(data, `${activeTab}-${exportAll ? 'all' : 'filtered'}`);
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-border">
        <CardContent className="py-8">
          <CashBagLoader message="Loading records..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Records Table */}
      <div className="lg:col-span-2">
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Detailed Records</CardTitle>
              <Select onValueChange={(v) => handleExport(v === 'all')}>
                <SelectTrigger className="w-36">
                  <Download className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filtered">Export Filtered</SelectItem>
                  <SelectItem value="all">Export All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="leads" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Leads ({leads.length})
                </TabsTrigger>
                <TabsTrigger value="calls" className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Calls ({calls.length})
                </TabsTrigger>
                <TabsTrigger value="adspend" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Ad Spend ({dailyMetrics.length})
                </TabsTrigger>
                <TabsTrigger value="funded" className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Funded ({fundedInvestors.length})
                </TabsTrigger>
              </TabsList>

              {/* Search */}
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="max-w-sm"
                />
                <span className="text-sm text-muted-foreground">
                  Showing {paginatedDataLength} of {currentDataLength}
                </span>
              </div>

              {/* Leads Tab */}
              <TabsContent value="leads" className="mt-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2">
                        <TableHead>Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLeads.map((lead) => (
                        <TableRow
                          key={lead.id}
                          className={`cursor-pointer hover:bg-muted/50 ${
                            selectedRecord?.id === lead.id && selectedType === 'lead'
                              ? 'bg-primary/10'
                              : ''
                          }`}
                          onClick={() => onRecordSelect?.(lead, 'lead')}
                        >
                          <TableCell className="font-mono text-sm">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">{lead.name || 'Unknown'}</TableCell>
                          <TableCell>{lead.email || '-'}</TableCell>
                          <TableCell>{lead.phone || '-'}</TableCell>
                          <TableCell><Badge variant="outline">{lead.source}</Badge></TableCell>
                          <TableCell>
                            {lead.is_spam ? (
                              <Badge variant="destructive">Spam</Badge>
                            ) : (
                              <Badge className="bg-green-600">{lead.status || 'new'}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              {/* Calls Tab */}
              <TabsContent value="calls" className="mt-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2">
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCalls.map((call) => (
                        <TableRow
                          key={call.id}
                          className={`cursor-pointer hover:bg-muted/50 ${
                            selectedRecord?.id === call.id && selectedType === 'call'
                              ? 'bg-primary/10'
                              : ''
                          }`}
                          onClick={() => onRecordSelect?.(call, 'call')}
                        >
                          <TableCell className="font-mono text-sm">
                            {call.scheduled_at
                              ? new Date(call.scheduled_at).toLocaleString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {call.showed ? (
                              <Badge className="bg-green-600">Showed</Badge>
                            ) : (
                              <Badge variant="secondary">No Show</Badge>
                            )}
                          </TableCell>
                          <TableCell>{call.outcome || '-'}</TableCell>
                          <TableCell>
                            {call.is_reconnect ? (
                              <Badge variant="outline">Reconnect</Badge>
                            ) : (
                              <Badge variant="outline">Initial</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {new Date(call.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              {/* Ad Spend Tab */}
              <TabsContent value="adspend" className="mt-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2">
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Ad Spend</TableHead>
                        <TableHead className="text-right">Impressions</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAdSpend.map((metric) => (
                        <TableRow
                          key={metric.id}
                          className={`cursor-pointer hover:bg-muted/50 ${
                            selectedRecord?.id === metric.id && selectedType === 'adspend'
                              ? 'bg-primary/10'
                              : ''
                          }`}
                          onClick={() => onRecordSelect?.(metric, 'adspend')}
                        >
                          <TableCell className="font-mono">{metric.date}</TableCell>
                          <TableCell className="text-right font-mono text-chart-1">
                            ${Number(metric.ad_spend || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {(metric.impressions || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {(metric.clicks || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {(metric.ctr || 0).toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              {/* Funded Tab */}
              <TabsContent value="funded" className="mt-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2">
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Funded Date</TableHead>
                        <TableHead className="text-right">Time to Fund</TableHead>
                        <TableHead className="text-right">Calls</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedFunded.map((investor) => (
                        <TableRow
                          key={investor.id}
                          className={`cursor-pointer hover:bg-muted/50 ${
                            selectedRecord?.id === investor.id && selectedType === 'funded'
                              ? 'bg-primary/10'
                              : ''
                          }`}
                          onClick={() => onRecordSelect?.(investor, 'funded')}
                        >
                          <TableCell className="font-medium">{investor.name || 'Unknown'}</TableCell>
                          <TableCell className="text-right font-mono text-chart-2">
                            ${Number(investor.funded_amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {new Date(investor.funded_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {investor.time_to_fund_days !== null ? `${investor.time_to_fund_days}d` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">{investor.calls_to_fund || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Panel */}
      <div className="lg:col-span-1">
        <Card className="border-2 border-border sticky top-4">
          <CardHeader>
            <CardTitle className="text-lg">Record Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRecord ? (
              <RecordActivityPanel 
                record={selectedRecord} 
                type={selectedType || ''} 
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a record to view activity</p>
                <p className="text-sm">Click on any row to see details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Activity panel component
function RecordActivityPanel({ record, type }: { record: any; type: string }) {
  const getTimeline = () => {
    const events: { date: string; label: string; icon: React.ReactNode }[] = [];

    if (type === 'lead') {
      events.push({
        date: record.created_at,
        label: 'Lead Created',
        icon: <User className="h-4 w-4" />,
      });
      if (record.status && record.status !== 'new') {
        events.push({
          date: record.updated_at,
          label: `Status: ${record.status}`,
          icon: <Clock className="h-4 w-4" />,
        });
      }
    } else if (type === 'call') {
      events.push({
        date: record.created_at,
        label: 'Call Booked',
        icon: <Phone className="h-4 w-4" />,
      });
      if (record.scheduled_at) {
        events.push({
          date: record.scheduled_at,
          label: record.showed ? 'Showed' : 'No Show',
          icon: <Calendar className="h-4 w-4" />,
        });
      }
    } else if (type === 'funded') {
      if (record.first_contact_at) {
        events.push({
          date: record.first_contact_at,
          label: 'First Contact',
          icon: <User className="h-4 w-4" />,
        });
      }
      events.push({
        date: record.funded_at,
        label: `Funded: $${Number(record.funded_amount).toLocaleString()}`,
        icon: <TrendingUp className="h-4 w-4" />,
      });
    } else if (type === 'adspend') {
      events.push({
        date: record.date,
        label: `Ad Spend: $${Number(record.ad_spend || 0).toFixed(2)}`,
        icon: <DollarSign className="h-4 w-4" />,
      });
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const timeline = getTimeline();

  return (
    <div className="space-y-6">
      {/* Contact Info for Lead */}
      {type === 'lead' && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase">Contact Info</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{record.name || 'Unknown'}</span>
            </div>
            {record.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{record.email}</span>
              </div>
            )}
            {record.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{record.phone}</span>
              </div>
            )}
            {record.source && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">{record.source}</Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UTM Info */}
      {type === 'lead' && (record.utm_source || record.utm_campaign || record.utm_medium) && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground uppercase">UTM Data</h4>
          <div className="text-sm space-y-1">
            {record.utm_source && <p><span className="text-muted-foreground">Source:</span> {record.utm_source}</p>}
            {record.utm_medium && <p><span className="text-muted-foreground">Medium:</span> {record.utm_medium}</p>}
            {record.utm_campaign && <p><span className="text-muted-foreground">Campaign:</span> {record.utm_campaign}</p>}
            {record.utm_content && <p><span className="text-muted-foreground">Content:</span> {record.utm_content}</p>}
            {record.utm_term && <p><span className="text-muted-foreground">Term:</span> {record.utm_term}</p>}
          </div>
        </div>
      )}

      {/* Pipeline Value for Lead */}
      {type === 'lead' && record.pipeline_value > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground uppercase">Pipeline Value</h4>
          <p className="text-2xl font-bold text-chart-2">${Number(record.pipeline_value).toLocaleString()}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-muted-foreground uppercase">Activity Timeline</h4>
        <div className="relative pl-6 space-y-4">
          {timeline.map((event, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-6 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              {i < timeline.length - 1 && (
                <div className="absolute -left-4 top-4 w-0.5 h-full bg-border" />
              )}
              <p className="font-medium text-sm">{event.label}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(event.date).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
