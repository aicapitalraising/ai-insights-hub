import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Plus, Trash2, Globe, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeyRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  key_hash: string;
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'avs_';
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/api-gateway`;

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    const { data } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false });
    if (data) setKeys(data as unknown as ApiKeyRow[]);
  };

  const createKey = async () => {
    setLoading(true);
    const rawKey = generateApiKey();
    const keyHash = await sha256(rawKey);
    const name = newKeyName.trim() || 'Untitled Key';

    const { error } = await supabase.from('api_keys').insert({ key_hash: keyHash, name } as any);
    if (error) {
      toast.error('Failed to create key');
      setLoading(false);
      return;
    }

    setRevealedKey(rawKey);
    setNewKeyName('');
    await fetchKeys();
    setLoading(false);
    toast.success('API key created — copy it now, it won\'t be shown again!');
  };

  const revokeKey = async (id: string) => {
    await supabase.from('api_keys').delete().eq('id', id);
    await fetchKeys();
    toast.success('API key revoked');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const curlExamples = [
    {
      label: 'List Clients',
      curl: `curl -X POST ${baseUrl} \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"action": "list_clients"}'`,
    },
    {
      label: 'Create Client (auto brand)',
      curl: `curl -X POST ${baseUrl} \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"action": "create_client", "websiteUrl": "https://example.com"}'`,
    },
    {
      label: 'List Avatars for Client',
      curl: `curl -X POST ${baseUrl} \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"action": "list_avatars", "clientId": "CLIENT_UUID"}'`,
    },
    {
      label: 'Get Avatar Looks',
      curl: `curl -X POST ${baseUrl} \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"action": "get_avatar_looks", "avatarId": "AVATAR_UUID"}'`,
    },
    {
      label: 'Generate Video',
      curl: `curl -X POST ${baseUrl} \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"action": "generate_video", "imageUrl": "https://...", "prompt": "Person talking to camera", "aspectRatio": "9:16"}'`,
    },
    {
      label: 'Generate Static Ad',
      curl: `curl -X POST ${baseUrl} \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"action": "generate_static_ad", "clientId": "CLIENT_UUID", "prompt": "Summer sale banner", "aspectRatio": "1:1"}'`,
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            API Access Keys
          </CardTitle>
          <CardDescription>
            Generate API keys for external tools like OpenClaw to access your platform programmatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create new key */}
          <div className="flex gap-2">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. OpenClaw Production)"
              className="flex-1"
            />
            <Button onClick={createKey} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              Generate Key
            </Button>
          </div>

          {/* Revealed key (shown once) */}
          {revealedKey && (
            <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 space-y-2">
              <p className="text-sm font-medium text-primary">⚠️ Copy this key now — it won't be shown again!</p>
              <div className="flex gap-2">
                <code className="flex-1 p-2 rounded bg-muted font-mono text-sm break-all">
                  {revealedKey}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(revealedKey)}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setRevealedKey(null)}>
                Dismiss
              </Button>
            </div>
          )}

          {/* Key list */}
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{key.name}</span>
                    <Badge variant={key.is_active ? 'default' : 'secondary'}>
                      {key.is_active ? 'Active' : 'Revoked'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(key.created_at).toLocaleDateString()}
                    {key.last_used_at && ` • Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => revokeKey(key.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {keys.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No API keys yet. Generate one to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Curl examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Usage Examples</CardTitle>
          <CardDescription>
            All actions use a single POST endpoint. The <code className="text-xs bg-muted px-1 rounded">action</code> field determines what to do.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {curlExamples.map((ex, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{ex.label}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(ex.curl)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {ex.curl}
                  </pre>
                </div>
              ))}

              <div className="p-3 rounded-lg border border-dashed space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Agentic Workflow</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li><code className="text-xs bg-muted px-1 rounded">list_clients</code> → pick or create client</li>
                  <li><code className="text-xs bg-muted px-1 rounded">list_avatars</code> → pick avatar for client</li>
                  <li><code className="text-xs bg-muted px-1 rounded">get_avatar_looks</code> → confirm look/image</li>
                  <li><code className="text-xs bg-muted px-1 rounded">generate_script</code> → create script from offer</li>
                  <li><code className="text-xs bg-muted px-1 rounded">generate_video</code> → use look image + script</li>
                  <li><code className="text-xs bg-muted px-1 rounded">poll_status</code> → wait for completion</li>
                </ol>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
