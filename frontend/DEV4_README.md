# Party App - Dev 4 Frontend Documentation

## Overview
Dev 4 is responsible for the QR code generation/scanning, room lobby, and challenge reveal screens. This guide explains the setup and provides integration points for other developers.

## Screens Created

### 1. AdminQRScreen (`app/admin-qr.tsx`)
**Purpose**: Admin generates a QR code for the room ID
**Route**: `/admin-qr`
**Props**:
- `roomId` (passed via navigation params)

**Features**:
- Displays QR code with room ID
- Shows room ID as text fallback

**Integration Points**:
- Receives `roomId` from Dev 1's room creation endpoint
- Dev 1 should navigate here after creating a room

### 2. UserScannerScreen (`app/scanner.tsx`)
**Purpose**: Users scan the QR code to join a room
**Route**: `/scanner`

**Features**:
- Camera permission handling
- QR code scanning with `expo-camera`
- Calls DEV1's `/rooms/join` endpoint
- Auto-navigates to room lobby on success

**Integration Points**:
- TODO: Update the Join Room API call with actual endpoint from Dev 1
- Dev 3 should provide `userId` and `fcmToken` from AsyncStorage

**Current Mock Behavior**:
```typescript
const userId = 'placeholder-user-uuid';
const fcmToken = 'placeholder-fcm-token';
```

### 3. RoomLobbyScreen (`app/room-lobby.tsx`)
**Purpose**: Shows room participants and allows admin to start challenges
**Route**: `/room-lobby`
**Props**:
- `roomId` (passed via navigation params)

**Features**:
- Polls room data every 5 seconds (configurable via `setInterval`)
- Displays participant list with avatars
- Shows participant count
- Admin can start challenges
- Users can leave room
- Real-time participant updates

**Integration Points**:
- TODO: Implement `GET /rooms/:roomId` endpoint (Dev 1)
- TODO: Implement `POST /rooms/:roomId/start-challenge` endpoint (Dev 2)
- TODO: Implement `POST /rooms/:roomId/leave` endpoint (Dev 1)

**Current Mock Data**:
```typescript
const mockData = [
  { user_id: '1', nickname: 'Tremendous Dog', pfp_url: '' },
  { user_id: '2', nickname: 'Sneaky Cat', pfp_url: '' },
  { user_id: '3', nickname: 'Flying Eagle', pfp_url: '' },
];
```

### 4. ChallengeRevealScreen (`app/challenge-reveal.tsx`)
**Purpose**: Displays the challenge when admin triggers it
**Route**: `/challenge-reveal`
**Props**:
- `targetNickname`: Nickname of the target user
- `challengeText`: The challenge description

**Features**:
- Dark theme design (matches party vibe)
- Shows target and mission clearly
- Dismissible modal

**Integration Points**:
- This screen is triggered by **FCM Push Notification** (Dev 3's responsibility)
- Dev 2 sends the challenge data in the push notification payload
- Example payload:
```json
{
  "notification": {
    "title": "New Challenge!",
    "body": "Check your app"
  },
  "data": {
    "targetNickname": "Sneaky Cat",
    "challengeText": "Take a selfie with them"
  }
}
```

## API Configuration

**File**: `utils/api.ts`

Contains axios client and helper functions. Update `API_BASE_URL`:

```typescript
// For development (replace with your local IP)
export const API_BASE_URL = 'http://192.168.x.x:3000';
```

Or use environment variable in your `.env`:
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

## Timeline Integration

### Hour 1 (Setup & API Contracts)
- ✅ Frontend screens created
- TODO: Define exact API request/response payloads with Dev 1
- TODO: Setup environment variables for backend URL

### Hours 2-4 (Core Assembly)
- ✅ Dev 4 screens ready to use
- Replace mock data with real API calls as Dev 1 finishes
- Dev 3: Integrate user identity (UUID) and FCM token storage
- Dev 1: Build the REST endpoints

### Hour 5 (Integration)
- Update `room-lobby.tsx` with real API calls
- Dev 2: Send FCM notifications with challenge data
- Integrate FCM notification handler to navigate to `challenge-reveal`

### Hour 6 (Edge Cases)
- Test user leaving mid-party
- Verify participant list updates correctly

### Hour 7 (Polish)
- Hardcode 1-minute interval for demo: Change `5000` to `60000` in polling
- Polish UI if time permits

## Key Configuration

### Polling Interval
In `room-lobby.tsx`, line ~51:
```typescript
const interval = setInterval(() => {
  fetchRoomData();
}, 5000); // 5 seconds for development, 30-60 seconds for production
```

For the 7-hour hackathon demo:
```typescript
}, 60000); // 1 minute for judges to see challenges live
```

## Testing Instructions

### Test Locally with Mock Data
1. All screens have mock data built-in
2. Navigate to each route to verify UI
3. No backend required for initial UI testing

### Test with Real Backend
1. Update `utils/api.ts` with your backend URL
2. Uncomment API calls in each component
3. Ensure Dev 1's endpoints are ready

### Test QR Code Flow
1. Run app on two devices
2. On Admin device: Navigate to `/admin-qr` and generate QR
3. On User device: Navigate to `/scanner` and scan QR
4. Verify automatic navigation to `/room-lobby` on both devices

### Test Polling
1. Open room lobby on two devices
2. Verify participant list updates every 5 seconds
3. One device joins → check both devices update

### Test Challenge Reveal
1. For testing without FCM, manually navigate:
```typescript
navigation.navigate('challenge-reveal', {
  targetNickname: 'Test User',
  challengeText: 'Test Challenge'
});
```

## Common Issues & Solutions

### Camera Permission Denied
- Clear app cache and reinstall
- Grant camera permission in device settings
- Ensure `expo-camera` is properly linked

### QR Code Not Scanning
- Ensure good lighting
- Try different distances (10-30cm)
- Test with a different QR code generator

### Polling Not Updating
- Check network connectivity
- Verify backend is returning correct data
- Check browser DevTools or Expo logs for API errors

### Firebase/FCM Issues (Dev 3)
- Ensure FCM token is properly formatted
- Check Firebase credentials are loaded
- Verify Device has internet connection

## File Structure

```
frontend/
├── app/
│   ├── _layout.tsx              (Updated with new routes)
│   ├── admin-qr.tsx             (QR Generator)
│   ├── scanner.tsx              (QR Scanner)
│   ├── room-lobby.tsx           (Lobby with Polling)
│   └── challenge-reveal.tsx     (Challenge Reveal)
├── utils/
│   └── api.ts                   (API configuration)
└── ...
```

## Next Steps for Dev 4

1. ✅ Core screens implemented
2. TODO: Coordinate API contracts with Dev 1
3. TODO: Set correct backend URL in utils/api.ts
4. TODO: Replace mock data with real API calls
5. TODO: Test FCM notification integration with Dev 3
6. TODO: Polish UI based on design preferences

## Quick Commands

```bash
# Start development
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

## Notes for Dev 4

- **Polling vs WebSockets**: We use polling (every 5s) for robustness in a 7-hour sprint
- **FCM for Real-time**: Push notifications are the "trigger" for challenges, not polling
- **Mock Data**: Keep mock data for rapid testing while backend is being built
- **Error Handling**: Add user-friendly error messages for all API failures
- **State Management**: Current approach uses React hooks; consider Redux if complexity grows

## Communication with Other Devs

- **Dev 1**: Need GET/POST /rooms endpoints, room schema confirmation
- **Dev 2**: Need challenge assignment algorithm output, FCM notification format
- **Dev 3**: Need Firebase FCM integration, user identity (UUID) and image upload
