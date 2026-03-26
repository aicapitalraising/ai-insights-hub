import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Loader2, CheckCircle2, Users, Clock } from 'lucide-react';
import { ALL_TASK_TEMPLATES, TaskTemplate, TaskTemplateItem } from '@/lib/taskTemplates';
import { supabase } from '@/integrations/supabase/db';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAgencyMembers } from '@/hooks/useTasks';
import { addDays } from 'date-fns';

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export function ApplyTemplateDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
}: ApplyTemplateDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const queryClient = useQueryClient();
  const { data: members = [] } = useAgencyMembers();

  const findMemberByName = (name: string) => {
    const lower = name.toLowerCase().trim();
    return members.find(m =>
      m.name.toLowerCase() === lower ||
      m.name.toLowerCase().includes(lower) ||
      lower.includes(m.name.toLowerCase().split(' ')[0])
    );
  };

  const handleApply = async () => {
    if (!selectedTemplate) return;

    setIsApplying(true);
    try {
      const dueDate = addDays(new Date(), 7).toISOString();

      // Group tasks by category
      const categorized = selectedTemplate.tasks.reduce<Record<string, typeof selectedTemplate.tasks>>((acc, t) => {
        if (!acc[t.category]) acc[t.category] = [];
        acc[t.category].push(t);
        return acc;
      }, {});

      let totalCreated = 0;

      for (const [category, tasks] of Object.entries(categorized)) {
        // 1. Create the parent task for this category
        const { data: parentTask, error: parentError } = await supabase
          .from('tasks')
          .insert({
            client_id: clientId,
            title: category,
            description: `[${selectedTemplate.name}] — ${tasks.length} subtasks`,
            priority: tasks.some(t => t.priority === 'high') ? 'high' : 'medium',
            status: 'todo',
            due_date: dueDate,
          })
          .select('id')
          .single();

        if (parentError || !parentTask) {
          console.error('Failed to create parent task:', parentError);
          continue;
        }

        // Assign parent task to all unique assignees from its subtasks
        const parentAssigneeNames = [...new Set(tasks.flatMap(t => t.assignees))];
        const parentAssigneeRows = parentAssigneeNames
          .map(name => {
            const member = findMemberByName(name);
            return member ? { task_id: parentTask.id, member_id: member.id, pod_id: null } : null;
          })
          .filter(Boolean) as { task_id: string; member_id: string; pod_id: null }[];

        if (parentAssigneeRows.length > 0) {
          await supabase.from('task_assignees').insert(parentAssigneeRows);
        }

        // 2. Create subtasks under this parent
        const subtaskRows = tasks.map(t => ({
          client_id: clientId,
          title: t.title,
          description: `Auto-created from "${selectedTemplate.name}" template`,
          priority: t.priority,
          status: 'todo',
          due_date: dueDate,
          parent_task_id: parentTask.id,
        }));

        const { data: createdSubtasks, error: subError } = await supabase
          .from('tasks')
          .insert(subtaskRows)
          .select('id, title');

        if (subError) {
          console.error('Failed to create subtasks for', category, subError);
          continue;
        }

        totalCreated += (createdSubtasks?.length || 0) + 1; // +1 for parent

        // 3. Assign members to each subtask
        if (createdSubtasks && createdSubtasks.length > 0) {
          const assigneeRows: { task_id: string; member_id: string; pod_id: null }[] = [];

          createdSubtasks.forEach((sub, index) => {
            const templateTask = tasks[index];
            if (templateTask?.assignees) {
              templateTask.assignees.forEach(assigneeName => {
                const member = findMemberByName(assigneeName);
                if (member) {
                  assigneeRows.push({ task_id: sub.id, member_id: member.id, pod_id: null });
                }
              });
            }
          });

          if (assigneeRows.length > 0) {
            await supabase.from('task_assignees').insert(assigneeRows);
          }
        }
      }

      toast.success(`Applied "${selectedTemplate.name}" — ${totalCreated} tasks created for ${clientName}`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      onOpenChange(false);
      setSelectedTemplate(null);
    } catch (err) {
      console.error('Failed to apply template:', err);
      toast.error('Failed to apply template');
    } finally {
      setIsApplying(false);
    }
  };

  const categorizedTasks = selectedTemplate
    ? selectedTemplate.tasks.reduce<Record<string, TaskTemplateItem[]>>((acc, t) => {
        if (!acc[t.category]) acc[t.category] = [];
        acc[t.category].push(t);
        return acc;
      }, {})
    : {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Apply Task Template
          </DialogTitle>
          <DialogDescription>
            Select a template to auto-create tasks for <strong>{clientName}</strong> with a 7-day due date and pre-assigned team members.
          </DialogDescription>
        </DialogHeader>

        {!selectedTemplate ? (
          /* Template selection */
          <div className="space-y-3">
            {ALL_TASK_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className="w-full text-left border rounded-lg p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  </div>
                  <Badge variant="secondary">{template.tasks.length} tasks</Badge>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Template preview */
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedTemplate.name}</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 7-day due date</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Auto-assigned</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                ← Back
              </Button>
            </div>

            <ScrollArea className="flex-1 max-h-[400px]">
              <div className="space-y-4 pr-4">
                {Object.entries(categorizedTasks).map(([category, tasks]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {category}
                    </h4>
                    <div className="space-y-1.5">
                      {tasks.map((task, i) => {
                        const matchedAssignees = task.assignees
                          .map(a => ({ name: a, found: !!findMemberByName(a) }));

                        return (
                          <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm truncate">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <Badge
                                variant={task.priority === 'high' ? 'destructive' : task.priority === 'low' ? 'secondary' : 'default'}
                                className="text-[10px] px-1.5 py-0"
                              >
                                {task.priority}
                              </Badge>
                              {matchedAssignees.length > 0 && (
                                <div className="flex gap-1">
                                  {matchedAssignees.map((a, j) => (
                                    <Badge
                                      key={j}
                                      variant="outline"
                                      className={`text-[10px] px-1.5 py-0 ${a.found ? '' : 'border-amber-500/50 text-amber-600'}`}
                                      title={a.found ? `Will assign to ${a.name}` : `"${a.name}" not found in team`}
                                    >
                                      {a.name.split(' ')[0]}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Separator className="mt-3" />
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleApply} disabled={isApplying} className="gap-2">
                {isApplying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Apply {selectedTemplate.tasks.length} Tasks
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
