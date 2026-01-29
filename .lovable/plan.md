
# Fix Public Link Loading Issue

## Problem Diagnosis

The public link at `/public/blue-capital` is not loading because the RLS (Row Level Security) policy on the `clients` table is incorrectly configured as a **RESTRICTIVE** policy instead of a **PERMISSIVE** policy.

### How PostgreSQL RLS Works:
- **Permissive policies**: At least ONE must return true for access (OR logic)
- **Restrictive policies**: ALL must return true for access (AND logic)
- When only restrictive policies exist with no permissive policies, access is denied by default

### Current State:
The `clients` table has:
```sql
-- This policy is RESTRICTIVE (wrong)
Policy: "Public can view clients by token"
Type: RESTRICTIVE  
Expression: (public_token IS NOT NULL)
```

When anonymous users (using the public link) try to query the clients table, no rows are returned because there's no permissive policy granting access.

---

## Solution

Drop the incorrect restrictive policy and create a proper **permissive** SELECT policy that allows public access to clients with a valid `public_token` OR `slug`.

### SQL Migration:

```sql
-- Step 1: Drop the incorrectly configured restrictive policy
DROP POLICY IF EXISTS "Public can view clients by token" ON clients;

-- Step 2: Create a proper PERMISSIVE policy for public access
CREATE POLICY "Public can view clients by token or slug"
ON clients
FOR SELECT
TO anon, authenticated
USING (
  public_token IS NOT NULL OR slug IS NOT NULL
);
```

---

## Files Changed

| File | Change |
|------|--------|
| Database Migration | New migration to fix RLS policy |

---

## Verification

After applying the fix:
1. Navigate to `/public/blue-capital` - should load the client report
2. Navigate to `/public/[any-client-slug]` - all clients with slugs should be accessible
3. The agency dashboard should continue to work normally

---

## Impact on All Clients

This fix will apply to **all clients** automatically since it's a database-level RLS policy change. Any client with a non-null `public_token` or `slug` will be accessible via their public link.

---

## Technical Details

The fix ensures:
- Public links work with both slug-based URLs (`/public/blue-capital`) and token-based URLs (`/public/9508a96eb54b8ee6ede83f87f88f8f71`)
- The policy is PERMISSIVE (default behavior in PostgreSQL when not specified as RESTRICTIVE)
- Anonymous users can query clients but only see those with valid public tokens or slugs
- Service role access remains unrestricted via the existing "Service role full access" policy
