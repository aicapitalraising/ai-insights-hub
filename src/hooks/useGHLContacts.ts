import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GHLContact {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  source: string;
  dateAdded: string;
  lastActivity: string;
  type: string;
  assignedTo: string;
}

export interface GHLConversation {
  id: string;
  contactId: string;
  lastMessageBody: string;
  lastMessageDate: string;
  lastMessageType: string;
  lastMessageDirection: string;
  unreadCount: number;
}

export function useGHLContacts(days = 10) {
  return useQuery({
    queryKey: ['ghl-contacts', days],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ghl-sync', {
        body: { action: 'get-contacts', days, limit: 100 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return {
        contacts: (data?.data?.contacts || []) as GHLContact[],
        total: data?.data?.total || 0,
      };
    },
    refetchInterval: 60000,
    retry: 1,
  });
}

export function useGHLConversations(contactId: string | null) {
  return useQuery({
    queryKey: ['ghl-conversations', contactId],
    queryFn: async () => {
      if (!contactId) return { conversations: [] };
      const { data, error } = await supabase.functions.invoke('ghl-sync', {
        body: { action: 'get-conversations', contactId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return {
        conversations: (data?.data?.conversations || []) as GHLConversation[],
      };
    },
    enabled: !!contactId,
    retry: 1,
  });
}
