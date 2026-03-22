# Visual Flow Diagrams

## 1. Screen Navigation Flow

```
                    app/_layout.tsx
                    (Root Navigator)
                           │
                ┌──────────┼──────────┐
                │          │          │
           (tabs)      modal      Custom Screens
                │
        ┌───────┴───────┐
        │               │
    index.tsx      explore.tsx
   (Home)          (Other)
        │
        ├─ [Create Room] ─────────→ admin-qr.tsx
        │                          (Show QR Code)
        │
        └─ [Join Room] ───────────→ scanner.tsx
                                   (Scan QR Code)
                                        │
                                        └─→ room-lobby.tsx
                                           (Polling every 5s)
                                                │
                                                └─→ challenge-reveal.tsx
                                                   (FCM Modal)
```

---

## 2. Admin Creating Room Flow

```
╔═══════════════════════════════════════════╗
║  Admin Dashboard (Home Screen)            ║
║  Taps: "Create Room"                      ║
╚═══════════════════════════════════════════╝
           │
           ↓
┌─────────────────────────────────────┐
│ Frontend: scanner.tsx - PART 1      │
│                                     │
│ Calls:                              │
│ POST /rooms                         │
│ {                                   │
│   room_name: "Majorat Mihai",      │
│   admin_nickname: "raffaelo",      │
│   expires_at: timestamp            │
│ }                                   │
└─────────────────────────────────────┘
           │
           ├──── HTTP ────→ NestJS Backend
           │
           ←──── JSON ────← MongoDB
           │
┌─────────────────────────────────────┐
│ Response:                           │
│ {                                   │
│   _id: "5e7a9c3b",                 │
│   room_name: "Majorat Mihai",      │
│   room_code: "ABC123"              │
│ }                                   │
└─────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────┐
│ Frontend: admin-qr.tsx              │
│                                     │
│ Receives: roomId = "5e7a9c3b"      │
│                                     │
│ Renders:                            │
│ ┌─────────────────────────────────┐ │
│ │  ████████████████████████████   │ │
│ │  ████████████████████████████   │ │
│ │  ████░░░░░░░░░░░░░░░░░░████   │ │
│ │  ████░░░ 5e7a9c3b ░░░░░░████   │ │
│ │  ████░░░░░░░░░░░░░░░░░░████   │ │
│ │  ████████████████████████████   │ │
│ │                                 │ │
│ │  Room ID: 5e7a9c3b             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Admin shows this to other users     │
└─────────────────────────────────────┘
```

---

## 3. User Scanning & Joining Flow

```
╔═══════════════════════════════════════════╗
║  User Device - Home Screen                ║
║  Taps: "Join Room"                        ║
╚═══════════════════════════════════════════╝
           │
           ↓
┌─────────────────────────────────────┐
│ Frontend: scanner.tsx               │
│                                     │
│ 1. Requests camera permission       │
│    ↓                                │
│ 2. Opens camera view                │
│    ┌─────────────────────────┐      │
│    │  📷 Camera View         │      │
│    │                         │      │
│    │  [Aiming at QR code]    │      │
│    │                         │      │
│    │  ░░░░░░░░░░░░░░░░░░    │      │
│    │  ░░░░░ QR CODE ░░░░░░  │      │
│    │  ░░░░░░░░░░░░░░░░░░    │      │
│    │                         │      │
│    └─────────────────────────┘      │
│                                     │
│ 3. Detects barcode → "5e7a9c3b"   │
└─────────────────────────────────────┘
           │
           ↓
     [Scanned!]
           │
           ↓
┌─────────────────────────────────────┐
│ Frontend: Extracted roomId           │
│ roomId = "5e7a9c3b"                 │
│                                     │
│ Gets from Dev 3:                    │
│ userId = "uuid-123-from-storage"    │
│ fcmToken = "fcm-token-from-firebase"│
└─────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────┐
│ Frontend: POST /rooms/join          │
│                                     │
│ {                                   │
│   roomId: "5e7a9c3b",              │
│   userId: "uuid-123",              │
│   fcmToken: "fcm-xxx",             │
│   nickname: "Sneaky Cat"           │
│ }                                   │
└─────────────────────────────────────┘
           │
           ├──── HTTP ────→ NestJS Backend
           │
           └──← Mongoose adds to array ←─┘
                room.participants.push({
                  user_id: "uuid-123",
                  nickname: "Sneaky Cat",
                  fcm_token: "fcm-xxx"
                })
           │
           ↓
┌─────────────────────────────────────┐
│ Response: { success: true, room }   │
└─────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────┐
│ Frontend: router.push()             │
│ Navigate to: /room-lobby            │
│ Pass: { roomId: "5e7a9c3b" }       │
└─────────────────────────────────────┘
```

---

## 4. The Polling Loop (Room Lobby)

```
╔═══════════════════════════════════════════╗
║  RoomLobbyScreen mounts                   ║
╚═══════════════════════════════════════════╝
           │
           ↓
    useEffect() runs
           │
           ├─────────────────────────────────────┐
           │                                     │
           │ 1. IMMEDIATE: Call fetch()          │
           │                                     │
           ↓                                     ↓
    │ GET /rooms/5e7a9c3b
    │              ↓
    │ Response: {
    │   participants: [
    │     { nickname: "Dog" },
    │     { nickname: "Cat" }
    │   ]
    │ }
    │              ↓
    │ setParticipants([Dog, Cat])
    │              ↓
    │ Screen renders with 2 participants
    │
    │ [D] Tremendous Dog
    │ [C] Sneaky Cat
    │
    └─────────────────────────────────────────┐
                                               │
                2. CREATE INTERVAL (5000ms)   │
                                               │
              COUNT DOWN: 5 seconds...        │
              4...3...2...1...                │
                                               │
                   TICK! ──────────────────────┤
                          │
                   GET /rooms/5e7a9c3b
                          ↓
                   NEW participants:
                   {
                     participants: [
                       { nickname: "Dog" },
                       { nickname: "Cat" },
                       { nickname: "Eagle" }
                     ]
                   }
                          ↓
                   setParticipants([Dog, Cat, Eagle])
                          ↓
                   Screen re-renders!
                   [D] Tremendous Dog
                   [C] Sneaky Cat
                   [E] Flying Eagle  ← NEW!
                          │
              COUNT DOWN: 5 seconds...
              4...3...2...1...
                          │
                   TICK! ─┴─────────────────────┐
                          │                     │
                   ...polling continues...      │
                                               │
                   UNTIL USER NAVIGATES AWAY   │
                          ↓
                   cleanup() runs
                          ↓
                   clearInterval()
                          ↓
                   Polling STOPS
                   No more API calls
```

---

## 5. Challenge Assignment & Notification Flow

```
╔═══════════════════════════════════════════╗
║  Admin in Room Lobby Screen               ║
║  Taps: "Start Challenge" button           ║
╚═══════════════════════════════════════════╝
           │
           ↓
┌─────────────────────────────────────┐
│ Frontend: Calls Dev 2 API           │
│ POST /rooms/5e7a9c3b/start-challenge
└─────────────────────────────────────┘
           │
           ├──── HTTP ────→ NestJS Backend (Dev 2)
           │
           │ Backend Algorithm:
           │ 1. SELECT all participants from room
           │    [Dog, Cat, Eagle]
           │
           │ 2. SHUFFLE randomly
           │    [Cat, Eagle, Dog]
           │
           │ 3. PICK k (e.g., k=2)
           │
           │ 4. ASSIGN using offset formula:
           │    i=0: Cat (user at 0)     → Eagle (at (0+2)%3=2)
           │    i=1: Eagle (user at 1)   → Dog (at (1+2)%3=0)
           │    i=2: Dog (user at 2)     → Cat (at (2+2)%3=1)
           │
           │ 5. SAVE to database:
           │    assignments = {
           │      "uuid-cat": "uuid-eagle",
           │      "uuid-eagle": "uuid-dog",
           │      "uuid-dog": "uuid-cat"
           │    }
           │
           │ 6. FOR EACH participant:
           │    a. Build FCM message
           │    b. Send push notification
           │
           ├────── Push Notification 1 ────→ Cat's Device
           │ {
           │   data: {
           │     targetNickname: "Eagle",
           │     challengeText: "Take a selfie"
           │   }
           │ }
           │
           ├────── Push Notification 2 ────→ Eagle's Device
           │ {
           │   data: {
           │     targetNickname: "Dog",
           │     challengeText: "Take a selfie"
           │   }
           │ }
           │
           └────── Push Notification 3 ────→ Dog's Device
             {
               data: {
                 targetNickname: "Cat",
                 challengeText: "Take a selfie"
               }
             }
                          │
              ╔═══════════╩═══════════╗
              │                       │
    ┌─────────↓────────────┐ ┌───────↓────────────┐
    │ Cat's Phone Device   │ │ Dog's Phone Device │
    │                      │ │                    │
    │ FCM Service receives │ │ FCM Service        │
    │ notification         │ │ receives           │
    │         │            │ │ notification       │
    │         ↓            │ │         │          │
    │ Dev 3 Handler        │ │         ↓          │
    │ (FCM listener)       │ │ Dev 3 Handler      │
    │         │            │ │         │          │
    │         ↓            │ │         ↓          │
    │ Calls navigation:    │ │ Calls navigation:  │
    │ navigate(            │ │ navigate(          │
    │  'challenge-reveal', │ │  'challenge-reveal'│
    │  {                   │ │  {                 │
    │   targetNickname:    │ │   targetNickname:  │
    │   "Eagle",           │ │   "Cat",           │
    │   challengeText:     │ │   challengeText:   │
    │   "Selfie"           │ │   "Selfie"         │
    │  }                   │ │  }                 │
    │ )                    │ │ )                  │
    │         │            │ │         │          │
    │         ↓            │ │         ↓          │
    │ Modal pops up:       │ │ Modal pops up:     │
    │ ┌──────────────────┐ │ │ ┌──────────────┐  │
    │ │ 🚨New Challenge! │ │ │ │ 🚨Challenge! │  │
    │ │                  │ │ │ │              │  │
    │ │ Target: Eagle    │ │ │ │ Target: Cat  │  │
    │ │ Selfie           │ │ │ │ Selfie       │  │
    │ │ [Got it!]        │ │ │ │ [Got it!]    │  │
    │ └──────────────────┘ │ │ └──────────────┘  │
    │            │         │ │         │         │
    │    [User taps]       │ │  [User taps]      │
    │            │         │ │         │         │
    │            ↓         │ │         ↓         │
    │    Modal closes      │ │  Modal closes     │
    │    Back to lobby     │ │  Back to lobby    │
    │    Polling resumes   │ │  Polling resumes  │
    │                      │ │                   │
    └──────────────────────┘ └───────────────────┘
```

---

## 6. Complete App State Timeline

```
User Action          Frontend State          Backend DB           Screen Display
──────────────────   ──────────────────      ──────────────────   ──────────────────

App Opens            location: home          Room list empty      [Home Screen]
                     participants: []                              [Create Room]
                                                                   [Join Room]

[Tap Create Room]    loading: true           -                    [Loading...]

Create Submitted     roomId: "abc123"        {                    [QR Screen]
                                             _id: "abc123",
                                             participants: []
                                             }

[Tap Join Room]      loading: false          Room "abc123" exists [Scanner Screen]
                     scanned: false                                [Camera]

Scan QR              scanned: true           -                    [Alert "Scanned!"]
                     roomId: "abc123"
                     loading: true

Join API Success     roomId: "abc123"        {                    [Navigator...]
                     loading: false          _id: "abc123",
                     location: lobby         participants: [
                                               { nickname: "User"
                                               }
                                             ]
                                             }

Lobby Mounted        participants: [1]       Same ↑               [Lobby]
                     polling: ACTIVE                              [1 participant]

T=5s Polling         participants: [1]       Same ↑               [Still 1]
                     next fetch: 5s

T=10s Another        participants: [2]       participants: [       [2 participants!]
user joined          next fetch: 5s          {user1},             [User1]
                                             {user2}              [NewUser]
                                             ]

T=15s Polling        participants: [2]       Same ↑               [Still 2]

[Admin taps          isAdmin: true           Algorithm runs!      [Processing...]
 Start Challenge]    challengeStarted: true  Assignments:
                                             user1 → user2
                                             user2 → user1

FCM Notification     -                       -                    [Modal pops!]
Arrives                                                            Challenge Reveal

[Got it!]            -                       -                    Back to Lobby

T=30s                participants: [2]       -                    Polling continues
(Cron runs)          challenged: true        New assignments      Still in lobby
```

---

## 7. Data Structure at Each Stage

```
┌─────────────────────────────────────────────────────────┐
│ Stage 1: Room Created (Backend)                         │
├─────────────────────────────────────────────────────────┤
│ {                                                       │
│   _id: ObjectId("5e7a9c3b"),                           │
│   room_name: "Majorat Mihai",                          │
│   admin_nickname: "raffaelo",                          │
│   created_at: ISODate("2024-05-20"),                   │
│   expires_at: ISODate("2024-05-21"),                   │
│   participants: [],                                    │
│   active_alerts: []                                    │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
                   User Joins
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Stage 2: After First User Joins                         │
├─────────────────────────────────────────────────────────┤
│ {                                                       │
│   _id: ObjectId("5e7a9c3b"),                           │
│   room_name: "Majorat Mihai",                          │
│   admin_nickname: "raffaelo",                          │
│   participants: [                                      │
│     {                                                   │
│       user_id: "uuid-123",                            │
│       nickname: "Sneaky Cat",                         │
│       pfp_url: "https://firebase/pfp.jpg",           │
│       fcm_token: "fcm-token-123",                     │
│       last_active: ISODate("2024-05-20T22:15:00Z")  │
│     }                                                  │
│   ],                                                   │
│   active_alerts: []                                    │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
              Admin Starts Challenge
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Stage 3: Challenge Assignments Created                  │
├─────────────────────────────────────────────────────────┤
│ assignments collection:                                 │
│ {                                                       │
│   room_id: "5e7a9c3b",                                │
│   round: 1,                                            │
│   assignments: [                                       │
│     {                                                   │
│       assigner_id: "uuid-123",                        │
│       assigner_nickname: "Sneaky Cat",                │
│       target_id: "uuid-456",                          │
│       target_nickname: "Tremendous Dog",              │
│       challenge_text: "Take a selfie",                │
│       timestamp: ISODate(...)                         │
│     }                                                   │
│   ]                                                    │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
           FCM Notifications Sent
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Stage 4: Frontend Receives Challenge                    │
├─────────────────────────────────────────────────────────┤
│ FCM Payload:                                            │
│ {                                                       │
│   notification: {                                       │
│     title: "🚨 New Challenge!",                        │
│     body: "Check your app"                             │
│   },                                                    │
│   data: {                                               │
│     targetNickname: "Tremendous Dog",                  │
│     challengeText: "Take a selfie together"            │
│   }                                                    │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Dependency Injection (How Components Talk)

```
utils/api.ts (Shared across app)
│
├─ Exports: apiClient (axios instance)
├─ Exports: roomAPI (helper functions)
├─ BASE_URL: http://192.168.x.x:3000
│
├────→ Used by scanner.tsx
│      • apiClient.post('/rooms/join')
│
├────→ Used by room-lobby.tsx
│      • apiClient.get('/rooms/:id') [polling]
│      • apiClient.post('/start-challenge')
│      • apiClient.post('/rooms/leave')
│
└────→ Could be used by any other screen
       • Central API configuration
       • Easy to update backend URL
       • Consistent error handling
```

---

## 9. Memory & Performance

```
┌─ High Priority (Keep in Memory)
│  └─ participants array (polling updates)
│  └─ roomId (used across effects)
│  └─ isAdmin (conditional rendering)
│
├── Medium Priority (Cache)
│  └─ Room name
│  └─ Participant avatars (loaded once)
│
└─ Low Priority (Fetch as needed)
   └─ Challenge descriptions
   └─ Historical data

When screen unmounts:
  ↓
cleanup() function runs
  ↓
clearInterval() stops polling
  ↓
No more API calls
  ↓
Memory released
```

---

## Summary: 30-Second Version

**Frontend = Smart Watcher + Network Client**

1. **Navigate** = Expo Router switches screens
2. **Get Input** = Scanner reads QR code
3. **Send Data** = API calls to backend
4. **Receive Data** = axios gets JSON response
5. **Store Data** = React useState hooks
6. **Display Data** = StyleSheet renders UI
7. **Watch for Changes** = Poll every 5 seconds
8. **React to Changes** = State updates trigger re-renders
9. **Instant Updates** = FCM notifications interrupt to show challenges
10. **Clean Up** = Stop polling when user leaves screen
