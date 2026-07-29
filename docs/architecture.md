# BuildableLabs – Wildcard Generalist Engineer Assessment

**Time limit:** 48 hours
**Task:** Build a real-time live streaming platform (mobile + backend + n8n automation)

## What to Build

### Creator App
- Start/end live stream
- View live viewer count
- Read viewer chat

### Viewer App
- Browse and join streams
- Watch video, view viewer count
- Send chat messages

### Backend
- Real-time video + chat sync
- Concurrent viewer tracking
- Offline support (queue chat locally, sync when online, handle conflicts/ordering)

### n8n Automation
- Stream starts → notify followers
- Viewer count > 100 (or milestone) → alert creator
- Stream ends → auto-generate highlights
- Daily digest of top streams

## Build Phases

1. **Phase 1 – Streaming:** Core start/end stream, join/watch, live viewer count, basic synced chat
2. **Phase 2 – Offline:** Local chat queueing, ordered sync on reconnect, conflict resolution
3. **Phase 3 – Automation:** All four n8n workflows above

## Submission Requirements

1. GitHub repo with `/mobile`, `/backend`, `/n8n-workflow` folders
2. Prompt-sharing doc/chat link (documenting AI prompts used)
3. n8n workflow export file
4. The working app itself

## Important Clarifications (from BuildableLabs)

**Scope:** The three phases are independent — **pick any 2 of the 3** and go deep on those. Don't spread thin trying to attempt all three; quality of execution matters more than breadth.

**Tech stack:** React Native + Expo, Supabase, n8n for automation (read requirements carefully before starting).

**After submission:**
- Team reviews the submission
- You'll receive a questionnaire to fill out based on your assessment work
- If shortlisted, a technical interview focused entirely on your submission — decisions, trade-offs, and thought process

**Other notes:**
- 48-hour window is a hard stop — no extensions
- They care more about how well you execute your chosen 2 phases than how many you attempt