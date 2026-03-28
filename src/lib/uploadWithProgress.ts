import { supabase as storageClient } from '@/integrations/supabase/db';

// Use production Supabase for storage uploads (Cloud DB has RLS issues for anon uploads)
const STORAGE_URL = 'https://jgwwmtuvjlmzapwqiabu.supabase.co';
const STORAGE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd3dtdHV2amxtemFwd3FpYWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDkzODIsImV4cCI6MjA4MzMyNTM4Mn0.STFrUoif30xXQCjabc3skP6_tTnVIATwHhwWxeZoUr4';

/**
 * Upload a file to Storage with progress tracking via XMLHttpRequest.
 * Uses the Lovable Cloud storage client so uploads work consistently
 * even when app data is read from a separate database client.
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const { data: { session } } = await storageClient.auth.getSession();
  const token = session?.access_token;
  const uploadUrl = `${STORAGE_URL.replace(/\/$/, '')}/storage/v1/object/${bucket}/${path}`;

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const { data: { publicUrl } } = storageClient.storage.from(bucket).getPublicUrl(path);
        resolve(publicUrl);
        return;
      }

      try {
        const err = JSON.parse(xhr.responseText);
        reject(new Error(err.message || err.error || `Upload failed (${xhr.status})`));
      } catch {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    xhr.open('POST', uploadUrl, true);

    if (STORAGE_ANON_KEY) {
      xhr.setRequestHeader('apikey', STORAGE_ANON_KEY);
      xhr.setRequestHeader('Authorization', `Bearer ${token || STORAGE_ANON_KEY}`);
    } else if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (file.type) {
      xhr.setRequestHeader('Content-Type', file.type);
    }

    xhr.setRequestHeader('x-upsert', 'true');
    xhr.send(file);
  });
}

/** Format bytes to human-readable string */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
