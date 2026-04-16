# Technology Stack

## Frontend (PWA)
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

## Backend
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Auth**: Supabase Auth (Email OTP)
- **Realtime**: Supabase Realtime (Scores / Activity Events)
- **Functions**: Supabase Edge Functions (Deno)

## Justification
- **Client-Heavy Architecture**: The planning engine is completely deterministic and fast. It runs natively in the browser via TypeScript without network round-trips.
- **Supabase**: RLS (Row Level Security) perfectly maps to a user-centric data structure, maintaining strict data boundaries while providing backend functionality (auth, db, events) without a dedicated Node backend.
- **TanStack Query + Zustand**: Separation of concerns logic (Rule: *State: Separate client (UI) state from server (fetched) state. Never mix them.*)
- **Tailwind + shadcn/ui**: High-quality, accessible UI primitives with extremely customizable CSS. Matches the PRD directly.
