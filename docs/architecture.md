# Zeal System Architecture

## 1. High-Level Overview
Zeal is a high-performance, mobile-first Study Tracker (PWA) designed with a "Deterministic Planning Brain." Unlike traditional trackers, Zeal automatically calculates daily study loads based on subject strength, exam dates, and historical momentum.

The system follows a **thick-client architecture**, where the core intelligence (Planning Engine) runs entirely in the browser for instant feedback, while Supabase handles data persistence, authentication, and social synchronization.

---

## 2. Core Architecture Layers

### A. Presentation Layer (Frontend)
- **Framework**: React 18 + Vite.
- **UI Architecture**: Atomic components following **Minimalist Material Design** (inspired by Minimals.cc).
- **State Management**:
  - **Zustand (Client State)**: Manages UI states (Theme, Sidebar, Modals), offline sync queues, and current session caching.
  - **TanStack Query (Server State)**: Orchestrates all Supabase interactions (Caching, Revalidation, Optimistic Updates).
- **Styling**: Tailwind CSS with custom shadow elevations and a muted, professional Emerald color palette.

### B. Logic Layer (The Engines)
Located in `src/core/`, these are framework-agnostic TypeScript modules:
1. **Planning Engine**: Calculates topic priorities using Subject Strength (Weak/Average/Strong) and Exam Proximity.
2. **Reschedule Engine**: Automatically handles carried-over topics and gaps in study history.
3. **Score Engine**: Generates XP and Streaks based on "Topic Completion" vs "Time Spent."

### C. Backend Layer (Supabase)
- **Database**: PostgreSQL with strict Row Level Security (RLS).
- **Auth**: Hybrid flow supporting **Google OAuth** and **Email OTP**.
- **Edge Functions**: Cron jobs for midnight plan resets and global leaderboard calculations.
- **Triggers**: PL/pgSQL functions for automatic profile generation on signup.

---

## 3. Key Workflows

### Authentication & Identification
1. **Login**: User enters email or clicks Google.
2. **Verification**: App receives 6-digit OTP or OAuth session.
3. **Username Interceptor**: A React gate (`AppShell.tsx`) detects if a user has a generic system username. It forces the **ChooseUsername** modal if needed.
4. **Availability API**: Real-time debounced checks against the `users` table ensure username uniqueness.

### The Planning Cycle
1. **Input**: User adds subjects and topic counts.
2. **Execution**: The `PlanningEngine` produces a 7-day snapshot.
3. **Persistence**: Plan versioning saves snapshots to `daily_plan_versions` to allow history viewing even if the engine logic evolves.

### Offline & Sync
- **Workbox (PWA)**: Assets are cached via Service Workers for 100% offline startup.
- **Offline Queue**: When a user marks a topic as done while offline, the action is saved to `localStorage`.
- **Replay Mechanism**: On `window.online`, the `AppShell` automatically replays the saved mutations to Supabase.

---

## 4. Database Schema (Snapshot)
- `users`: Profiles, custom usernames, and avatar links.
- `subjects`: Metadata (Exam date, Strength).
- `topics`: The unit of work (Priority, Status).
- `daily_plans`: Junction table linking users to topics on specific dates.
- `scores`: Daily and cumulative XP snapshots.
- `friendships`: Recursive user links for social leaderboards.

---

## 5. Security Model
- **Input Validation**: `Zod` schemas validate every form and API boundary.
- **Data Privacy**: RLS policies ensure `auth.uid()` can only read/write their own rows (except for the public `users` and `scores` tables for social features).
- **Secrets**: Environment variables (`.env`) are never committed to Git; deployment uses Vercel Environment Secrets.

---

## 6. Design Principles (The "Zeal" Way)
- **Structure > Decoration**: Functionality is prioritized over fluff.
- **Muted Professionalism**: Using soft slates and subtle shadows to prevent "Study Fatigue."
- **Zero Latency**: Optimistic updates ensure the app feels instant, even on slow mobile networks.
