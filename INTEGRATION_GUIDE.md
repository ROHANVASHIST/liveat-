# Integration Guide - New Features

This guide walks you through integrating the 5 new features into your chat app.

---

## Quick Start

### 1. Backend Setup (5 minutes)

**Step 1: Install dependencies**
```bash
cd backend
npm install
```

**Step 2: Update Supabase Schema**
- Open Supabase dashboard → SQL Editor
- Copy all SQL from `backend/supabase-schema.sql`
- Paste and run (it's idempotent, safe to run multiple times)
- Verify new tables created: `pinned_messages`, `user_blocks`, `notification_settings`, `notifications`, `analytics_snapshots`

**Step 3: Verify Backend is Running**
```bash
npm run dev
# Should see: "Server running on port 3000"
```

**Step 4: Test new endpoints**
```bash
# Test message search
curl http://localhost:3000/api/messages/search?query=test

# Test analytics
curl http://localhost:3000/api/analytics/dashboard
```

---

### 2. Frontend Setup (10 minutes)

**Step 1: Install any missing dependencies** (should already be installed)
```bash
npm install
```

**Step 2: Import and use feature components in App.tsx**

Add these imports at the top:
```tsx
import { SearchModal, NotificationsPanel, AdvancedAnalytics, PinnedMessages, BlockedUsersModal } from '@/components/ui/features';
import { useNotifications, useAnalytics } from '@/lib/hooks';
```

**Step 3: Add state for feature modals**

In your `App()` function component:
```tsx
const [searchOpen, setSearchOpen] = useState(false);
const [notificationsOpen, setNotificationsOpen] = useState(false);
const [analyticsOpen, setAnalyticsOpen] = useState(false);
const [blockedUsersOpen, setBlockedUsersOpen] = useState(false);
const { unreadCount, fetchNotifications } = useNotifications();
```

**Step 4: Add feature buttons to header**

In your chat header/navigation component:
```tsx
<div className="flex items-center gap-2">
  {/* Search Button */}
  <button
    onClick={() => setSearchOpen(true)}
    className="p-2 hover:bg-secondary rounded"
    title="Search (Cmd+K)"
  >
    🔍
  </button>

  {/* Notifications Button */}
  <button
    onClick={() => setNotificationsOpen(true)}
    className="p-2 hover:bg-secondary rounded relative"
  >
    🔔
    {unreadCount > 0 && (
      <span className="absolute top-1 right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {unreadCount}
      </span>
    )}
  </button>

  {/* Blocked Users Button */}
  <button
    onClick={() => setBlockedUsersOpen(true)}
    className="p-2 hover:bg-secondary rounded"
  >
    🚫
  </button>

  {/* Analytics Button */}
  <button
    onClick={() => setAnalyticsOpen(true)}
    className="p-2 hover:bg-secondary rounded"
  >
    📊
  </button>
</div>
```

**Step 5: Add feature modals to JSX**

Add these components at the end of your JSX (before closing fragment):
```tsx
{/* Feature Modals */}
<SearchModal
  isOpen={searchOpen}
  onOpenChange={setSearchOpen}
  roomId={activeRoomId}
  onSelectMessage={(msg) => {
    // Optional: scroll to message or highlight it
    console.log('Selected message:', msg);
  }}
/>

<NotificationsPanel
  isOpen={notificationsOpen}
  onOpenChange={setNotificationsOpen}
/>

<AdvancedAnalytics
  isOpen={analyticsOpen}
  onOpenChange={setAnalyticsOpen}
/>

<BlockedUsersModal
  isOpen={blockedUsersOpen}
  onOpenChange={setBlockedUsersOpen}
  currentUserId={currentUserId}
/>
```

**Step 6: Add PinnedMessages to ChatRoom**

In your `ChatRoom` component, add at the top of the chat area:
```tsx
<PinnedMessages
  roomId={activeRoomId}
  isOpen={true}
  onSelectMessage={(msg) => {
    // Scroll to message
    const element = document.getElementById(`message-${msg.id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }}
/>
```

**Step 7: Start frontend**
```bash
npm run dev
# Should see: "VITE v... ready in ... ms"
```

---

## Feature-by-Feature Integration

### 🔍 Message Search

**Already integrated if you followed steps above!**

Additional customization:
```tsx
// Can pass filters to search
<SearchModal
  roomId={currentRoomId} // Search only this room
  onSelectMessage={(msg) => {
    // Custom action when message selected
    scrollToMessage(msg.id);
    highlightMessage(msg.id);
  }}
/>
```

---

### 📌 Message Pinning

**Step 1: Add pin button to Message component**

In `src/components/ui/chat/message.tsx`, add a button:
```tsx
import { Pin, PinOff } from 'lucide-react';
import { useMessagePin } from '@/lib/hooks';

// In Message component:
const { pinMessage, unpinMessage } = useMessagePin();
const [isPinned, setIsPinned] = useState(message.isPinned || false);

<button
  onClick={() => {
    if (isPinned) {
      unpinMessage(message.id, roomId);
    } else {
      pinMessage(message.id, roomId);
    }
    setIsPinned(!isPinned);
  }}
  className="hover:text-primary"
>
  {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
</button>
```

**Step 2: Already added PinnedMessages to ChatRoom (see above)**

---

### 🚫 User Blocking

**Step 1: Add block button to message context menu**

In your message component, add right-click menu or three-dot menu:
```tsx
import { useUserBlock } from '@/lib/hooks';

const { blockUser } = useUserBlock();

<button
  onClick={() => {
    blockUser(message.senderId, 'Spam messages');
    // Optionally: show toast "User blocked"
  }}
>
  🚫 Block User
</button>
```

**Step 2: Filter blocked users' messages**

In your message display component:
```tsx
import { blockService } from '@/backend/services/blockService';

const { blocked: blockedUsers } = await blockService.getUserBlockingRelationships(currentUserId);

// When rendering messages:
{messages
  .filter(msg => !blockedUsers.includes(msg.senderId))
  .map(msg => <Message key={msg.id} message={msg} />)
}
```

---

### 🔔 Notifications

**Step 1: Fetch notifications on app load**

In `App.tsx` useEffect:
```tsx
useEffect(() => {
  fetchNotifications(); // Fetch immediately
  const interval = setInterval(() => fetchNotifications(), 30000); // Poll every 30s
  return () => clearInterval(interval);
}, [fetchNotifications]);
```

**Step 2: Listen for real-time notifications via WebSocket**

In your WebSocket handler:
```typescript
// In backend WebSocket message handler:
ws.on('message', async (data) => {
  const message = JSON.parse(data.toString());

  if (message.type === 'notification') {
    // Broadcast to relevant user
    const targetUser = clients.get(message.userId);
    if (targetUser) {
      targetUser.ws.send(JSON.stringify({
        type: 'notification',
        data: message
      }));
    }
  }
});
```

**Step 3: Update notification settings**

Add a settings modal in user profile:
```tsx
const { settings, updateSettings } = useNotificationSettings();

<div>
  <label>
    <input
      type="checkbox"
      checked={settings?.sound_enabled}
      onChange={(e) => updateSettings({ sound_enabled: e.target.checked })}
    />
    Enable sound notifications
  </label>

  <select onChange={(e) => {
    const muteMinutes = parseInt(e.target.value);
    updateSettings({
      mute_until: new Date(Date.now() + muteMinutes * 60 * 1000)
    });
  }}>
    <option value="">Unmute</option>
    <option value="60">Mute 1 hour</option>
    <option value="240">Mute 4 hours</option>
    <option value="1440">Mute 24 hours</option>
  </select>
</div>
```

---

### 📊 Advanced Analytics

**Already integrated if you followed steps above!**

Additional features:
```tsx
// Customize refresh interval
const [refreshInterval, setRefreshInterval] = useState(30000);

useEffect(() => {
  const timer = setInterval(() => {
    fetchDashboardMetrics();
  }, refreshInterval);
  return () => clearInterval(timer);
}, [refreshInterval, fetchDashboardMetrics]);

// Add export button
<button
  onClick={() => {
    const csv = convertToCSV(metrics);
    downloadCSV(csv, 'analytics.csv');
  }}
>
  📥 Export CSV
</button>
```

---

## Testing Checklist

### Backend Testing
- [ ] All service files compile without errors: `npm run build`
- [ ] Database queries return results
- [ ] Error handling works (try invalid IDs, bad queries)
- [ ] CORS allows requests from frontend

### Frontend Testing
- [ ] All feature components render without errors
- [ ] Hooks return data correctly
- [ ] Modals open/close smoothly
- [ ] Search returns results
- [ ] Pin/unpin works
- [ ] Block/unblock works
- [ ] Notifications appear in real-time
- [ ] Analytics dashboard loads

### Integration Testing
- [ ] Search from one page, view result in another
- [ ] Pin message, see in PinnedMessages header
- [ ] Block user, don't see their messages
- [ ] Get notification for mention/reaction
- [ ] View analytics for your activity
- [ ] WebSocket connections stay alive

---

## Troubleshooting

### Backend won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Database table missing
```sql
-- Manually run in Supabase SQL editor:
CREATE TABLE IF NOT EXISTS pinned_messages (...);
-- Check supabase-schema.sql for all tables
```

### Frontend can't connect to backend
```bash
# Check backend is running
curl http://localhost:3000/health

# Check frontend API_BASE_URL
console.log(import.meta.env.VITE_BACKEND_URL)

# Might need to set in .env:
VITE_BACKEND_URL=http://localhost:3000
```

### Search not working
- Verify messageService is imported in backend index.ts
- Check /api/messages/search endpoint returns data
- Ensure query parameter is present

### Notifications not appearing
- Check notification table has rows
- Verify fetchNotifications is called
- Check browser console for API errors
- WebSocket might not be sending notifications yet

---

## Performance Notes

- Search is paginated (default 50 results)
- Analytics queries are aggregated, not real-time
- Notifications use polling by default (add WebSocket for real-time)
- Pin count shouldn't exceed ~20 per room for UX
- Consider caching frequently searched queries

---

## Security Notes

- All endpoints require authentication (`req.isAuthenticated()`)
- Blocked users list is private per user
- Notifications only visible to recipient
- Pin/unpin checks user permissions
- Consider rate limiting on search queries

---

## Next Steps

1. ✅ Run backend: `cd backend && npm run dev`
2. ✅ Run frontend: `npm run dev` (in root)
3. ✅ Open http://localhost:5173
4. ✅ Test each feature with the buttons in header
5. ✅ Check browser console for errors
6. ✅ Review FEATURES.md for detailed docs

---

**Need Help?**
- Check FEATURES.md for architecture details
- Review component source code for implementation
- Check browser DevTools → Network tab for API calls
- Check backend console logs for errors

**Happy Coding!** 🚀
