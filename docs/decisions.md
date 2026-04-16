# Architecture & Design Decisions

1. **Client-Side Deterministic Planning (No AI)**
   - **Context**: The planning engine is the core feature.
   - **Decision**: Implemented as pure TypeScript (`src/core/planning-engine.ts`) without external server calls. Uses a weighted priority formula.
   - **Consequence**: Ultra-fast execution, zero API limits, easy to unit test, offline compatible out of the box.

2. **Reschedule Engine & Auditability**
   - **Context**: Topics not done by midnight need to carry over.
   - **Decision**: Instead of overwriting rows, the reschedule engine snapshots the current plan into `daily_plan_versions` before recalculating and patching `daily_plans`.
   - **Consequence**: Full audit trail of what was requested vs what happened. Protects user state against sync edge-case failures.

3. **Anti-Cheat Scoring**
   - **Context**: Users could cheat the leaderboard by marking everything as "completed" without studying.
   - **Decision**: Implemented in `src/core/score-engine.ts`. Topic completion score is cut by 50% (`penalty_applied`) if a daily `study_logs` record is missing.
   - **Consequence**: Validates engagement. 

4. **Progressive Onboarding**
   - **Context**: Drop-off risks during signups.
   - **Decision**: 9-step local state form that only commits to DB upon explicit confirmation at the end. Generates a preview plan seamlessly.

5. **Edge Function UTC Midnight Cron**
   - **Context**: The streak logic and overdue topic updates run daily. User timezones vary.
   - **Decision**: Edge function cron runs at 00:00 UTC. The UI components format and adjust displays using `date-fns` locally. Allows for a highly simplified backend without heavy queue workers for regional times.

6. **Minimal Material Design Overhaul**
   - **Context**: Polishing the app for a premium, study-focused "Emerald" identity.
   - **Decision**: PWA migrated to **Material Design 3** (M3) aesthetics using Emerald Green (#10b981) branding. Replaced generic Tailwind shadows with M3 Elevation tokens. Added `canvas-confetti` reward system for psychological reinforcement on topic completion.
   - **Consequence**: Better dark mode support, higher visual clarity, and increased user satisfaction/engagement through visual feedback.

