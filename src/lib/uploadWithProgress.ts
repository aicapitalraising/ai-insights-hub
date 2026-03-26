import { supabase } from '@/integrations/supabase/db';

const SUPABASE_URL = (supabase as any).supabaseUrl || 
  import.meta.env.VITE_SUPABASE_URL || '';

/**
 * Upload a file to Supabase Storage with progress tracking via XMLHttpRequest.
 * Supports files up to 10 GB+.
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  // Get the current session for auth
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  // Build the upload URL
  const supabaseUrl = SUPABASE_URL.replace(/\/$/, '');
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(path);
        resolve(publicUrl);
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.message || err.error || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', uploadUrl, true);
    
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    // Use apikey header for anon access (public uploads)
    const anonKey = (supabase as any).supabaseKey || 
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    if (anonKey) {
      xhr.setRequestHeader('apikey', anonKey);
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
