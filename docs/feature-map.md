# Feature Map

## Current Implementation (Phase 1 & 2 Scaffold MVP)

[X] **Client Routing & Auth Protection**
  - Supabase OTP + **Google OAuth** flow
  - Zustand Auth Store
  - **Username Interceptor Gate** with real-time uniqueness validation

[X] **Progressive Onboarding** (Redesigned Flow)
  - Interactive multi-step funnel capturing Subjects, Topics, Intensity.
  - Plan Preview Generation via Planning Engine. 

[X] **Planning Engine Module** (Pure TypeScript)
  - `generatePlan`: Scans inputs, scores remaining topics based on weakness, urgency, and intensity configuration, distributes assignments across days.

[X] **Reschedule / Roll-over Engine**
  - Triggers on daily open. 
  - Overdue topics updated. 
  - Past state saved to `daily_plan_versions` snapshot.
  - New targets inserted to `daily_plans`.

[X] **Score Engine & Anti-Cheat**
  - Time tracking via `study_logs`.
  - Topics completed via `daily_plans` cross validation.
  - Applies 50% penalty if topics completed but no hours studied logged.
  - Caps at 100 daily points. 

[X] **Social Sub-System**
  - Search + Add Friends lookup.
  - Friend requests accepted/declined flow via DB triggers + RLS boundaries.
  - Leaderboard calculated client-side by joining scores against active friendships.
  - Activity Feed streams via discriminated events payload log.

[X] **PWA Application Shell**
  - Full mobile responsiveness. Sticky bottom mobile navigation. Glassmorphic UI tokenization.

[X] **Offline Readiness**
  - Configured Vite PWA cache patterns. 
  - IndexedDB sync queue implemented for asynchronous replay when network restored.

## Phase 3+ (Pending)

[ ] PWA App Store Wrappers
[ ] Advanced Analytics (Radar charts for Subject performance)
[ ] Notifications / Web Push Integrations
