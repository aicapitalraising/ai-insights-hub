import { useMemo } from 'react';
import { useOnboardingTasks, useToggleOnboardingTask } from '@/hooks/useOnboardingTasks';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ClipboardList } from 'lucide-react';

interface OnboardingChecklistProps {
  clientId: string;
}

export function OnboardingChecklist({ clientId }: OnboardingChecklistProps) {
  const { data: tasks = [], isLoading } = useOnboardingTasks(clientId);
  const toggle = useToggleOnboardingTask();

  const grouped = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    tasks.forEach(t => {
      const list = map.get(t.category) || [];
      list.push(t);
      map.set(t.category, list);
    });
    return map;
  }, [tasks]);

  if (isLoading || tasks.length === 0) return null;

  const completedCount = tasks.filter(t => t.completed).length;
  const percent = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-bold">Onboarding Checklist</h2>
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {completedCount}/{tasks.length} completed
        </span>
      </div>
      <Progress value={percent} className="h-2" />

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from(grouped.entries()).map(([category, items]) => {
          const catDone = items.filter(i => i.completed).length;
          return (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  {category}
                  <span className="text-xs font-normal text-muted-foreground">
                    {catDone}/{items.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map(task => (
                  <label
                    key={task.id}
                    className="flex items-start gap-2 cursor-pointer group"
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) =>
                        toggle.mutate({ id: task.id, completed: !!checked })
                      }
                      className="mt-0.5"
                    />
                    <span className={`text-sm leading-tight ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </span>
                  </label>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
