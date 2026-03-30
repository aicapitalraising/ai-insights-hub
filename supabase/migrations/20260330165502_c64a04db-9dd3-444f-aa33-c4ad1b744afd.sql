CREATE TABLE IF NOT EXISTS public.client_assignments (
  client_id uuid NOT NULL PRIMARY KEY,
  media_buyer text DEFAULT NULL,
  account_manager text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.client_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access client_assignments"
  ON public.client_assignments FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);