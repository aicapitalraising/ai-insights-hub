import { useState, useMemo } from 'react';
import { Task, useUpdateTask, useAddTaskComment } from '@/hooks/useTasks';
import { DailyReport, TaskSnapshot, useClientNames } from '@/hooks/useDailyReports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { CheckCircle2, Clock, AlertTriangle, Trophy, Phone, Star } from 'lucide-react';

interface EODViewProps {
  tasks: Task[];
  isAccountManager: boolean;
  existingReport: DailyReport | null;
  onSubmit: (data: Omit<DailyReport, 'id' | 'created_at'>) => void;
  memberId: string;
  isSubmitting: boolean;
}

type TaskStatus = 'completed' | 'in_progress' | 'blocked';

interface TaskEntry {
  task_id: string;
  status: TaskStatus;
  blocker_reason: string;
  blocker_next_step: string;
}

export function EODView({ tasks, isAccountManager, existingReport, onSubmit, memberId, isSubmitting }: EODViewProps) {
  // Initialize task entries from existing report or defaults
  const initialEntries = useMemo(() => {
    const map: Record<string, TaskEntry> = {};
    if (existingReport?.tasks_snapshot) {
      (existingReport.tasks_snapshot as TaskSnapshot[]).forEach(s => {
        map[s.task_id] = {
          task_id: s.task_id,
          status: s.status,
          blocker_reason: s.blocker_reason || '',
          blocker_next_step: s.blocker_next_step || '',
        };
      });
    }
    tasks.forEach(t => {
      if (!map[t.id]) {
        map[t.id] = {
          task_id: t.id,
          status: t.status === 'completed' ? 'completed' : t.status === 'blocked' ? 'blocked' : 'in_progress',
          blocker_reason: '',
          blocker_next_step: '',
        };
      }
    });
    return map;
  }, [tasks, existingReport]);

  const [taskEntries, setTaskEntries] = useState<Record<string, TaskEntry>>(initialEntries);
  const [winsShared, setWinsShared] = useState(existingReport?.wins_shared || '');
  const [selfAssessment, setSelfAssessment] = useState(existingReport?.self_assessment || 5);
  const [touchpointCount, setTouchpointCount] = useState(existingReport?.touchpoint_count || 0);
  const [touchpointNotes, setTouchpointNotes] = useState(existingReport?.touchpoint_notes || '');
  const [clientExperienceDone, setClientExperienceDone] = useState(existingReport?.client_experience_done || false);

  // Client name resolution
  const clientIds = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach(t => { if (t.client_id) ids.add(t.client_id); });
    return Array.from(ids);
  }, [tasks]);
  const { data: clientNames = {} } = useClientNames(clientIds);

  const updateEntry = (taskId: string, field: keyof TaskEntry, value: string) => {
    setTaskEntries(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], [field]: value },
    }));
  };

  // Derive problem clients from blocked tasks
  const problemClients = useMemo(() => {
    const blockedByClient: Record<string, { clientName: string; tasks: string[] }> = {};
    Object.values(taskEntries).forEach(entry => {
      if (entry.status === 'blocked') {
        const task = tasks.find(t => t.id === entry.task_id);
        if (task?.client_id) {
          const name = clientNames[task.client_id] || 'Unknown Client';
          if (!blockedByClient[task.client_id]) {
            blockedByClient[task.client_id] = { clientName: name, tasks: [] };
          }
          blockedByClient[task.client_id].tasks.push(task.title);
        }
      }
    });
    return blockedByClient;
  }, [taskEntries, tasks, clientNames]);

  const statusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'blocked': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  const handleSubmit = () => {
    const snapshot: TaskSnapshot[] = Object.values(taskEntries).map(entry => {
      const task = tasks.find(t => t.id === entry.task_id);
      return {
        task_id: entry.task_id,
        title: task?.title || '',
        client_id: task?.client_id || null,
        client_name: task?.client_id ? clientNames[task.client_id] : undefined,
        status: entry.status,
        blocker_reason: entry.status === 'blocked' ? entry.blocker_reason : undefined,
        blocker_next_step: entry.status === 'blocked' ? entry.blocker_next_step : undefined,
      };
    });

    onSubmit({
      member_id: memberId,
      report_date: new Date().toISOString().slice(0, 10),
      report_type: 'eod',
      top_priorities: [],
      tasks_snapshot: snapshot,
      touchpoint_count: isAccountManager ? touchpointCount : null,
      touchpoint_notes: isAccountManager ? touchpointNotes : null,
      client_experience_done: isAccountManager ? clientExperienceDone : null,
      wins_shared: winsShared || null,
      self_assessment: selfAssessment,
    });
  };

  return (
    <div className="space-y-6">
      {/* Task Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Task Status Update ({tasks.length} tasks)</CardTitle>
          <p className="text-xs text-muted-foreground">Set each task's end-of-day status. Blocked tasks require a reason.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No tasks assigned</p>
          )}
          {tasks.map(task => {
            const entry = taskEntries[task.id];
            if (!entry) return null;

            return (
              <div key={task.id} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-center gap-3">
                  {statusIcon(entry.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    {task.client_id && clientNames[task.client_id] && (
                      <span className="text-xs text-muted-foreground">{clientNames[task.client_id]}</span>
                    )}
                  </div>
                  <Select
                    value={entry.status}
                    onValueChange={v => updateEntry(task.id, 'status', v)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">✅ Completed</SelectItem>
                      <SelectItem value="in_progress">🔄 In Progress</SelectItem>
                      <SelectItem value="blocked">🚫 Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {entry.status === 'blocked' && (
                  <div className="pl-7 space-y-2">
                    <div>
                      <Label className="text-xs">Root Cause</Label>
                      <Input
                        value={entry.blocker_reason}
                        onChange={e => updateEntry(task.id, 'blocker_reason', e.target.value)}
                        placeholder="What's blocking this task?"
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Next Step</Label>
                      <Input
                        value={entry.blocker_next_step}
                        onChange={e => updateEntry(task.id, 'blocker_next_step', e.target.value)}
                        placeholder="What needs to happen to unblock?"
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Problem Clients (auto-derived) */}
      {Object.keys(problemClients).length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Problem Clients
            </CardTitle>
            <p className="text-xs text-muted-foreground">Auto-detected from blocked tasks</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(problemClients).map(([clientId, info]) => (
              <div key={clientId} className="p-2 rounded bg-background border border-border">
                <p className="font-medium text-sm">{info.clientName}</p>
                <ul className="mt-1 space-y-0.5">
                  {info.tasks.map((title, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {title}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AM-only: Client Touchpoints */}
      {isAccountManager && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Client Touchpoints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">1-on-1 Client/Prospect Touchpoints</Label>
              <Input
                type="number"
                min={0}
                value={touchpointCount}
                onChange={e => setTouchpointCount(parseInt(e.target.value) || 0)}
                className="w-24 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Touchpoint Notes</Label>
              <Textarea
                value={touchpointNotes}
                onChange={e => setTouchpointNotes(e.target.value)}
                placeholder="Who did you reach out to today?"
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={clientExperienceDone}
                onCheckedChange={setClientExperienceDone}
              />
              <Label className="text-sm">
                3-Touch Rule Executed (Slack, Loom, VN)
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wins Shared */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Wins Shared
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={winsShared}
            onChange={e => setWinsShared(e.target.value)}
            placeholder="Results, cost-per stats, testimonials, closed deals..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Self Assessment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Self-Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-4">
            <Slider
              value={[selfAssessment]}
              onValueChange={([v]) => setSelfAssessment(v)}
              min={1}
              max={10}
              step={1}
              className="flex-1"
            />
            <span className="text-2xl font-bold text-primary w-8 text-center">{selfAssessment}</span>
          </div>
          <p className="text-xs text-muted-foreground">Rate your productivity today (1 = worst, 10 = best)</p>
        </CardContent>
      </Card>

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" size="lg">
        {isSubmitting ? 'Submitting...' : existingReport ? 'Update EOD Report' : 'Submit EOD Report'}
      </Button>
    </div>
  );
}
