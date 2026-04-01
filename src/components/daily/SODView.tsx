import { useState, useMemo } from 'react';
import { Task } from '@/hooks/useTasks';
import { DailyReport, TaskSnapshot, useClientNames } from '@/hooks/useDailyReports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Star, Sun, Phone } from 'lucide-react';
import { format, isToday, isBefore, startOfDay } from 'date-fns';

interface SODViewProps {
  tasks: Task[];
  isAccountManager: boolean;
  existingReport: DailyReport | null;
  onSubmit: (data: Omit<DailyReport, 'id' | 'created_at'>) => void;
  memberId: string;
  isSubmitting: boolean;
}

export function SODView({ tasks, isAccountManager, existingReport, onSubmit, memberId, isSubmitting }: SODViewProps) {
  const today = startOfDay(new Date());

  const [topPriorities, setTopPriorities] = useState<string[]>(
    existingReport?.top_priorities || []
  );
  const [touchpointCount, setTouchpointCount] = useState<number>(
    existingReport?.touchpoint_count || 0
  );
  const [touchpointNotes, setTouchpointNotes] = useState(
    existingReport?.touchpoint_notes || ''
  );

  // Separate blocked/overdue tasks from today's tasks
  const { blockedTasks, overdueTasks, todayTasks, futureTasks } = useMemo(() => {
    const blocked: Task[] = [];
    const overdue: Task[] = [];
    const todayList: Task[] = [];
    const future: Task[] = [];

    tasks.forEach(task => {
      if (task.status === 'blocked') {
        blocked.push(task);
      } else if (task.due_date && isBefore(new Date(task.due_date), today) && !isToday(new Date(task.due_date))) {
        overdue.push(task);
      } else if (task.due_date && isToday(new Date(task.due_date))) {
        todayList.push(task);
      } else {
        future.push(task);
      }
    });

    return { blockedTasks: blocked, overdueTasks: overdue, todayTasks: todayList, futureTasks: future };
  }, [tasks, today]);

  // Collect unique client IDs for name resolution
  const clientIds = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach(t => { if (t.client_id) ids.add(t.client_id); });
    return Array.from(ids);
  }, [tasks]);
  const { data: clientNames = {} } = useClientNames(clientIds);

  const togglePriority = (taskId: string) => {
    setTopPriorities(prev => {
      if (prev.includes(taskId)) return prev.filter(id => id !== taskId);
      return [...prev, taskId];
    });
  };

  const handleSubmit = () => {
    const tasksSnapshot: TaskSnapshot[] = tasks.map(t => ({
      task_id: t.id,
      title: t.title,
      client_id: t.client_id,
      client_name: t.client_id ? clientNames[t.client_id] : undefined,
      status: t.status === 'blocked' ? 'blocked' : 'in_progress',
    }));

    onSubmit({
      member_id: memberId,
      report_date: new Date().toISOString().slice(0, 10),
      report_type: 'sod',
      top_priorities: topPriorities,
      tasks_snapshot: tasksSnapshot,
      touchpoint_count: isAccountManager ? touchpointCount : null,
      touchpoint_notes: isAccountManager ? touchpointNotes : null,
      client_experience_done: null,
      wins_shared: null,
      self_assessment: null,
    });
  };

  const renderTaskRow = (task: Task, showPriorityPicker = true) => {
    const priorityIndex = topPriorities.indexOf(task.id);
    const isPriority = priorityIndex !== -1;

    return (
      <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
        {showPriorityPicker && (
          <button
            onClick={() => togglePriority(task.id)}
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              isPriority
                ? 'bg-primary text-primary-foreground'
                : 'border-2 border-muted-foreground/30 text-muted-foreground hover:border-primary'
            }`}
          >
            {isPriority ? priorityIndex + 1 : <Star className="h-3.5 w-3.5" />}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{task.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {task.client_id && clientNames[task.client_id] && (
              <span className="text-xs text-muted-foreground">{clientNames[task.client_id]}</span>
            )}
            {task.due_date && (
              <span className="text-xs text-muted-foreground">
                Due {format(new Date(task.due_date), 'MMM d')}
              </span>
            )}
          </div>
        </div>
        <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
          {task.priority}
        </Badge>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Blocked carry-overs */}
      {blockedTasks.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Blocked Tasks ({blockedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {blockedTasks.map(task => renderTaskRow(task))}
          </CardContent>
        </Card>
      )}

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              Overdue ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueTasks.map(task => renderTaskRow(task))}
          </CardContent>
        </Card>
      )}

      {/* Today's tasks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-500" />
            Today's Tasks ({todayTasks.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground">Click the star to pick your top priorities ({topPriorities.length} selected)</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {todayTasks.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No tasks due today</p>
          )}
          {todayTasks.map(task => renderTaskRow(task))}
        </CardContent>
      </Card>

      {/* Other open tasks */}
      {futureTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Other Open Tasks ({futureTasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {futureTasks.map(task => renderTaskRow(task))}
          </CardContent>
        </Card>
      )}

      {/* AM-only: Client Touchpoints */}
      {isAccountManager && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Client Touchpoints Planned
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">How many client touchpoints today?</Label>
              <Input
                type="number"
                min={0}
                value={touchpointCount}
                onChange={e => setTouchpointCount(parseInt(e.target.value) || 0)}
                className="w-24 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Notes (which clients to reach out to)</Label>
              <Textarea
                value={touchpointNotes}
                onChange={e => setTouchpointNotes(e.target.value)}
                placeholder="e.g. Follow up with Acme Corp, check in on Beta Fund..."
                className="mt-1"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" size="lg">
        {isSubmitting ? 'Submitting...' : existingReport ? 'Update SOD Report' : 'Submit SOD Report'}
      </Button>
    </div>
  );
}
