# Integration Flow Guide - Dev 4 Party App

## User Flows

### Flow 1: Admin Creates & Shares Party
```
1. Dev 1 API: Admin clicks "Create Room"
2. POST /rooms → Backend creates room, returns roomId
3. Dev 4 Screen: Navigate to admin-qr screen with roomId
4. QRCode displays roomId (e.g., "5e7a9c3b-4f2d-11eb-ae93-...")
5. Admin shares screen or prints QR code
6. Other users scan QR code
```

**Dev 4 Code Entry Point**:
```typescript
// From Dev 1's create room endpoint
navigation.navigate('admin-qr', { roomId: response.data.roomId });
```

---

### Flow 2: User Scans & Joins
```
1. Dev 4 Screen: User opens /scanner (QR scanner)
2. Camera captures QR code data (roomId)
3. Dev 4 calls Dev 1 API: POST /rooms/join
   - Payload: { roomId, userId (from Dev 3), fcmToken (from Dev 3) }
4. Dev 1 adds user to room.participants array
5. Dev 4 navigates to /room-lobby with roomId
6. RoomLobby starts polling room data every 5 seconds
```

**Integration Points**:
- Dev 3: Provides `userId` and `fcmToken` from AsyncStorage
- Dev 1: POST /rooms/join endpoint
- Dev 4: Manages navigation and polling

**Current Code Location**: `app/scanner.tsx` lines 20-41

---

### Flow 3: Real-time Lobby Updates
```
1. Dev 4: /room-lobby continuously polls (5 second interval)
2. Dev 1 API: GET /rooms/:roomId returns current participants
3. Dev 4 updates participant FlatList
4. Both admin & users see new participants join in real-time
```

**API Response Format** (from Dev 1):
```json
{
  "_id": "room123",
  "room_name": "Majorat Mihai",
  "admin_nickname": "raffaelo",
  "participants": [
    {
      "user_id": "uuid-123",
      "nickname": "Tremendous Dog",
      "pfp_url": "https://..."
    }
  ],
  "active_alerts": [],
  "status": "waiting" // or "active", "ended"
}
```

**Dev 4 Code**: `app/room-lobby.tsx` lines 47-60

---

### Flow 4: Admin Starts Challenge
```
1. Dev 4 Screen: Admin clicks "Start Challenge" button
2. Dev 4 calls Dev 2 API: POST /rooms/:roomId/start-challenge
3. Dev 2 Backend processes:
   a. Fetches all room participants
   b. Runs offset-based assignment algorithm
   c. Saves assignments to DB
4. Dev 2 sends FCM notifications to all users
5. Dev 3: FCM message arrives on device
6. Dev 3 Navigation: Opens /challenge-reveal modal
7. Dev 4 Screen: Shows challenge with target and mission
```

**Expected FCM Notification Payload**:
```json
{
  "notification": {
    "title": "🚨 New Challenge!",
    "body": "Check your app"
  },
  "data": {
    "targetNickname": "Sneaky Cat",
    "challengeText": "Take a selfie doing a silly pose with them"
  }
}
```

**Dev 4 Code**: `app/challenge-reveal.tsx`

---

## API Endpoints Expected from Dev 1 & 2

### Dev 1 Endpoints (Backend Core)
```
POST /rooms
  Body: { room_name, admin_nickname, expires_at }
  Return: { _id, room_name, roomId, ... }

GET /rooms/:roomId
  Return: { _id, room_name, participants[], active_alerts, status }

POST /rooms/join
  Body: { roomId, userId, fcmToken, nickname, pfp_url }
  Return: { success, room }

POST /rooms/:roomId/leave
  Body: { userId }
  Return: { success, room }

POST /rooms/:roomId/end
  Body: { }
  Return: { success }
```

### Dev 2 Endpoints (Backend Challenge & Notifications)
```
POST /rooms/:roomId/start-challenge
  Body: { }
  Return: {
    success,
    assignments: [
      { userId, targetUserId, targetNickname, challengeText }
    ]
  }
  Side Effect: Sends FCM notifications to all participants

GET /tasks
  (For seeding challenges in the app or admin UI)
  Return: { tasks: [...] }
```

---

## Data Flow Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Admin     │         │   Backend    │         │   User      │
│   Device    │         │   (Dev 1-2)  │         │  Device     │
└──────┬──────┘         └──────┬───────┘         └─────┬───────┘
       │                        │                       │
       │ Creates Room           │                       │
       │──POST /rooms──────────>│                       │
       │                        │ Returns roomId        │
       │<──── roomId ───────────│                       │
       │                        │                       │
       │ [Show Admin QR]        │                       │
       │ admin-qr.tsx           │                       │
       │                        │                       │
       ├────────────────────────┼───────────────────────┤
       │                        │                       │
       │                        │       Scans QR        │
       │                        │<──scanner.tsx─────────│
       │                        │                       │
       │                        │     POST /rooms/join   │
       │                        │<──────────────────────│
       │                        │                       │
       │                        │   Adds to room.       │
       │                        │   participants        │
       │                        │                       │
       │                        │  Returns room data    │
       │                        │──────────────────────>│
       │                        │                       │
       │ [Polling every 5s]     │    [Polling every 5s] │
       │ room-lobby.tsx         │    room-lobby.tsx     │
       │──GET /rooms/:id───────>│                       │
       │<──room data───────────┼───────────────────────>│
       │                        │                       │
       │  Clicks "Start"        │                       │
       │──POST /start-challenge>│                       │
       │                        │                       │
       │                        │ Algorithm assigns     │
       │                        │ targets to each user  │
       │                        │                       │
       │                        │  Sends FCM to all     │
       │                        │  with challenge data  │
       │                        │──FCM Notification────>│
       │                        │                       │
       │                        │   [FCM Triggers Nav]  │
       │                        │   challenge-reveal.tsx│
       │                        │                       │
       │                        │   User sees challenge │
       │                        │   "Target: Sneaky Cat"│
```

---

## State Machine: Room Status

```
WAITING (after created)
  ↓
  └─ Participants join (polling updates)
  ├─ Leave room at any time
  └─ ACTIVE (after admin clicks "Start")
       ↓
       ├─ Challenge assigned (FCM notification)
       ├─ Users complete challenges
       ├─ 30 min cron reassigns targets
       └─ ENDED (admin ends, or TTL expires)
```

---

## Cron Job Integration (Dev 2 Every 30 Minutes)

```
Every 30 minutes:
  1. Check active_rooms
  2. For each room:
     a. Fetch current participants
     b. Run offset algorithm again
     c. Save new assignments
     d. Send FCM notifications with new targets
```

**Dev 4 Note**: The polling mechanism ensures users see updates even if FCM fails. Timer can be hardcoded to 1 minute for the 7-hour demo.

---

## Navigation Stack Structure

```
Root Stack (_layout.tsx)
├── (tabs) - Home screen
├── admin-qr - Navigate from tabs/index after creating room
├── scanner - Navigate from tabs/index for user to scan
├── room-lobby - Navigate from scanner after joining
│                or from admin after creating room
└── challenge-reveal - Modal triggered by FCM notification
                       from room-lobby or any screen
```

---

## Testing Checklist

- [ ] Admin QR screen displays QR code
- [ ] User can scan QR and join room
- [ ] Lobby shows participants
- [ ] Participants list updates every 5 seconds
- [ ] Admin can see "Start Challenge" button
- [ ] Non-admin users cannot see "Start Challenge" button
- [ ] Clicking "Start Challenge" calls backend API
- [ ] FCM notification triggers challenge reveal screen
- [ ] Challenge data is correctly displayed
- [ ] User can dismiss challenge reveal screen
- [ ] Leaving room navigates back properly

---

## Communication Template for Team

**To Dev 1**: "Please confirm the exact JSON format for:
- POST /rooms response
- GET /rooms/:id response
- User object structure in participants array"

**To Dev 2**: "Please send test FCM notification with this format:
```json
{
  "data": {
    "targetNickname": "string",
    "challengeText": "string"
  }
}
```"

**To Dev 3**: "Please store in AsyncStorage:
- `userId` (UUID, generated once)
- `fcmToken` (from Firebase, retrieved after login)"
