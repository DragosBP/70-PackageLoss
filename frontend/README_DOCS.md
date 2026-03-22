# Frontend Documentation Index

## 📚 How to Navigate The Docs

You have comprehensive documentation spread across multiple files. Here's where to look for what:

---

## For Different Questions

### "How does the overall app flow work?"
→ Read **ARCHITECTURE.md** (📖 25 min read)
- Complete user journeys
- State management explanation
- API integration architecture
- Component interaction diagrams
- Event timelines

### "I want visual diagrams of the flows"
→ Read **VISUAL_FLOWS.md** (📊 20 min read)
- Navigation stack diagram
- Admin creating room flow
- User scanning & joining flow
- The polling loop visualization
- Challenge notification flow
- Complete timeline diagram

### "How do I set up and test?"
→ Read **DEV4_README.md** (⚙️ 15 min read)
- Screen descriptions
- API configuration
- Timeline integration
- Testing instructions

### "How do I test each screen quickly?"
→ Read **TESTING.md** (🧪 10 min read)
- Quick navigation commands
- Test cases with steps
- Mock data reference
- Debugging tips

### "I need to integrate with another dev's code"
→ Read **INTEGRATION.md** (🔌 20 min read)
- API endpoints expected from each dev
- Data flow diagrams
- FCM notification format
- Communication templates

### "I need a quick reminder of what does what"
→ Read **QUICK_REF.md** (⚡ 5 min read)
- File list
- Navigation commands
- API endpoints summary
- Common issues & fixes

---

## 📄 Documentation Files Summary

| File | Purpose | Read Time | Best For |
|------|---------|-----------|----------|
| **ARCHITECTURE.md** | Deep dive into how everything works | 25 min | Understanding the full system |
| **VISUAL_FLOWS.md** | Diagrams and visual representations | 20 min | Visual learners |
| **DEV4_README.md** | Complete feature guide | 15 min | Getting started |
| **INTEGRATION.md** | How to work with other devs | 20 min | Team coordination |
| **TESTING.md** | Testing guide | 10 min | Running tests |
| **QUICK_REF.md** | One-page cheat sheet | 5 min | Quick lookup |
| **This File** | Navigation guide | 10 min | Finding what you need |

---

## 🎯 Common Scenarios

### Scenario 1: "I just started, what do I need to know?"
1. Read: **QUICK_REF.md** (5 min)
2. Read: **DEV4_README.md** (15 min)
3. Run screens in emulator to see them work (5 min)
4. **Total: 25 minutes**

---

### Scenario 2: "I need to integrate with Dev 1's API"
1. Read: **INTEGRATION.md** (API Endpoints section)
2. Read: **ARCHITECTURE.md** (API Integration Architecture section)
3. Uncomment API calls in the relevant .tsx file
4. Test with curl or Postman manually first
5. **Total: 30 minutes**

---

### Scenario 3: "I need to understand the polling mechanism"
1. Read: **ARCHITECTURE.md** (The Polling Mechanism section)
2. Read: **room-lobby.tsx** (lines 53-64 in code)
3. View **VISUAL_FLOWS.md** (The Polling Loop section)
4. **Total: 15 minutes**

---

### Scenario 4: "I need to debug why polling isn't working"
1. Read: **TESTING.md** (Debugging Tips section)
2. Read: **ARCHITECTURE.md** (useEffect Hook explanation)
3. Check **room-lobby.tsx** for the polling code
4. Add console.logs and check Expo DevTools
5. **Total: 20 minutes**

---

### Scenario 5: "How do FCM notifications work?"
1. Read: **INTEGRATION.md** (Challenge Reveal Screen section)
2. Read: **VISUAL_FLOWS.md** (Challenge Notification Flow)
3. Read: **ARCHITECTURE.md** (useEffect and Navigation Stack sections)
4. Check **utils/notifications.ts** for placeholder code
5. Coordinate with Dev 3 for implementation
6. **Total: 25 minutes**

---

## 🔍 Quick Tips for Each File

### ARCHITECTURE.md
- **Search for**: "complete user flow", "state management", "polling"
- **Has**: Step-by-step walkthroughs
- **Best for**: Understanding the "why" and "how"

### VISUAL_FLOWS.md
- **Search for**: "diagram", "timeline", "flow"
- **Has**: ASCII diagrams of every process
- **Best for**: Visual understanding, showing to teammates

### DEV4_README.md
- **Search for**: "screen", "integration point", "mock"
- **Has**: Feature descriptions and setup instructions
- **Best for**: Getting started, finding what's implemented

### INTEGRATION.md
- **Search for**: "API endpoint", "payload", "Dev 1", "Dev 2"
- **Has**: Communication templates and data structures
- **Best for**: Team coordination and API contracts

### TESTING.md
- **Search for**: "test case", "troubleshooting", "command"
- **Has**: Step-by-step test procedures
- **Best for**: Debugging and verification

### QUICK_REF.md
- **Search for**: Anything - it's all on one page!
- **Has**: Tables and quick lists
- **Best for**: Quick lookups while coding

---

## 💡 The Mental Model

Think of the app in **4 key sections**:

### 1. **Navigation** (How screens switch)
- File: `app/_layout.tsx`
- Concept: Expo Router manages screen stack
- Used by: All screens

### 2. **User Input** (How we get data from users)
- Files: `scanner.tsx`, `admin-qr.tsx`
- Concept: Read QR codes, take input, pass to next screen
- Data passes via: `router.push({ params: {...} })`

### 3. **Real-time Updates** (How we watch for changes)
- File: `room-lobby.tsx`
- Concept: Polling every 5 seconds
- Mechanism: `useEffect` + `setInterval` + `axios.get`

### 4. **Instant Notifications** (How we react immediately)
- File: `challenge-reveal.tsx`
- Concept: FCM push notification triggers modal
- Handled by: Dev 3's FCM service

---

## 🚀 Quick Start Path

```
1. Read QUICK_REF.md (5 min)
   ↓
2. Open DEV4_README.md (10 min)
   ↓
3. Run: npm start
   ↓
4. Tap through each screen manually (10 min)
   ↓
5. Read ARCHITECTURE.md sections as you navigate (20 min)
   ↓
6. You now understand the frontend!
```

**Total: ~45 minutes to understand the complete system**

---

## 📋 File Cross-References

If you're in **ARCHITECTURE.md** and want more:
- On "Polling Mechanism" → See **VISUAL_FLOWS.md** "The Polling Loop"
- On "API Integration" → See **INTEGRATION.md** "API Endpoints"
- On "Testing Changes" → See **TESTING.md** "Integration Testing"

If you're in **VISUAL_FLOWS.md** and want more:
- On "Polling Loop Diagram" → Read **ARCHITECTURE.md** Polling section
- On "FCM Flow" → Read **INTEGRATION.md** Challenge Reveal section
- On "Navigation" → Read **DEV4_README.md** Screens section

If you're in **DEV4_README.md** and want more:
- On "How Polling Works" → All details in **ARCHITECTURE.md**
- On "API Contracts" → See **INTEGRATION.md**
- On "Testing" → See **TESTING.md**

---

## 🎬 Example: Understanding Room Lobby

**Question**: "How does the room lobby show live participant updates?"

**Answer Path**:

1. **Start**: QUICK_REF.md
   - "RoomLobbyScreen - Polls room data every 5 seconds"

2. **Understand**: ARCHITECTURE.md > "The Polling Mechanism"
   - Learn how useEffect and setInterval work together

3. **Visualize**: VISUAL_FLOWS.md > "The Polling Loop"
   - See ASCII diagram of timing

4. **Implement**: INTEGRATION.md > API Endpoints
   - Know what GET /rooms/:id returns

5. **Code**: Open `room-lobby.tsx`
   - See the actual implementation

6. **Test**: TESTING.md > "Verify Polling is Working"
   - Follow the testing steps

7. **Done!** You understand how room lobby works

**Time Spent**: 30 minutes

---

## 🔧 When You Need to Code

1. **Adding a new screen?** → Read DEV4_README.md screens section
2. **Fixing a bug?** → Read TESTING.md debugging section
3. **Understanding console.log placement?** → Read ARCHITECTURE.md state management section
4. **Changing polling interval?** → See QUICK_REF.md "Key Constants"
5. **Integrating with API?** → Read INTEGRATION.md API section

---

## 📞 Quick Contact Guide

| Problem | Read This | Action |
|---------|-----------|--------|
| Polling not updating | ARCHITECTURE.md > Polling section | Check network in DevTools |
| Camera won't open | TESTING.md > Common Issues | Check permissions |
| API errors | INTEGRATION.md > API Endpoints | Verify URL and payload |
| Confusion on flow | VISUAL_FLOWS.md | Print diagram and study |
| Need to change URL | QUICK_REF.md > Key Constants | Update utils/api.ts |
| How to test | TESTING.md > Test Cases | Follow step-by-step |

---

## 📈 Learning Path

### Beginner (Just want to see it work)
1. QUICK_REF.md
2. TESTING.md
3. Run the app

### Intermediate (Want to understand it)
1. QUICK_REF.md
2. DEV4_README.md
3. ARCHITECTURE.md
4. Run and modify

### Advanced (Want to master it)
1. All the above +
2. VISUAL_FLOWS.md
3. INTEGRATION.md
4. All source files (.tsx)
5. Backend API docs from other devs

---

## 🎯 Before Your Next Standup

Prepare answers to these questions (each answer should reference which doc):

1. "How does QR code flow work?" → VISUAL_FLOWS.md
2. "Why polling and not WebSockets?" → ARCHITECTURE.md or QUICK_REF.md
3. "What does the room lobby data look like?" → INTEGRATION.md
4. "When will User 3's update appear on User 1's screen?" → ARCHITECTURE.md
5. "How do challenges appear?" → VISUAL_FLOWS.md Challenge flow

---

## 💬 Share Documentation with Team

**For Dev 1** (Backend):
- Send: INTEGRATION.md (API Endpoints section)
- Ask: Confirm JSON payloads match expectations

**For Dev 2** (Challenge Engine):
- Send: INTEGRATION.md (Challenge Reveal section)
- Ask: FCM notification payload format confirmed?

**For Dev 3** (Firebase & Identity):
- Send: INTEGRATION.md (Dev 3 Endpoints section)
- Ask: When userId and fcmToken ready?

**For your teammates**:
- Send: VISUAL_FLOWS.md
- Purpose: Show how your screens fit into the flow

---

## 🎓 Key Takeaways

After reading this documentation, you should understand:

✅ How navigation between screens works
✅ How to pass data between screens
✅ How polling updates the participant list
✅ How FCM notifications work
✅ Where each API call is made
✅ How to test each feature
✅ How to debug issues
✅ How to integrate with other devs

---

## 🆘 If You're Stuck

1. **First**: Check QUICK_REF.md "Common Issues"
2. **Second**: Search in the relevant .md file (Ctrl+F)
3. **Third**: Read the code comments in the .tsx file
4. **Fourth**: Ask in standup with reference: "I read ARCHITECTURE.md but..."
5. **Last**: Check browser DevTools or Expo logs

---

## 📝 Notes for Updating Docs

- ✅ Keep QUICK_REF.md updated after any major change (most referenced)
- ✅ Update ARCHITECTURE.md if design changes
- ✅ Update INTEGRATION.md when API contracts change
- ✅ Add examples to TESTING.md as you find bugs
- ✅ Keep this index file current

---

Last Updated: 2026-03-22
Questions? Check the documentation above! 🚀
