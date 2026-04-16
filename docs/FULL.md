# Zeal PWA — Full Project Documentation

This document contains the consolidated technical documentation for the Zeal Study Tracker project.

---

## 1. System Architecture
> Originally in: `docs/architecture.md`

### High-Level Overview
Zeal is a high-performance, mobile-first Study Tracker (PWA) designed with a "Deterministic Planning Brain." Unlike traditional trackers, Zeal automatically calculates daily study loads based on subject strength, exam dates, and historical momentum.

The system follows a **thick-client architecture**, where the core intelligence (Planning Engine) runs entirely in the browser for instant feedback, while Supabase handles data persistence, authentication, and social synchronization.

### Core Architecture Layers

#### A. Presentation Layer (Frontend)
- **Framework**: React 18 + Vite.
- **UI Architecture**: Atomic components following **Minimalist Material Design** (inspired by Minimals.cc).
- **State Management**:
  - **Zustand (Client State)**: Manages UI states (Theme, Sidebar, Modals), offline sync queues, and current session caching.
  - **TanStack Query (Server State)**: Orchestrates all Supabase interactions (Caching, Revalidation, Optimistic Updates).
- **Styling**: Tailwind CSS with custom shadow elevations and a muted, professional Emerald color palette.

#### B. Logic Layer (The Engines)
Located in `src/core/`, these are framework-agnostic TypeScript modules:
1. **Planning Engine**: Calculates topic priorities using Subject Strength (Weak/Average/Strong) and Exam Proximity.
2. **Reschedule Engine**: Automatically handles carried-over topics and gaps in study history.
3. **Score Engine**: Generates XP and Streaks based on "Topic Completion" vs "Time Spent."

#### C. Backend Layer (Supabase)
- **Database**: PostgreSQL with strict Row Level Security (RLS).
- **Auth**: Hybrid flow supporting **Google OAuth** and **Email OTP**.
- **Edge Functions**: Cron jobs for midnight plan resets and global leaderboard calculations.
- **Triggers**: PL/pgSQL functions for automatic profile generation on signup.

### Key Workflows

#### Authentication & Identification
1. **Login**: User enters email or clicks Google.
2. **Verification**: App receives 6-digit OTP or OAuth session.
3. **Username Interceptor**: A React gate (`AppShell.tsx`) detects if a user has a generic system username. It forces the **ChooseUsername** modal if needed.
4. **Availability API**: Real-time debounced checks against the `users` table ensure username uniqueness.

#### The Planning Cycle
1. **Input**: User adds subjects and topic counts.
2. **Execution**: The `PlanningEngine` produces a 7-day snapshot.
3. **Persistence**: Plan versioning saves snapshots to `daily_plan_versions` to allow history viewing even if the engine logic evolves.

#### Offline & Sync
- **Workbox (PWA)**: Assets are cached via Service Workers for 100% offline startup.
- **Offline Queue**: When a user marks a topic as done while offline, the action is saved to `localStorage`.
- **Replay Mechanism**: On `window.online`, the `AppShell` automatically replays the saved mutations to Supabase.

### Database Schema (Snapshot)
- `users`: Profiles, custom usernames, and avatar links.
- `subjects`: Metadata (Exam date, Strength).
- `topics`: The unit of work (Priority, Status).
- `daily_plans`: Junction table linking users to topics on specific dates.
- `scores`: Daily and cumulative XP snapshots.
- `friendships`: Recursive user links for social leaderboards.

### Security Model
- **Input Validation**: `Zod` schemas validate every form and API boundary.
- **Data Privacy**: RLS policies ensure `auth.uid()` can only read/write their own rows (except for the public `users` and `scores` tables for social features).
- **Secrets**: Environment variables (`.env`) are never committed to Git; deployment uses Vercel Environment Secrets.

### Design Principles (The "Zeal" Way)
- **Structure > Decoration**: Functionality is prioritized over fluff.
- **Muted Professionalism**: Using soft slates and subtle shadows to prevent "Study Fatigue."
- **Zero Latency**: Optimistic updates ensure the app feels instant, even on slow mobile networks.

---

## 2. Architecture & Design Decisions
> Originally in: `docs/decisions.md`

1. **Client-Side Deterministic Planning (No AI)**
   - **Decision**: Implemented as pure TypeScript (`src/core/planning-engine.ts`) without external server calls. Uses a weighted priority formula.
   - **Consequence**: Ultra-fast execution, zero API limits, easy to unit test, offline compatible out of the box.

2. **Reschedule Engine & Auditability**
   - **Decision**: Instead of overwriting rows, the reschedule engine snapshots the current plan into `daily_plan_versions` before recalculating and patching `daily_plans`.
   - **Consequence**: Full audit trail of what was requested vs what happened. Protects user state against sync edge-case failures.

3. **Anti-Cheat Scoring**
   - **Decision**: Implemented in `src/core/score-engine.ts`. Topic completion score is cut by 50% (`penalty_applied`) if a daily `study_logs` record is missing.
   - **Consequence**: Validates engagement. 

4. **Progressive Onboarding**
   - **Decision**: 9-step local state form that only commits to DB upon explicit confirmation at the end. Generates a preview plan seamlessly.

5. **Edge Function UTC Midnight Cron**
   - **Decision**: Edge function cron runs at 00:00 UTC. The UI components format and adjust displays using `date-fns` locally. Allows for a highly simplified backend without heavy queue workers for regional times.

6. **Minimal Material Design Overhaul**
   - **Decision**: PWA migrated to **Material Design 3** (M3) aesthetics using Emerald Green (#10b981) branding. Replaced generic Tailwind shadows with M3 Elevation tokens. Added `canvas-confetti` reward system for psychological reinforcement on topic completion.
   - **Consequence**: Better dark mode support, higher visual clarity, and increased user satisfaction/engagement through visual feedback.

7. **Minimals.cc Aesthetic Pivot**
   - **Decision**: Shifted from high-vibrancy Material 3 to the **Minimals.cc** design protocol. Replaced stark shadows with low-opacity diffused elevations and used soft slates for backgrounds.
   - **Consequence**: Reduced visual fatigue, more modern "SaaS" feel, and better clarity on mobile.

8. **Post-Login Username Interceptor Gate**
   - **Decision**: Implemented an `AppShell` level interceptor (`ChooseUsername.tsx`) that halts UX progress for users with generic system-generated usernames. Includes a debounced real-time availability check against the PostgreSQL database.
   - **Consequence**: Guaranteed uniqueness of human-readable IDs without complicating the initial auth transaction.

9. **Hybrid OAuth + OTP Auth Flow**
   - **Decision**: Added Google OAuth support alongside the 6-digit Email OTP system. Standardized redirect logic to ensure session injection before routing.
   - **Consequence**: Lower barrier to entry for desktop users and mobile users with Google accounts.

---

## 3. Technology Stack
> Originally in: `docs/tech-stack.md`

### Frontend (PWA)
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript (es2023 target)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS v3
- **Design System**: Minimal Material 3 (Emerald Branding)
- **Icons**: Lucide React
- **Animations**: canvas-confetti (Reward system)
- **Data Fetching & Server State**: TanStack Query (v5)
- **Client State**: Zustand
- **Form Validation / Schema**: Zod
- **Offline / PWA**: vite-plugin-pwa (Workbox), idb (IndexedDB bindings)
- **Date Utilities**: date-fns
- **Charts**: Recharts

### Backend
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Auth**: Supabase Auth (Email OTP + Google OAuth)
- **Realtime**: Supabase Realtime (Scores / Activity Events)
- **Functions**: Supabase Edge Functions (Deno)

---

## 4. API / Data Contracts
> Originally in: `docs/api-contracts.md`

### Authentication
- Mechanism: Email OTP + Google OAuth
- Token Storage: LocalStorage via Supabase Client

### Shared Zod Shapes
```typescript
export const SubjectSchema = z.object({
  id:         z.string().uuid(),
  name:       z.string(),
  strength:   z.enum(['weak', 'average', 'strong']),
  exam_date:  z.string().nullable()
})

// Activity Payload Discriminated Union
export type ActivityEvent =
  | { event_type: "topic_completed"; payload: { topic_id: string; subject_name: string } }
  | { event_type: "hours_logged";    payload: { subject_id: string; hours: number } }
  | { event_type: "streak_milestone"; payload: { streak_count: number } }
  | { event_type: "friend_joined";   payload: { friend_user_id: string } }
```

### RLS Contracts
- Users only read/modify their own UUID-scoped rows.
- **Scores & Activity Events**: Visible to owner *and* directly connected friends via `friendships` lookup policy.

---

## 5. Feature Map
> Originally in: `docs/feature-map.md`

### Current Implementation (Phase 1 & 2 Scaffold MVP)
- [X] **Client Routing & Auth Protection** (OTP + Google + Username Interceptor)
- [X] **Progressive Onboarding** (Interactive funnel + Planning preview)
- [X] **Planning Engine Module** (Priority scoring + Exam urgency)
- [X] **Reschedule / Roll-over Engine** (Midnight snapshots + Patching)
- [X] **Score Engine & Anti-Cheat** (Time tracking validation)
- [X] **Social Sub-System** (Friendships + Friend Leaderboard + Activity Feed)
- [X] **PWA Application Shell** (Minimals.cc UI + Mobile navigation)
- [X] **Offline Readiness** (Workbox + IndexedDB Mutation Queue)

### Phase 3+ (Pending)
- [ ] PWA App Store Wrappers
- [ ] Advanced Analytics (Radar charts for Subject performance)
- [ ] Notifications / Web Push Integrations
