# Quick Testing Guide - Dev 4

## Screen Navigation Quick Commands

Add these to your entry point or test buttons in the home screen to quickly navigate between screens:

```typescript
// In app/(tabs)/index.tsx or any screen

import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function TestingMenu() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dev 4 Testing Menu</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push({
          pathname: '/admin-qr',
          params: { roomId: 'test-room-12345' }
        })}
      >
        <Text style={styles.buttonText}>Test Admin QR Screen</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/scanner')}
      >
        <Text style={styles.buttonText}>Test QR Scanner</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push({
          pathname: '/room-lobby',
          params: { roomId: 'test-room-12345' }
        })}
      >
        <Text style={styles.buttonText}>Test Room Lobby</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push({
          pathname: '/challenge-reveal',
          params: {
            targetNickname: 'Sneaky Cat',
            challengeText: 'Take a selfie doing a silly pose together!'
          }
        })}
      >
        <Text style={styles.buttonText}>Test Challenge Reveal</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
```

---

## Test Cases

### Test 1: Admin QR Generation ✓
**Steps**:
1. Click "Test Admin QR Screen"
2. Verify QR code displays
3. Verify room ID shows below QR
4. Take screenshot to show admin
5. ✅ Expected: QR code visible and readable

**Testing QR Code**:
- Use your phone camera to scan the QR (double-tap if it doesn't auto-scan)
- Should show "test-room-12345" text

---

### Test 2: QR Scanner ✓
**Steps**:
1. Click "Test QR Scanner"
2. Grant camera permission if prompted
3. Aim at a QR code (use phone 1 showing admin QR)
4. Wait for scan detection
5. ✅ Expected: Alert shows QR data and navigates to lobby

**No QR Code Available?**
- Use any online QR generator
- Create a QR with value: `test-room-12345`
- Scan it on your device

**Troubleshooting**:
- If camera doesn't open, check permissions in device settings
- If it won't scan, try better lighting
- Check Android vs iOS permissions might differ

---

### Test 3: Room Lobby with Polling ✓
**Steps**:
1. Click "Test Room Lobby"
2. Observe participant list
3. Wait 5+ seconds
4. ✅ Expected: No changes (mock data is static), but polling is running in background

**Verify Polling is Working**:
- Check Expo logs: `console.log()` statements should print every 5 seconds
- Add this temporary log to `room-lobby.tsx` line ~60:
```typescript
useEffect(() => {
  fetchRoomData();
  console.log(`[POLLING] Fetching room ${roomId} at ${new Date().toISOString()}`);

  const interval = setInterval(() => {
    fetchRoomData();
    console.log(`[POLLING] Fetching room ${roomId} at ${new Date().toISOString()}`);
  }, 5000);

  return () => clearInterval(interval);
}, [roomId]);
```

---

### Test 4: Challenge Reveal ✓
**Steps**:
1. Click "Test Challenge Reveal"
2. Observe challenge card
3. Read target and mission
4. Click "Got it!"
5. ✅ Expected: Modal closes and you return to previous screen

**Modal Behavior**:
- Should appear as an overlay
- Should have dark theme
- Should show red header
- Button should be red

---

## Mock Data Reference

Current mock participants used across screens:
```typescript
[
  {
    user_id: '1',
    nickname: 'Tremendous Dog',
    pfp_url: ''
  },
  {
    user_id: '2',
    nickname: 'Sneaky Cat',
    pfp_url: ''
  },
  {
    user_id: '3',
    nickname: 'Flying Eagle',
    pfp_url: ''
  },
]
```

To test with different participants, edit `room-lobby.tsx` line ~39.

---

## Performance Testing

### Polling Stress Test
1. Open Room Lobby
2. Leave it open for 2+ minutes
3. Check:
   - ✅ No crash
   - ✅ No memory leak (check if device gets hot)
   - ✅ Battery drain is minimal
   - ✅ Logs show polling continues

### Navigation Stress Test
1. Rapidly tap between different screens
2. Navigate back and forth 10+ times
3. Check:
   - ✅ No crash
   - ✅ Smooth transitions
   - ✅ State is preserved

---

## Integration Testing with Raw Data

When Dev 1 provides endpoint, test with real data:

**Step 1**: Update `utils/api.ts`
```typescript
export const API_BASE_URL = 'http://192.168.1.10:3000'; // Your backend IP
```

**Step 2**: Uncomment actual API calls in components

**Step 3**: In `room-lobby.tsx`, replace mock with:
```typescript
const fetchRoomData = async () => {
  try {
    const response = await apiClient.get(`/rooms/${roomId}`);
    setParticipants(response.data.participants);
    setIsAdmin(response.data.admin_nickname === localAdminNickname);
    setError(null);
  } catch (err) {
    console.error('Error fetching room data', err);
    setError('Failed to load participants');
  } finally {
    setLoading(false);
  }
};
```

**Step 4**: In `scanner.tsx`, uncomment the join call

---

## Debugging Tips

### View Network Requests
1. Use Expo's network inspector:
   - In Expo DevTools, enable "Network" tab
   - Make API calls and watch requests/responses

### View Console Logs
1. Run: `npm start`
2. Press `w` for web, `a` for Android, or `i` for iOS
3. Type `j` to open debugger
4. Console logs will show there

### Check Device Logs
- Android: `adb logcat | grep ReactNativeJS`
- iOS: Use Xcode console

### Test with Network lag
- Throttle network in DevTools
- Verify UI still works with 3G speed
- Verify loading indicators show

---

## Changelog During Development

Update as you add features:

- [x] Admin QR screen created
- [x] QR scanner component created
- [x] Room lobby with polling created
- [x] Challenge reveal screen created
- [ ] Real API integration (pending Dev 1)
- [ ] FCM notification handler (pending Dev 3)
- [ ] User authentication flow (pending Dev 3)
- [ ] Challenge submission (new feature TBD)

---

## Common Development Issues

### Issue: "roomId is undefined"
**Solution**: Always check navigation params exist:
```typescript
const roomId = (route.params as any)?.roomId || 'default-id';
```

### Issue: "Camera permission stuck"
**Solution**: Clear app data and reinstall
```bash
# For Android
adb uninstall expo.latest
npm start
```

### Issue: "Polling keeps calling after unmount"
**Solution**: Verify cleanup in useEffect return:
```typescript
return () => clearInterval(interval);
```

### Issue: "Navigation screens don't exist"
**Solution**: Verify routes added to `_layout.tsx`

---

## Before Pushing to Team

Checklist before you commit:
- [ ] All screens render without crashing
- [ ] No console errors in Expo DevTools
- [ ] Mock data displays correctly
- [ ] Navigation between screens works
- [ ] Comments explain TODO items
- [ ] API endpoints documented
- [ ] README.md updated if needed
- [ ] Test file or instructions included

---

## Quick Commands for Testing

```bash
# Start dev server
npm start

# Clear cache
watchman watch-del-all
npm start -- --reset-cache

# Run on specific device
npm run android
npm run ios
npm run web

# View Expo logs live
npm start -- --offline  # For offline dev testing

# Install new package
npx expo install [package-name]
```

---

## Useful Dev Tools

- **React DevTools**: Inspect component tree
- **Flipper**: Debug network, database, logs
- **Expo DevTools**: Built into Expo, press `m` while running

---

## Questions for Team Sync-ups

**For Dev 1**:
- What's the exact getUserId/getAdminNickname API endpoint?
- Should we poll every 5 seconds or less?
- Do you have test server we can hit?

**For Dev 2**:
- FCM notification format confirmed?
- How long between cron runs (30 min)?
- How to test challenge assignment logic?

**For Dev 3**:
- How do we get userId and fcmToken?
- Any special FCM setup on frontend?
- When will identity flow be ready?
