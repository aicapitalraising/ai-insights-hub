import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Check, X, Eye, Mail, RefreshCw, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

interface EmailParsingTabProps {
  clientId: string;
}

interface ParsedInvestor {
  id: string;
  client_id: string;
  email_subject: string | null;
  email_body: string | null;
  email_from: string | null;
  email_received_at: string | null;
  parsed_name: string | null;
  parsed_email: string | null;
  parsed_phone: string | null;
  parsed_amount: number | null;
  parsed_offering: string | null;
  parsed_class: string | null;
  parsed_accredited: boolean | null;
  raw_parsed_data: Record<string, any> | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  funded_investor_id: string | null;
  created_at: string;
}

interface EmailSettings {
  email_parsing_enabled: boolean;
  email_trusted_domains: string[];
  email_auto_approve_threshold: number;
  email_default_offering: string | null;
}

export function EmailParsingTab({ clientId }: EmailParsingTabProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingRecords, setPendingRecords] = useState<ParsedInvestor[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ParsedInvestor | null>(null);
  const [viewOriginalOpen, setViewOriginalOpen] = useState(false);
  
  // Settings state
  const [enabled, setEnabled] = useState(false);
  const [trustedDomains, setTrustedDomains] = useState('');
  const [autoApproveThreshold, setAutoApproveThreshold] = useState('0');
  const [defaultOffering, setDefaultOffering] = useState('');
  
  // Manual email paste
  const [manualSubject, setManualSubject] = useState('');
  const [manualBody, setManualBody] = useState('');
  const [manualFrom, setManualFrom] = useState('');
  const [parsing, setParsing] = useState(false);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-investor-email/${clientId}`;

  const loadData = async () => {
    setLoading(true);
    try {
      // Load settings
      const { data: settings } = await supabase
        .from('client_settings')
        .select('email_parsing_enabled, email_trusted_domains, email_auto_approve_threshold, email_default_offering')
        .eq('client_id', clientId)
        .maybeSingle();

      if (settings) {
        setEnabled(settings.email_parsing_enabled || false);
        setTrustedDomains((settings.email_trusted_domains || []).join(', '));
        setAutoApproveThreshold(String(settings.email_auto_approve_threshold || 0));
        setDefaultOffering(settings.email_default_offering || '');
      }

      // Load pending records
      const { data: records, error } = await supabase
        .from('email_parsed_investors')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingRecords((records || []) as ParsedInvestor[]);
    } catch (error) {
      console.error('Error loading email parsing data:', error);
      toast.error('Failed to load email parsing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clientId]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('client_settings')
        .update({
          email_parsing_enabled: enabled,
          email_trusted_domains: trustedDomains.split(',').map(d => d.trim()).filter(Boolean),
          email_auto_approve_threshold: parseFloat(autoApproveThreshold) || 0,
          email_default_offering: defaultOffering || null,
        })
        .eq('client_id', clientId);

      if (error) throw error;
      toast.success('Email parsing settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (record: ParsedInvestor) => {
    try {
      // Update email_parsed_investors status
      await supabase
        .from('email_parsed_investors')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'Manual Review',
        })
        .eq('id', record.id);

      // Update funded_investors approval status
      if (record.funded_investor_id) {
        await supabase
          .from('funded_investors')
          .update({ approval_status: 'approved' })
          .eq('id', record.funded_investor_id);
      }

      toast.success(`Approved investment from ${record.parsed_name}`);
      queryClient.invalidateQueries({ queryKey: ['funded-investors'] });
      loadData();
    } catch (error) {
      console.error('Error approving record:', error);
      toast.error('Failed to approve record');
    }
  };

  const handleReject = async (record: ParsedInvestor) => {
    try {
      // Update email_parsed_investors status
      await supabase
        .from('email_parsed_investors')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'Manual Review',
        })
        .eq('id', record.id);

      // Delete the funded_investors record
      if (record.funded_investor_id) {
        await supabase
          .from('funded_investors')
          .delete()
          .eq('id', record.funded_investor_id);
      }

      toast.success(`Rejected investment from ${record.parsed_name}`);
      queryClient.invalidateQueries({ queryKey: ['funded-investors'] });
      loadData();
    } catch (error) {
      console.error('Error rejecting record:', error);
      toast.error('Failed to reject record');
    }
  };

  const handleManualParse = async () => {
    if (!manualBody.trim()) {
      toast.error('Please paste the email body');
      return;
    }

    setParsing(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: manualSubject,
          body: manualBody,
          from: manualFrom,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to parse email');
      }

      toast.success(`Email parsed successfully! ${result.approvalStatus === 'approved' ? '(Auto-approved)' : '(Pending approval)'}`);
      setManualSubject('');
      setManualBody('');
      setManualFrom('');
      queryClient.invalidateQueries({ queryKey: ['funded-investors'] });
      loadData();
    } catch (error) {
      console.error('Error parsing email:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse email');
    } finally {
      setParsing(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied to clipboard');
  };

  const pendingCount = pendingRecords.filter(r => r.status === 'pending').length;

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="settings">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="manual">Manual Parse</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Parsing Configuration
              </CardTitle>
              <CardDescription>
                Configure automatic parsing of investor portal notification emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled">Enable Email Parsing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow automatic parsing of forwarded investor emails
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trustedDomains">Trusted Email Domains</Label>
                <Input
                  id="trustedDomains"
                  value={trustedDomains}
                  onChange={(e) => setTrustedDomains(e.target.value)}
                  placeholder="investnext.com, bluecapital.com"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of trusted sender domains
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoApproveThreshold">Auto-Approve Threshold ($)</Label>
                <Input
                  id="autoApproveThreshold"
                  type="number"
                  value={autoApproveThreshold}
                  onChange={(e) => setAutoApproveThreshold(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Investments below this amount are auto-approved (0 = all require manual approval)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultOffering">Default Offering Name</Label>
                <Input
                  id="defaultOffering"
                  value={defaultOffering}
                  onChange={(e) => setDefaultOffering(e.target.value)}
                  placeholder="e.g., Blue Capital RV Fund"
                />
                <p className="text-xs text-muted-foreground">
                  Pre-fill offering name if not detected in email
                </p>
              </div>

              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Forwarding Setup</CardTitle>
              <CardDescription>
                Set up your investor portal to forward notification emails to this endpoint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Configure your investor portal to send webhook notifications</li>
                  <li>Or set up email forwarding using a service like Zapier or Make</li>
                  <li>Send POST requests with JSON body: {"{"} subject, body, from {"}"}</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  Review and approve or reject parsed investor emails
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {pendingRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No parsed emails yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Offering</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.parsed_name || 'Unknown'}</p>
                            {record.parsed_email && (
                              <p className="text-xs text-muted-foreground">{record.parsed_email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          ${(record.parsed_amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>{record.parsed_offering || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.status === 'approved' ? 'success' :
                              record.status === 'rejected' ? 'destructive' :
                              'outline'
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {record.created_at ? format(new Date(record.created_at), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedRecord(record);
                                setViewOriginalOpen(true);
                              }}
                              title="View original email"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {record.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleApprove(record)}
                                  className="text-chart-4 hover:text-chart-4"
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReject(record)}
                                  className="text-destructive hover:text-destructive"
                                  title="Reject"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Email Parsing</CardTitle>
              <CardDescription>
                Paste an investor notification email to manually parse and create a funded investor record
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manualFrom">From (optional)</Label>
                <Input
                  id="manualFrom"
                  value={manualFrom}
                  onChange={(e) => setManualFrom(e.target.value)}
                  placeholder="notifications@investorportal.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manualSubject">Subject (optional)</Label>
                <Input
                  id="manualSubject"
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  placeholder="New Investment in Blue Capital RV Fund"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manualBody">Email Body *</Label>
                <Textarea
                  id="manualBody"
                  value={manualBody}
                  onChange={(e) => setManualBody(e.target.value)}
                  placeholder="Paste the full email content here..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <Button onClick={handleManualParse} disabled={parsing || !manualBody.trim()}>
                {parsing ? 'Parsing...' : 'Parse Email'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Original Email Dialog */}
      <Dialog open={viewOriginalOpen} onOpenChange={setViewOriginalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Original Email</DialogTitle>
            <DialogDescription>
              {selectedRecord?.email_subject || 'No subject'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">From</p>
                  <p>{selectedRecord.email_from || '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Received</p>
                  <p>
                    {selectedRecord.email_received_at 
                      ? format(new Date(selectedRecord.email_received_at), 'MMM d, yyyy h:mm a')
                      : '-'}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-medium text-muted-foreground mb-2">Parsed Data</p>
                <div className="grid grid-cols-2 gap-2 text-sm border-2 border-border p-3 bg-muted/30">
                  <div><span className="text-muted-foreground">Name:</span> {selectedRecord.parsed_name || '-'}</div>
                  <div><span className="text-muted-foreground">Amount:</span> ${(selectedRecord.parsed_amount || 0).toLocaleString()}</div>
                  <div><span className="text-muted-foreground">Email:</span> {selectedRecord.parsed_email || '-'}</div>
                  <div><span className="text-muted-foreground">Phone:</span> {selectedRecord.parsed_phone || '-'}</div>
                  <div><span className="text-muted-foreground">Offering:</span> {selectedRecord.parsed_offering || '-'}</div>
                  <div><span className="text-muted-foreground">Class:</span> {selectedRecord.parsed_class || '-'}</div>
                  <div><span className="text-muted-foreground">Accredited:</span> {selectedRecord.parsed_accredited ? 'Yes' : 'No'}</div>
                </div>
              </div>

              <div>
                <p className="font-medium text-muted-foreground mb-2">Email Body</p>
                <pre className="text-sm whitespace-pre-wrap border-2 border-border p-3 bg-muted/30 max-h-[300px] overflow-y-auto">
                  {selectedRecord.email_body || 'No content'}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
