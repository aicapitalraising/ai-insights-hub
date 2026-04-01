import { DailyReport, TaskSnapshot } from '@/hooks/useDailyReports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle2, Clock, AlertTriangle, Sun, Moon } from 'lucide-react';

interface ReportHistoryProps {
  reports: DailyReport[];
  isLoading: boolean;
}

export function ReportHistory({ reports, isLoading }: ReportHistoryProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground text-center py-8">Loading history...</p>;
  }

  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No reports submitted yet</p>;
  }

  return (
    <div className="space-y-4">
      {reports.map(report => {
        const snapshot = (report.tasks_snapshot || []) as TaskSnapshot[];
        const completed = snapshot.filter(s => s.status === 'completed').length;
        const blocked = snapshot.filter(s => s.status === 'blocked').length;
        const inProgress = snapshot.filter(s => s.status === 'in_progress').length;

        return (
          <Card key={report.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  {report.report_type === 'sod' ? (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-indigo-500" />
                  )}
                  {format(new Date(report.report_date), 'EEEE, MMM d, yyyy')}
                  <Badge variant={report.report_type === 'sod' ? 'default' : 'secondary'} className="text-xs">
                    {report.report_type.toUpperCase()}
                  </Badge>
                </CardTitle>
                {report.self_assessment && (
                  <span className="text-xs font-medium text-muted-foreground">
                    Score: {report.self_assessment}/10
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Task summary */}
              <div className="flex items-center gap-4 text-xs">
                {completed > 0 && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" /> {completed} completed
                  </span>
                )}
                {inProgress > 0 && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Clock className="h-3 w-3" /> {inProgress} in progress
                  </span>
                )}
                {blocked > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertTriangle className="h-3 w-3" /> {blocked} blocked
                  </span>
                )}
              </div>

              {/* Top priorities (SOD) */}
              {report.report_type === 'sod' && report.top_priorities && (report.top_priorities as string[]).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Top Priorities:</p>
                  <div className="space-y-1">
                    {snapshot
                      .filter(s => (report.top_priorities as string[]).includes(s.task_id))
                      .map((s, i) => (
                        <p key={s.task_id} className="text-xs">
                          {i + 1}. {s.title} {s.client_name && <span className="text-muted-foreground">— {s.client_name}</span>}
                        </p>
                      ))}
                  </div>
                </div>
              )}

              {/* Blocked tasks detail */}
              {blocked > 0 && (
                <div>
                  <p className="text-xs font-medium text-destructive mb-1">Blocked:</p>
                  {snapshot.filter(s => s.status === 'blocked').map(s => (
                    <div key={s.task_id} className="text-xs mb-1">
                      <span className="font-medium">{s.title}</span>
                      {s.client_name && <span className="text-muted-foreground"> — {s.client_name}</span>}
                      {s.blocker_reason && <p className="text-muted-foreground ml-2">Reason: {s.blocker_reason}</p>}
                      {s.blocker_next_step && <p className="text-muted-foreground ml-2">Next: {s.blocker_next_step}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Wins */}
              {report.wins_shared && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Wins:</p>
                  <p className="text-xs">{report.wins_shared}</p>
                </div>
              )}

              {/* Touchpoints */}
              {report.touchpoint_count != null && report.touchpoint_count > 0 && (
                <p className="text-xs text-muted-foreground">
                  Touchpoints: {report.touchpoint_count}
                  {report.client_experience_done && ' • 3-Touch ✓'}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
