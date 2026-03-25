

## Plan: Fix Batch Generation Across the Board

### Problems Identified

1. **`generate-static-ad` writes to wrong DB** — Uses `SUPABASE_URL` (Lovable Cloud) for storage uploads and asset record inserts instead of the production DB (`ORIGINAL_SUPABASE_URL`). Generated images are stored in Cloud storage, invisible to the frontend which reads from production.

2. **`_shared/get-gemini-key.ts` reads wrong DB** — Fetches `agency_settings` from Lovable Cloud instead of production, so it can't find the Gemini API key stored in the production `agency_settings` table.

3. **`edit-static-ad` writes to wrong DB** — Same issue as #1. AI-edited images get uploaded to Cloud storage instead of production.

4. **`generate-video-from-image` edge function missing** — The "Animate with Veo3" feature in ResultsGallery calls this function, but it doesn't exist, causing every animation attempt to fail.

### Changes

**File 1: `supabase/functions/_shared/get-gemini-key.ts`**
- Use `ORIGINAL_SUPABASE_URL` / `ORIGINAL_SUPABASE_SERVICE_ROLE_KEY` to read `agency_settings` from the production DB.

**File 2: `supabase/functions/generate-static-ad/index.ts`**
- Use `ORIGINAL_SUPABASE_URL` / `ORIGINAL_SUPABASE_SERVICE_ROLE_KEY` for the Supabase client that handles storage uploads and asset record inserts.
- This ensures generated ad images are uploaded to the production `assets` bucket and saved in the production `assets` table.

**File 3: `supabase/functions/edit-static-ad/index.ts`**
- Same fix: route storage uploads and asset inserts to the production DB via `ORIGINAL_SUPABASE_*` env vars.

**File 4: `supabase/functions/generate-video-from-image/index.ts`** (new)
- Create the missing edge function that accepts an `imageUrl`, `prompt`, `aspectRatio`, and `duration`.
- Use Lovable AI Gateway with Veo model to generate a video from a static image.
- Upload result to production storage and return the video URL or an `operationId` for polling.

These 4 changes ensure that static batch generation, AI editing, and video animation all work consistently for every client by reading/writing to the correct production database.

