# Frontend Architecture Deep Dive

## 🏗️ Project Structure

```
frontend/
├── app/
│   ├── _layout.tsx                 # Navigation routing (entry point)
│   ├── (tabs)/
│   │   ├── index.tsx               # Home screen
│   │   └── explore.tsx
│   ├── admin-qr.tsx                # Admin QR generator
│   ├── scanner.tsx                 # User QR scanner
│   ├── room-lobby.tsx              # Participants list with polling
│   ├── challenge-reveal.tsx        # Challenge modal
│   └── modal.tsx
├── utils/
│   ├── api.ts                      # API configuration & helpers
│   └── notifications.ts            # FCM & navigation helpers
├── components/                     # Reusable UI components
├── hooks/                          # Custom React hooks
├── package.json                    # Dependencies
└── app.json                        # Expo configuration
```

---

## 🔄 Complete User Flow (Step by Step)

### Phase 1: Setup & Home Screen
```
User opens app
    ↓
app/_layout.tsx receives request
    ↓
Navigation Stack decides which screen to show
    ↓
(tabs)/index.tsx renders (Home Screen)
    ↓
User sees two buttons:
  • "Create Room" (Admin path)
  • "Join Room" (Scanner path)
```

### Phase 2a: Admin Path (Creating Room)
```
Admin taps "Create Room"
    ↓
Calls Dev 1's backend API: POST /rooms
{
  room_name: "Majorat Mihai",
  admin_nickname: "raffaelo",
  expires_at: timestamp
}
    ↓
Backend returns: { _id: "room-123", room_name: "..." }
    ↓
Frontend navigates to admin-qr.tsx
router.push({
  pathname: '/admin-qr',
  params: { roomId: 'room-123' }
})
    ↓
AdminQRScreen displays:
  • QR Code (encodes "room-123")
  • Room ID as text
  • Admin shares screen/prints it
```

### Phase 2b: User Path (Scanning to Join)
```
User taps "Join Room"
    ↓
router.push('/scanner')
    ↓
ScannerScreen loads:
  1. Requests camera permission (Expo handles)
  2. Opens back camera
  3. Watches for barcode data
    ↓
User aims at QR code
    ↓
CameraView detects QR
Extracts data: "room-123"
    ↓
handleBarCodeScanned() triggered
{
  type: 'qr',
  data: 'room-123'  ← This is the roomId
}
    ↓
Calls Dev 1's API: POST /rooms/join
{
  roomId: 'room-123',
  userId: 'uuid-from-dev-3',
  fcmToken: 'firebase-token-from-dev-3'
}
    ↓
Backend adds user to room.participants array
Returns updated room data
    ↓
Frontend navigates to room lobby:
router.push({
  pathname: '/room-lobby',
  params: { roomId: 'room-123' }
})
```

### Phase 3: Room Lobby (Real-time Updates)
```
RoomLobbyScreen mounts
    ↓
useEffect hook runs:
  1. Calls fetchRoomData() IMMEDIATELY
  2. Sets up polling INTERVAL (every 5 seconds)
  3. Cleanup function for unmounting
    ↓
fetchRoomData() executes:
  GET /rooms/room-123
    ↓
Backend returns:
{
  _id: 'room-123',
  room_name: 'Majorat Mihai',
  admin_nickname: 'raffaelo',
  participants: [
    {
      user_id: 'uuid-1',
      nickname: 'Tremendous Dog',
      pfp_url: 'https://...'
    },
    {
      user_id: 'uuid-2',
      nickname: 'Sneaky Cat',
      pfp_url: 'https://...'
    }
  ],
  status: 'waiting'
}
    ↓
Screen updates:
┌─────────────────────────────────────┐
│ Lobby                               │
│ Room: room-123                      │
│ 2 participants                      │
├─────────────────────────────────────┤
│ [D] Tremendous Dog                  │
│ [S] Sneaky Cat                      │
├─────────────────────────────────────┤
│ [Start Challenge] (admin only)      │
│ [Leave Room]                        │
└─────────────────────────────────────┘
    ↓
WAITS 5 SECONDS
    ↓
Polling interval triggers again
fetchRoomData() called
    ↓
User 3 has joined!
returns updated participants array
    ↓
FlatList re-renders with NEW participants
    ↓
...continues polling every 5 seconds...
```

### Phase 4: Challenge Starts
```
Admin taps "Start Challenge"
    ↓
isAdmin check passes: true
Calls handleStartChallenge()
    ↓
POST /rooms/room-123/start-challenge (Dev 2)
    ↓
Dev 2 Backend:
  1. Fetches all participants from room
  2. Runs offset algorithm (picks random k)
  3. Assigns each user a TARGET
  4. Saves assignments to DB
  5. Sends FCM notification to each user with their target
    ↓
FCM Notification arrives on device:
{
  notification: {
    title: "New Challenge!",
    body: "Check your app"
  },
  data: {
    targetNickname: "Sneaky Cat",
    challengeText: "Take a selfie with them"
  }
}
    ↓
Dev 3's FCM handler receives notification
Calls navigation.navigate('challenge-reveal', {
  targetNickname: 'Sneaky Cat',
  challengeText: 'Take a selfie with them'
})
    ↓
ChallengeRevealScreen displays as MODAL:
┌─────────────────────────────────────┐
│                                     │
│  🚨 New Challenge! 🚨              │
│                                     │
│  Your Target:                       │
│  Sneaky Cat                         │
│                                     │
│  Your Mission:                      │
│  Take a selfie with them            │
│                                     │
│  [Got it!]                          │
│                                     │
└─────────────────────────────────────┘
    ↓
User taps "Got it!"
    ↓
navigation.goBack()
Modal closes, returns to room-lobby
    ↓
Still polling continues...
```

---

## 🔌 How State Management Works

### React Hooks in Action

#### 1. AdminQRScreen (Stateless Component)
```typescript
Component receives: roomId via route.params
Renders: Static QR code display
State: NONE (purely presentational)
```

#### 2. ScannerScreen (State Heavy)
```typescript
State Variables:
  • permission: boolean (camera permission granted?)
  • scanned: boolean (did user scan a code?)
  • loading: boolean (joining room?)

Flow:
  permission state → show permission request or camera
  scanned state → show scan again button
  loading state → disable button while joining
```

#### 3. RoomLobbyScreen (Polling State)
```typescript
State Variables:
  • participants: Participant[] (list of users)
  • loading: boolean (initial fetch?)
  • error: string | null (error message)
  • isAdmin: boolean (can I start challenge?)

useEffect Hook (The Magic):
  ┌─────────────────────────────────────┐
  │ MOUNT (screen shows)                │
  │  ↓                                   │
  │ Call fetchRoomData() immediately    │
  │  ↓                                   │
  │ Create setInterval (5000ms)         │
  │  ↓                                   │
  │ Return cleanup function             │
  └─────────────────────────────────────┘

  While screen is mounted:
    Timer 0s:   fetchRoomData()
    Timer 5s:   fetchRoomData()
    Timer 10s:  fetchRoomData()
    Timer 15s:  fetchRoomData()
    ...

  When screen unmounts:
    clearInterval() stops the timer
    API calls stop
```

#### 4. ChallengeRevealScreen (Props Only)
```typescript
Component receives: targetNickname, challengeText via route.params
State: NONE (purely presentational)
Renders: Modal display with challenge data
```

---

## 📡 API Integration Architecture

### Three-Tier Communication

```
                  FRONTEND (React Native)
                  ├─ ScannerScreen
                  ├─ RoomLobbyScreen
                  └─ api.ts (axios instance)
                           ↓
                         HTTP
                         (JSON)
                           ↓
                  BACKEND (NestJS + MongoDB)
                  ├─ Dev 1: Rooms endpoints
                  ├─ Dev 2: Challenge endpoints
                  └─ Database: Room documents
                           ↓
                    Push Notifications
                    (Firebase Cloud Messaging)
                           ↓
                  DEVICE (Push Service)
                  └─ FCM Service receives notification
                     → Dev 3 handlers
                     → Navigate to challenge-reveal
```

### API Calls Mapped to Components

```typescript
// scanner.tsx
axios.post('/rooms/join', {
  roomId: 'room-123',
  userId: 'uuid-xxx',
  fcmToken: 'fcm-xxx'
})
// Joins user to room

// room-lobby.tsx - POLLING
axios.get('/rooms/room-123')
// Called immediately, then every 5 seconds
// Gets updated participant list

// room-lobby.tsx - ADMIN ONLY
axios.post('/rooms/room-123/start-challenge')
// Admin triggers challenge assignment

// room-lobby.tsx
axios.post('/rooms/room-123/leave', { userId })
// User leaves room
```

---

## 🎯 Navigation Stack Structure

### How Expo Router Works

```
app/_layout.tsx (ROOT)
│
├─ (tabs)
│  ├─ index.tsx (Home/Start Screen)
│  └─ explore.tsx
│
├─ modal.tsx
│
├─ admin-qr.tsx ← ← ← ← ← ← ← ← Router pushes here
│  Router.push({
│    pathname: '/admin-qr',
│    params: { roomId: 'x' }
│  })
│
├─ scanner.tsx ← ← ← ← ← ← ← User navigates here
│  Router.push('/scanner')
│     ↓ On scan success
│
├─ room-lobby.tsx ← ← ← User joins
│  Router.push({
│    pathname: '/room-lobby',
│    params: { roomId: 'x' }
│  })
│
└─ challenge-reveal.tsx ← ← ← FCM fires
   Navigation.navigate('challenge-reveal', {
     targetNickname: 'x',
     challengeText: 'y'
   })
   MODAL presentation_type
```

---

## 🔄 The Polling Mechanism (5-Second Updates)

### Why Polling Instead of WebSockets?

**Polling Advantages**:
- ✅ Simple HTTP, no special setup
- ✅ Works even if connection drops
- ✅ Easy to restart polling
- ✅ 7-hour hackathon = build speed matters
- ✅ 5-10 second updates are fast enough

**How It Works**:

```
Timeline:

T=0s   ┌─ useEffect runs
       │  └─ fetchRoomData() called
       │     └─ GET /rooms/123
       │        └─ Participant list: [A, B]
       │
T=5s   ┌─ setInterval triggers
       │  └─ fetchRoomData() called
       │     └─ GET /rooms/123
       │        └─ Participant list: [A, B, C] ← C just joined!
       │        └─ FlatList re-renders
       │
T=10s  ├─ setInterval triggers
       │  └─ GET /rooms/123
       │     └─ Participant list: [A, B, C]
       │
T=15s  ├─ setInterval triggers
       │  └─ GET /rooms/123
       │     └─ Participant list: [A, B, C, D] ← D just joined!
       │        └─ FlatList re-renders
       │
...    └─ Until user leaves screen → clearInterval() stops


Code in room-lobby.tsx:
───────────────────────

useEffect(() => {
  // STEP 1: Fetch immediately on mount
  fetchRoomData();

  // STEP 2: Create interval that calls fetch every 5000ms
  const interval = setInterval(() => {
    fetchRoomData();
  }, 5000);

  // STEP 3: Return cleanup function
  return () => {
    clearInterval(interval);  // Stops polling when unmounted
  };
}, [roomId]); // Re-run if roomId changes
```

---

## 🧩 Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     App Entry Point                      │
│                    _layout.tsx                           │
│            (Navigation routing setup)                    │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│                  Home Screen (tabs)                      │
│                                                          │
│    [Create Room Button]    [Join Room Button]           │
│              ↓                        ↓                  │
└──────────────────────────────────────────────────────────┘
        ↓                                  ↓
┌─────────────────────┐        ┌──────────────────────┐
│  Admin QR Screen    │        │  Scanner Screen      │
│  admin-qr.tsx       │        │  scanner.tsx         │
│                     │        │                      │
│  Shows QR code      │        │  Uses CameraView     │
│  No state changes   │        │  Scans bar codes     │
│  Static display     │        │  Calls /rooms/join   │
│                     │        │  Gets roomId: "123"  │
│                     │        │                      │
│                     │        │  ↓ SUCCESS           │
└─────────────────────┘        └──────────────────────┘
                                      ↓
                     ┌────────────────────────────────────┐
                     │     Room Lobby Screen              │
                     │     room-lobby.tsx                 │
                     │                                    │
                     │  ┌─ POLLING STARTS (every 5s)     │
                     │  │                                 │
                     │  ├─ STATE: [participants]         │
                     │  ├─ STATE: [isAdmin]              │
                     │  │                                 │
                     │  ├─ fetchRoomData()               │
                     │  │  API: GET /rooms/123           │
                     │  │  Returns: participants array   │
                     │  │  Updates FlatList              │
                     │  │                                 │
                     │  ├─ Admin-only button             │
                     │  │  "Start Challenge"             │
                     │  │  Calls: POST /start-challenge  │
                     │  │                                 │
                     │  └─ Polls until user navigates    │
                     │                                    │
                     └────────────────────────────────────┘
                                ↓
                   [FCM Notification arrives]
                   [Dev 3 receives notification]
                                ↓
                     ┌──────────────────────────┐
                     │ Challenge Reveal Screen  │
                     │ challenge-reveal.tsx     │
                     │                          │
                     │ Modal Overlay            │
                     │ Shows:                   │
                     │ - Target nickname       │
                     │ - Challenge text        │
                     │ - "Got it!" button      │
                     │                          │
                     │ On dismiss:              │
                     │ Goes back to lobby      │
                     │ (polling continues)     │
                     └──────────────────────────┘
```

---

## 🌐 Data Flow: From Backend to Screen

```
MongoDB (Backend stores):
{
  _id: ObjectId("123"),
  room_name: "Majorat",
  participants: [
    {
      user_id: "uuid-1",
      nickname: "Dog",
      pfp_url: "https://...",
      fcm_token: "fcm-1"
    }
  ]
}
          ↓
          ↓ GET /rooms/123
          ↓
NestJS (Backend returns JSON):
{
  "_id": "123",
  "room_name": "Majorat",
  "participants": [...]
}
          ↓
          ↓ HTTP Response
          ↓
Axios (Frontend receives JSON):
const response = await axios.get('/rooms/123')
response.data = {
  _id: "123",
  room_name: "Majorat",
  participants: [...]
}
          ↓
          ↓ setParticipants(response.data.participants)
          ↓
React State (Component re-renders):
participants = [
  {
    user_id: "uuid-1",
    nickname: "Dog",
    ...
  }
]
          ↓
          ↓ FlatList uses participants array
          ↓
Screen Displays:
┌─────────────┐
│ [D] Dog     │
└─────────────┘
```

---

## 📋 Event Timeline (Complete Example)

```
T=0:00  User opens app → Home screen
T=0:05  User taps "Join Room"
T=0:08  Scanner screen opens, camera loads
T=0:15  User scans QR code → roomId="room-123"
T=0:16  POST /rooms/join called
T=0:17  API returns success
T=0:18  Router navigates to room-lobby (roomId="room-123")
T=0:19  RoomLobbyScreen mounts
        ↓
        useEffect runs:
        • fetchRoomData() called
        • GET /rooms/room-123
        • Backend returns: 2 participants [Dog, Cat]
        • participants state updated
        • setInterval(5s) created
        ↓
T=0:20  Screen shows "2 participants" with Dog and Cat
T=0:25  Polling triggers (5s later)
        GET /rooms/room-123
        Backend returns: 3 participants [Dog, Cat, Eagle]
        participants state updated
        FlatList re-renders
T=0:26  Screen shows "3 participants" with Dog, Cat, Eagle
T=0:30  User (admin) taps "Start Challenge"
        POST /rooms/room-123/start-challenge
        Dev 2 backend:
        • Runs algorithm
        • Assigns targets
        • Sends FCM notifications
        ↓
T=0:31  FCM notification arrives on each device
        Dev 3 handler triggers
        Navigation.navigate('challenge-reveal', {...})
        ↓
T=0:32  Modal pops up with challenge
        "Your Target: Cat"
        "Take a selfie with them"
T=0:33  User taps "Got it!"
        Modal dismisses
        Back to room-lobby (still polling)
T=0:35  Polling triggers
        Still 3 participants
        No visual change
...
```

---

## 🔑 Key Concepts Summary

| Concept | How It Works | Example |
|---------|------------|---------|
| **Navigation** | Expo Router helps switch between screens | `router.push('/scanner')` |
| **State** | React hooks to track data that changes | `[participants, setParticipants]` |
| **useEffect** | Run code when component mounts/updates | Polling setup happens here |
| **Polling** | Repeatedly request data from backend | Every 5 seconds get `/rooms/123` |
| **API Client** | Axios handles HTTP requests | `axios.get()` and `axios.post()` |
| **Props** | Pass data to screens via navigation | `params: { roomId: '123' }` |
| **Styling** | StyleSheet for UI layout | `fontSize: 20, padding: 10` |
| **Real-time** | FCM push notifications trigger changes | Challenge modal appears instantly |

---

## 🚀 Quick Mental Model

Think of the frontend as a **smart observer**:

1. **Screen A** (Home) → User picks action
2. **Screen B** (Scanner/QR) → Collects info from user
3. **API Call** → Sends info to backend
4. **Screen C** (Lobby) → **STARTS WATCHING** via polling
5. **Every 5s** → "Hey backend, what's new?" ← GET request
6. **Backend** → "Now there's 3 people, was 2"
7. **React** → "Update my state!" ← `setParticipants()`
8. **Screen** → "Redraw with new data!" ← FlatList re-renders
9. **FCM** → BREAKS the pattern and forces an update
10. **Screen D** (Challenge) → Modal pops up instantly

**The Core Idea**: Frontend polls backend every 5 seconds, but FCM can interrupt to show real-time challenges.
