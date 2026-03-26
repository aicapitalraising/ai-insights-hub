import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Loader2, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/db';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';

interface ExtractedTask {
  title: string;
  description?: string;
  priority: string;
  selected: boolean;
}

interface VoiceTaskApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: ExtractedTask[];
  clientId: string;
  clientName: string;
  transcript: string;
  summary: string;
}

export function VoiceTaskApprovalDialog({
  open,
  onOpenChange,
  tasks: initialTasks,
  clientId,
  clientName,
  transcript,
  summary,
}: VoiceTaskApprovalDialogProps) {
  const [tasks, setTasks] = useState<ExtractedTask[]>(
    initialTasks.map(t => ({ ...t, selected: true }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const dueDate = addDays(new Date(), 2);

  const toggleTask = (index: number) => {
    setTasks(prev =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const updateTaskTitle = (index: number, title: string) => {
    setTasks(prev =>
      prev.map((t, i) => (i === index ? { ...t, title } : t))
    );
  };

  const updateTaskDescription = (index: number, description: string) => {
    setTasks(prev =>
      prev.map((t, i) => (i === index ? { ...t, description } : t))
    );
  };

  const handleApprove = async () => {
    const selectedTasks = tasks.filter(t => t.selected && t.title.trim());
    if (selectedTasks.length === 0) {
      toast.error('Select at least one task to add');
      return;
    }

    setIsSubmitting(true);
    try {
      const rows = selectedTasks.map(t => ({
        client_id: clientId,
        title: t.title,
        description: t.description || `Auto-created from voice note for ${clientName}`,
        priority: t.priority || 'medium',
        status: 'todo',
        due_date: dueDate.toISOString(),
      }));

      const { error } = await supabase.from('tasks').insert(rows);
      if (error) throw error;

      toast.success(`${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''} added to board`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to create tasks:', err);
      toast.error('Failed to create tasks');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = tasks.filter(t => t.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Voice Note Tasks — {clientName}
          </DialogTitle>
          <DialogDescription>
            Review the tasks extracted from your voice note. Approve them to add to the task board with a 2-day due date.
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        {summary && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Summary</p>
            {summary}
          </div>
        )}

        {/* Due date indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Due date: <span className="font-medium text-foreground">{format(dueDate, 'MMM d, yyyy')}</span></span>
          <span className="mx-1">•</span>
          <User className="h-4 w-4" />
          <span>Auto-assigned to <span className="font-medium text-foreground">{clientName}</span></span>
        </div>

        {/* Tasks list */}
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 transition-colors ${
                task.selected ? 'border-primary/30 bg-primary/5' : 'border-border opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.selected}
                  onCheckedChange={() => toggleTask(index)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <Input
                    value={task.title}
                    onChange={e => updateTaskTitle(index, e.target.value)}
                    className="font-medium"
                    placeholder="Task title"
                  />
                  <Textarea
                    value={task.description || ''}
                    onChange={e => updateTaskDescription(index, e.target.value)}
                    className="text-sm min-h-[60px]"
                    placeholder="Task description (optional)"
                  />
                  <Badge
                    variant={
                      task.priority === 'high' ? 'destructive' :
                      task.priority === 'low' ? 'secondary' : 'default'
                    }
                    className="text-xs"
                  >
                    {task.priority}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <p className="text-center text-muted-foreground py-6">No tasks were found in this voice note.</p>
        )}

        {/* Transcript collapsible */}
        {transcript && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              View full transcript
            </summary>
            <p className="mt-2 p-3 bg-muted/50 rounded-lg whitespace-pre-wrap text-muted-foreground">
              {transcript}
            </p>
          </details>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Dismiss
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isSubmitting || selectedCount === 0}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckSquare className="h-4 w-4" />
            )}
            Add {selectedCount} Task{selectedCount !== 1 ? 's' : ''} to Board
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
