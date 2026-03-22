# Dev 4 Quick Reference Card

## Files You Created

| File | Purpose | Key Info |
|------|---------|----------|
| `app/admin-qr.tsx` | Admin shows QR code | Route: `/admin-qr` |
| `app/scanner.tsx` | User scans QR to join | Route: `/scanner` |
| `app/room-lobby.tsx` | Show participants, start challenge | Route: `/room-lobby`, Polls every 5s |
| `app/challenge-reveal.tsx` | Show challenge from FCM | Route: `/challenge-reveal`, Modal |
| `utils/api.ts` | API configuration | Update `API_BASE_URL` |
| `utils/notifications.ts` | FCM & linking helpers | Placeholder code |

---

## Navigation Commands

```typescript
// Go to Admin QR (after room created)
router.push({
  pathname: '/admin-qr',
  params: { roomId: roomData._id }
});

// Go to Scanner
router.push('/scanner');

// Go to Room Lobby (after joining)
router.push({
  pathname: '/room-lobby',
  params: { roomId: scannedData }
});

// Go to Challenge Reveal (from FCM)
navigation.navigate('challenge-reveal', {
  targetNickname: 'User Name',
  challengeText: 'Do something cool'
});
```

---

## API Endpoints You'll Call

| Endpoint | Dev | When | Code Location |
|----------|-----|------|----------------|
| `POST /rooms/join` | Dev 1 | After scanning QR | `scanner.tsx` line 20-41 |
| `GET /rooms/:roomId` | Dev 1 | Polling (every 5s) | `room-lobby.tsx` line 47 |
| `POST /rooms/:roomId/start-challenge` | Dev 2 | Admin clicks button | `room-lobby.tsx` line 87 |
| `POST /rooms/:roomId/leave` | Dev 1 | User leaves | `room-lobby.tsx` line 96 |

---

## Expected Data Structures

### Room Data (from Dev 1 `/rooms/:id`)
```json
{
  "_id": "5e7a9c3b",
  "room_name": "Majorat Mihai",
  "admin_nickname": "raffaelo",
  "participants": [
    {
      "user_id": "uuid-123",
      "nickname": "Sneaky Cat",
      "pfp_url": "https://...",
      "fcm_token": "token..."
    }
  ],
  "status": "active"
}
```

### FCM Notification (from Dev 2)
```json
{
  "notification": {
    "title": "New Challenge!"
  },
  "data": {
    "targetNickname": "Sneaky Cat",
    "challengeText": "Take a selfie together"
  }
}
```

---

## Key Constants & Configurations

```typescript
// Polling interval (in ms)
const POLL_INTERVAL = 5000; // 5 seconds
// Change to 60000 (1 min) for 7-hour demo

// API Base URL - UPDATE THIS!
export const API_BASE_URL = 'http://YOUR_LOCAL_IP:3000';

// Mock user data (until Dev 3 provides)
const userId = 'placeholder-user-uuid';
const fcmToken = 'placeholder-fcm-token';
```

---

## TODO Items (In Priority Order)

- [ ] Update `API_BASE_URL` in `utils/api.ts`
- [ ] Uncomment API calls in `scanner.tsx` (when Dev 1 ready)
- [ ] Uncomment API calls in `room-lobby.tsx` (when Dev 1 ready)
- [ ] Replace mock data with real API calls
- [ ] Get `userId` & `fcmToken` from Dev 3
- [ ] Integrate FCM notifications (with Dev 3)
- [ ] Test QR code flow end-to-end
- [ ] Polish UI/styling
- [ ] Test 1-minute polling for demo

---

## Testing Checklist

Before each sync:
- [ ] All screens render without crashing
- [ ] QR code is scannable
- [ ] Room lobby updates periodically
- [ ] Admin sees "Start Challenge" button
- [ ] Challenge reveal displays correctly
- [ ] No console errors

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Camera won't open | Grant permissions: Settings > App > Camera |
| QR won't scan | Better lighting, steady hand, 20-30cm distance |
| API error 404 | Check `API_BASE_URL` matches backend |
| Polling not updating | Check network, verify API returns data |
| FCM notification stuck | Dev 3: Check Firebase setup |

---

## Screen States

### AdminQRScreen
- Shows QR code
- Shows room ID text
- No interaction needed (just show)

### UserScannerScreen
- Camera view fullscreen
- Scan button overlay
- Auto-navigates on success

### RoomLobbyScreen
- Participant list (updates every 5s)
- Admin-only "Start Challenge" button
- "Leave Room" button
- Real-time participant count

### ChallengeRevealScreen
- Modal overlay
- Dark theme
- Shows target + mission
- Single "Got it!" button to dismiss

---

## Dev Communication Template

**Message to Dev 1**:
"Can you confirm the exact JSON structure for:
1. POST /rooms response (what fields?)
2. GET /rooms/:id response (participant format?)
3. Is there a user `status` field we need to check?"

**Message to Dev 2**:
"Please send FCM with this exact payload:
```json
{
  "data": {
    "targetNickname": "string",
    "challengeText": "string"
  }
}
```"

**Message to Dev 3**:
"Please store these in AsyncStorage:
- `userId` (UUID from onboarding)
- `fcmToken` (from Firebase setup)"

---

## Performance Notes

- ✅ Polling every 5 seconds is acceptable
- ✅ FlatList optimized for 100+ participants
- ✅ Mock data tests work without backend
- ⚠️ Change 5s to 60s for prod
- ⚠️ Monitor battery drain if polling too fast

---

## Useful Commands

```bash
# Start development
npm start

# View logs
npm start  # then press `j` in terminal

# Test on Android
npm run android

# Test on iOS
npm run ios

# Fully reset
watchman watch-del-all && npm start -- --reset-cache
```

---

## File Locations Reference

```
frontend/
├── app/
│   ├── _layout.tsx (UPDATED - add new routes)
│   ├── admin-qr.tsx (NEW)
│   ├── scanner.tsx (NEW)
│   ├── room-lobby.tsx (NEW)
│   └── challenge-reveal.tsx (NEW)
├── utils/
│   ├── api.ts (NEW)
│   └── notifications.ts (NEW)
├── DEV4_README.md (NEW - full docs)
├── INTEGRATION.md (NEW - flows)
└── TESTING.md (NEW - testing guide)
```

---

## Hour-by-Hour Goal (7-Hour Hackathon)

| Hour | Goal |
|------|------|
| 1 | ✅ Setup done, mock screens working |
| 2-3 | Dev 1 builds endpoints, Dev 4 integrates |
| 3-4 | Test real API calls, fix bugs |
| 4-5 | Dev 2/3 integration, notifications |
| 5-6 | Edge cases, cron job testing |
| 6-7 | Polish, demo at 1-min intervals |

**Right Now** (Hour 0): You're at "✅ Setup done"

---

## Emergency Contacts

- **Can't scan QR?** → Check camera permissions, lighting
- **Can't join room?** → Check backend URL, network
- **Polling broken?** → Check React DevTools, network tab
- **FCM not working?** → Ask Dev 3, check Firebase
- **Navigation crashing?** → Check route names in `_layout.tsx`

---

Last updated: 2026-03-22 | Ready for integration! 🚀
