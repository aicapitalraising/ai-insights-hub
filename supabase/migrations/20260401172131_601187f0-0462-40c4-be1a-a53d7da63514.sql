
-- Add missing columns to tasks table
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'todo',
  ADD COLUMN IF NOT EXISTS assigned_to text,
  ADD COLUMN IF NOT EXISTS assigned_client_name text,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS meeting_id uuid,
  ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS show_subtasks_to_client boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visible_to_client boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_type text,
  ADD COLUMN IF NOT EXISTS recurrence_interval integer,
  ADD COLUMN IF NOT EXISTS recurrence_next_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid;

-- Create agency_pods table
CREATE TABLE IF NOT EXISTS public.agency_pods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.agency_pods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access agency_pods" ON public.agency_pods FOR ALL TO public USING (true) WITH CHECK (true);

-- Create agency_members table
CREATE TABLE IF NOT EXISTS public.agency_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'member',
  pod_id uuid REFERENCES public.agency_pods(id) ON DELETE SET NULL,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access agency_members" ON public.agency_members FOR ALL TO public USING (true) WITH CHECK (true);

-- Create task_assignees table
CREATE TABLE IF NOT EXISTS public.task_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.agency_members(id) ON DELETE CASCADE,
  pod_id uuid REFERENCES public.agency_pods(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(task_id, member_id)
);
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access task_assignees" ON public.task_assignees FOR ALL TO public USING (true) WITH CHECK (true);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text,
  comment_type text NOT NULL DEFAULT 'text',
  audio_url text,
  duration_seconds integer,
  transcript text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access task_comments" ON public.task_comments FOR ALL TO public USING (true) WITH CHECK (true);

-- Create task_files table
CREATE TABLE IF NOT EXISTS public.task_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  uploaded_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access task_files" ON public.task_files FOR ALL TO public USING (true) WITH CHECK (true);

-- Create task_history table
CREATE TABLE IF NOT EXISTS public.task_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_value text,
  new_value text,
  changed_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access task_history" ON public.task_history FOR ALL TO public USING (true) WITH CHECK (true);
