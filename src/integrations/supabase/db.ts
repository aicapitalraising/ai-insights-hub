/**
 * Loose-typed re-export of the Supabase client.
 * Use this import when accessing tables that may not yet be reflected
 * in the auto-generated Database type (e.g. tables from the original project).
 *
 * import { supabase } from "@/integrations/supabase/db";
 */
import { supabase as _supabase } from './client';
import type { SupabaseClient } from '@supabase/supabase-js';

export const supabase: SupabaseClient<any, 'public', any> = _supabase as any;
