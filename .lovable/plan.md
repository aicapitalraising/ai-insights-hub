

# Quick Links for GHL & Meta Ads Account

## Overview

Add two quick-link icon buttons to the client detail page header for one-click access to:
1. **Meta Ads Manager** - Opens the client's configured `business_manager_url`
2. **GHL Dashboard** - Opens the GoHighLevel location dashboard using `ghl_location_id`

These buttons will appear in the header alongside the existing Record and Activity buttons.

---

## Visual Layout

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                                      │
│                                                                          │
│                           [GHL] [Meta] [Record] [Activity] [Import ▼]... │
└─────────────────────────────────────────────────────────────────────────┘
```

**Button Designs:**
- **GHL Button**: Ghost variant, icon-only, with tooltip "Open GHL"
- **Meta Button**: Ghost variant, icon-only, with tooltip "Open Meta Ads"
- Both buttons disabled with different styling if URL/ID not configured

---

## Technical Implementation

### File to Modify
`src/pages/ClientDetail.tsx`

### Changes

1. **Import additional icons**
   - Add `BarChart3` icon (for Meta Ads, consistent with agency dashboard)
   - Use a suitable icon for GHL (could use `Users` or a custom approach)

2. **Add helper function for GHL URL**
```typescript
const openGhlDashboard = () => {
  if (client.ghl_location_id) {
    // GHL dashboard URL pattern
    window.open(
      `https://app.gohighlevel.com/v2/location/${client.ghl_location_id}/dashboard`,
      '_blank'
    );
  } else {
    toast.error('No GHL Location ID configured for this client');
  }
};
```

3. **Add helper function for Meta Ads**
```typescript
const openAdsManager = () => {
  if (client.business_manager_url) {
    window.open(client.business_manager_url, '_blank');
  } else {
    toast.error('No Ads Manager URL configured for this client');
  }
};
```

4. **Add buttons to header** (before VoiceRecordButton)
```typescript
{/* Quick Links */}
<Button 
  variant="ghost" 
  size="sm"
  onClick={openGhlDashboard}
  disabled={!client.ghl_location_id}
  title="Open GHL Dashboard"
>
  <Users className="h-4 w-4 mr-2" />
  GHL
</Button>
<Button 
  variant="ghost" 
  size="sm"
  onClick={openAdsManager}
  disabled={!client.business_manager_url}
  title="Open Meta Ads Manager"
>
  <BarChart3 className="h-4 w-4 mr-2" />
  Meta
</Button>
```

---

## Implementation Details

| Aspect | Details |
|--------|---------|
| **File** | `src/pages/ClientDetail.tsx` |
| **Location** | Header section, before VoiceRecordButton (line ~181) |
| **GHL URL Pattern** | `https://app.gohighlevel.com/v2/location/{location_id}/dashboard` |
| **Meta URL** | Uses existing `business_manager_url` from client record |
| **Error Handling** | Toast notification if URL/ID not configured |
| **Visual State** | Disabled styling when credentials missing |

---

## Benefits

- **One-click access** to both external platforms directly from client view
- **Consistent UX** with agency dashboard quick links
- **Clear feedback** when credentials not configured
- **No database changes** required - uses existing `ghl_location_id` and `business_manager_url` fields

