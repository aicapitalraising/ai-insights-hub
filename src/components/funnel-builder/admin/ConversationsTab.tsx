import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Search, Phone, Mail,
  User, Inbox, RefreshCw, ExternalLink, Tag,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGHLContacts } from '@/hooks/useGHLContacts';
import type { GHLContact } from '@/hooks/useGHLContacts';

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

function contactStatus(contact: GHLContact): 'active' | 'waiting' | 'closed' {
  const tags = contact.tags.map(t => t.toLowerCase());
  if (tags.includes('paid client') || tags.includes('booked call')) return 'active';
  if (tags.includes('new lead')) return 'waiting';
  return 'closed';
}

export function ConversationsTab() {
  const { data, isLoading, isError, refetch } = useGHLContacts(30);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'waiting' | 'closed'>('all');

  const contacts = data?.contacts || [];

  const filtered = useMemo(() =>
    contacts.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search);
      const status = contactStatus(c);
      const matchesFilter = filter === 'all' || status === filter;
      return matchesSearch && matchesFilter;
    }),
    [contacts, search, filter]
  );

  const selected = selectedId ? contacts.find((c) => c.id === selectedId) : filtered[0];
  const totalNew = contacts.filter((c) => contactStatus(c) === 'waiting').length;

  const statusColors = {
    active: 'bg-emerald-500',
    waiting: 'bg-yellow-500',
    closed: 'bg-muted-foreground',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Syncing contacts from GoHighLevel...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <Inbox className="w-8 h-8" />
        <p className="text-sm">Could not fetch GHL contacts. Check your API key configuration.</p>
        <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-3 h-3" /> Retry
        </Button>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
        <Inbox className="w-8 h-8" />
        <p className="text-sm">No contacts found in the last 30 days</p>
        <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-3 h-3" /> Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-0 h-[calc(100vh-8rem)] rounded-xl border border-border overflow-hidden bg-card">
      {/* Contact List */}
      <div className="w-80 border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              GHL Contacts
              <span className="text-[10px] text-muted-foreground font-normal">({data?.total || 0})</span>
              {totalNew > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{totalNew}</span>
              )}
            </h3>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => refetch()}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..." className="pl-9 h-8 text-xs" />
          </div>
          <div className="flex gap-1">
            {(['all', 'active', 'waiting', 'closed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all capitalize ${
                  filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((contact) => {
            const status = contactStatus(contact);
            return (
              <button
                key={contact.id}
                onClick={() => setSelectedId(contact.id)}
                className={`w-full text-left px-4 py-3 border-b border-border transition-all hover:bg-muted/50 ${
                  selected?.id === contact.id ? 'bg-muted/70' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                    <span className="text-sm font-semibold text-foreground">{contact.name || 'Unnamed'}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(contact.dateAdded)}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 ml-4">
                  {contact.email || contact.phone || 'No contact info'}
                </p>
                <div className="flex items-center justify-between mt-1.5 ml-4">
                  <span className="text-[10px] text-muted-foreground">{contact.source || 'Direct'}</span>
                  {status === 'waiting' && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">!</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contact Detail */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-foreground">{selected.name || 'Unnamed'}</h4>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {selected.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selected.email}</span>}
                  {selected.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selected.phone}</span>}
                </div>
              </div>
            </div>
            <div className={`text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize ${
              contactStatus(selected) === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
              contactStatus(selected) === 'waiting' ? 'bg-yellow-500/10 text-yellow-500' :
              'bg-muted text-muted-foreground'
            }`}>
              {contactStatus(selected)}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Contact Info */}
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact Details</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-[10px] text-muted-foreground mb-1">First Name</div>
                  <div className="text-sm font-medium text-foreground">{selected.firstName || '—'}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-[10px] text-muted-foreground mb-1">Last Name</div>
                  <div className="text-sm font-medium text-foreground">{selected.lastName || '—'}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-[10px] text-muted-foreground mb-1">Email</div>
                  <div className="text-sm font-medium text-foreground">{selected.email || '—'}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-[10px] text-muted-foreground mb-1">Phone</div>
                  <div className="text-sm font-medium text-foreground">{selected.phone || '—'}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-[10px] text-muted-foreground mb-1">Source</div>
                  <div className="text-sm font-medium text-foreground">{selected.source || 'Direct'}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-[10px] text-muted-foreground mb-1">Added</div>
                  <div className="text-sm font-medium text-foreground">
                    {selected.dateAdded ? new Date(selected.dateAdded).toLocaleDateString() : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {selected.tags.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Tags
                </h5>
                <div className="flex flex-wrap gap-2">
                  {selected.tags.map((tag, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="text-[11px] font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full"
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Last Activity */}
            {selected.lastActivity && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Last Activity</h5>
                <p className="text-sm text-foreground">{timeAgo(selected.lastActivity)}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h5>
              <div className="flex gap-2 flex-wrap">
                {selected.email && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                    <a href={`mailto:${selected.email}`}><Mail className="w-3 h-3" /> Email</a>
                  </Button>
                )}
                {selected.phone && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                    <a href={`tel:${selected.phone}`}><Phone className="w-3 h-3" /> Call</a>
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                  <a href={`https://app.gohighlevel.com/contacts/detail/${selected.id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3" /> Open in GHL
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">Select a contact to view details</p>
        </div>
      )}
    </div>
  );
}
