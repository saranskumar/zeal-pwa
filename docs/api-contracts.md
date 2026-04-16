# API / Data Contracts

Since the application uses a thick client connected via Supabase client, API contracts are essentially Postgres table structures and TypeScript `Zod` schemas enforced via RLS boundaries.

### Authentication
- Mechanism: Email OTP (Supabase GoTrue)
- Token Storage: LocalStorage via Supabase Client

### Core Shapes
Consistent shape handled via `@supabase/supabase-js`. 
In hooks, failures throw and are caught by TanStack Query boundaries.

```typescript
// Shared Zod Shapes
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
