import { useState, useMemo } from 'react';
import { useTeamMember } from '@/contexts/TeamMemberContext';
import { useAgencyMembers } from '@/hooks/useTasks';
import { useMemberTasks, useTodayReport, useReportHistory, useSubmitDailyReport } from '@/hooks/useDailyReports';
import { SODView } from '@/components/daily/SODView';
import { EODView } from '@/components/daily/EODView';
import { ReportHistory } from '@/components/daily/ReportHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Moon, History, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

function getDefaultMode(): 'sod' | 'eod' {
  const hour = new Date().getHours();
  return hour < 14 ? 'sod' : 'eod';
}

export default function DailyReportPage() {
  const navigate = useNavigate();
  const { currentMember } = useTeamMember();
  const { data: members = [] } = useAgencyMembers();
  const [mode, setMode] = useState<'sod' | 'eod' | 'history'>(getDefaultMode());

  // Allow member override if not logged in
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const activeMemberId = selectedMemberId || currentMember?.id || null;

  // Determine if the active member is in Account Management pod
  const activeMember = useMemo(() => {
    return members.find(m => m.id === activeMemberId);
  }, [members, activeMemberId]);

  const isAccountManager = useMemo(() => {
    if (!activeMember?.pod) return false;
    return activeMember.pod.name.toLowerCase().includes('account management');
  }, [activeMember]);

  const reportType = mode === 'history' ? undefined : mode;
  const { data: tasks = [], isLoading: tasksLoading } = useMemberTasks(activeMemberId || undefined);
  const { data: existingReport = null } = useTodayReport(activeMemberId || undefined, reportType);
  const { data: reportHistory = [], isLoading: historyLoading } = useReportHistory(activeMemberId || undefined);
  const submitReport = useSubmitDailyReport();

  if (!activeMemberId && members.length > 0) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <h2 className="text-lg font-semibold">Select Your Name</h2>
            <Select onValueChange={setSelectedMemberId}>
              <SelectTrigger className="w-64 mx-auto">
                <SelectValue placeholder="Choose team member..." />
              </SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Daily Report</h1>
            <p className="text-sm text-muted-foreground">
              {activeMember?.name || 'Team Member'}
              {activeMember?.pod && ` • ${activeMember.pod.name}`}
            </p>
          </div>
        </div>

        {/* Member switcher */}
        {members.length > 1 && (
          <Select value={activeMemberId || undefined} onValueChange={setSelectedMemberId}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {members.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Mode tabs */}
      <Tabs value={mode} onValueChange={v => setMode(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sod" className="flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5" /> SOD
          </TabsTrigger>
          <TabsTrigger value="eod" className="flex items-center gap-1.5">
            <Moon className="h-3.5 w-3.5" /> EOD
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sod" className="mt-4">
          {tasksLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading tasks...</p>
          ) : (
            <SODView
              tasks={tasks}
              isAccountManager={isAccountManager}
              existingReport={existingReport}
              onSubmit={data => submitReport.mutate({ report: data, member_name: activeMember?.name || currentMember?.name || 'Unknown' })}
              memberId={activeMemberId!}
              isSubmitting={submitReport.isPending}
            />
          )}
        </TabsContent>

        <TabsContent value="eod" className="mt-4">
          {tasksLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading tasks...</p>
          ) : (
            <EODView
              tasks={tasks}
              isAccountManager={isAccountManager}
              existingReport={existingReport}
              onSubmit={data => submitReport.mutate({ report: data, member_name: activeMember?.name || currentMember?.name || 'Unknown' })}
              memberId={activeMemberId!}
              memberName={activeMember?.name || currentMember?.name || 'Unknown'}
              isSubmitting={submitReport.isPending}
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <ReportHistory reports={reportHistory} isLoading={historyLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
