import { z } from 'zod'

// ─── Enums ─────────────────────────────────────────────────────────────────

export const SubjectStrengthSchema = z.enum(['weak', 'average', 'strong'])
export const PlanIntensitySchema   = z.enum(['chill', 'balanced', 'aggressive'])
export const TopicStatusSchema     = z.enum(['pending', 'completed', 'overdue'])
export const FriendshipStatusSchema = z.enum(['pending', 'accepted', 'declined', 'blocked'])

export type SubjectStrength  = z.infer<typeof SubjectStrengthSchema>
export type PlanIntensity    = z.infer<typeof PlanIntensitySchema>
export type TopicStatus      = z.infer<typeof TopicStatusSchema>
export type FriendshipStatus = z.infer<typeof FriendshipStatusSchema>

// ─── Domain schemas ─────────────────────────────────────────────────────────

export const SubjectSchema = z.object({
  id:         z.string().uuid(),
  user_id:    z.string().uuid(),
  name:       z.string().min(1).max(100),
  exam_date:  z.string().nullable(),           // ISO date string, nullable
  strength:   SubjectStrengthSchema,
  created_at: z.string(),
})

export const TopicSchema = z.object({
  id:             z.string().uuid(),
  subject_id:     z.string().uuid(),
  user_id:        z.string().uuid(),
  title:          z.string().min(1).max(200),
  status:         TopicStatusSchema,
  priority_score: z.number().default(0),
  created_at:     z.string(),
  completed_at:   z.string().nullable(),
  deleted_at:     z.string().nullable(),
})

export const DailyPlanSchema = z.object({
  id:            z.string().uuid(),
  user_id:       z.string().uuid(),
  topic_id:      z.string().uuid(),
  assigned_date: z.string(),                   // ISO date 'YYYY-MM-DD'
  is_completed:  z.boolean().default(false),
  carried_over:  z.boolean().default(false),
  version:       z.number().int().default(1),
  created_at:    z.string(),
})

export const DailyPlanVersionSchema = z.object({
  id:             z.string().uuid(),
  user_id:        z.string().uuid(),
  plan_date:      z.string(),
  version_number: z.number().int(),
  snapshot:       z.record(z.string(), z.unknown()),       // jsonb — typed at app layer
  change_reason:  z.string(),
  created_at:     z.string(),
})

export const StudyLogSchema = z.object({
  id:            z.string().uuid(),
  user_id:       z.string().uuid(),
  subject_id:    z.string().uuid(),
  log_date:      z.string(),                   // ISO date 'YYYY-MM-DD'
  hours_studied: z.number().min(0).max(24),
  created_at:    z.string(),
})

export const ScoreSchema = z.object({
  id:               z.string().uuid(),
  user_id:          z.string().uuid(),
  score_date:       z.string(),
  daily_points:     z.number().int(),
  cumulative_points:z.number().int(),
  streak_count:     z.number().int(),
  raw_topic_points: z.number().int(),
  raw_time_points:  z.number().int(),
  penalty_applied:  z.boolean(),
  updated_at:       z.string(),
})

export const FriendshipSchema = z.object({
  id:           z.string().uuid(),
  requester_id: z.string().uuid(),
  addressee_id: z.string().uuid(),
  status:       FriendshipStatusSchema,
  created_at:   z.string(),
  updated_at:   z.string(),
})

export const UserProfileSchema = z.object({
  id:           z.string().uuid(),
  username:     z.string().min(3).max(30),
  display_name: z.string().max(60).nullable(),
  avatar_url:   z.string().url().nullable(),
  created_at:   z.string(),
})

// ─── Activity Events (discriminated union) ──────────────────────────────────

export const TopicCompletedEventSchema = z.object({
  event_type: z.literal('topic_completed'),
  payload:    z.object({ topic_id: z.string().uuid(), subject_name: z.string() }),
})
export const HoursLoggedEventSchema = z.object({
  event_type: z.literal('hours_logged'),
  payload:    z.object({ subject_id: z.string().uuid(), hours: z.number() }),
})
export const StreakMilestoneEventSchema = z.object({
  event_type: z.literal('streak_milestone'),
  payload:    z.object({ streak_count: z.number().int() }),
})
export const FriendJoinedEventSchema = z.object({
  event_type: z.literal('friend_joined'),
  payload:    z.object({ friend_user_id: z.string().uuid() }),
})

export const ActivityEventPayloadSchema = z.discriminatedUnion('event_type', [
  TopicCompletedEventSchema,
  HoursLoggedEventSchema,
  StreakMilestoneEventSchema,
  FriendJoinedEventSchema,
])

export const ActivityEventSchema = z.object({
  id:         z.string().uuid(),
  user_id:    z.string().uuid(),
  created_at: z.string(),
}).and(ActivityEventPayloadSchema)

// ─── Inferred types ─────────────────────────────────────────────────────────

export type Subject           = z.infer<typeof SubjectSchema>
export type Topic             = z.infer<typeof TopicSchema>
export type DailyPlan         = z.infer<typeof DailyPlanSchema>
export type DailyPlanVersion  = z.infer<typeof DailyPlanVersionSchema>
export type StudyLog          = z.infer<typeof StudyLogSchema>
export type Score             = z.infer<typeof ScoreSchema>
export type Friendship        = z.infer<typeof FriendshipSchema>
export type UserProfile       = z.infer<typeof UserProfileSchema>
export type ActivityEvent     = z.infer<typeof ActivityEventSchema>
export type ActivityEventPayload = z.infer<typeof ActivityEventPayloadSchema>

export interface LeaderboardEntry {
  user: UserProfile
  score: Score
}

// ─── Planning Engine types ───────────────────────────────────────────────────

export interface PlanningInput {
  subjects:   Subject[]
  topics:     Topic[]
  intensity:  PlanIntensity
  startDate:  string   // 'YYYY-MM-DD'
}

export interface ScoredTopic {
  topic:          Topic
  subject:        Subject
  priority_score: number
  exam_urgency:   number
  days_remaining: number | null
}

export interface GeneratedPlanItem {
  topic_id:      string
  user_id:       string
  assigned_date: string
  is_completed:  boolean
  carried_over:  boolean
  version:       number
}

// ─── Form input schemas ──────────────────────────────────────────────────────

export const CreateSubjectSchema = z.object({
  name:      z.string().min(1, 'Subject name is required').max(100),
  exam_date: z.string().nullable().optional(),
  strength:  SubjectStrengthSchema.default('average'),
})

export const CreateTopicSchema = z.object({
  subject_id: z.string().uuid(),
  title:      z.string().min(1, 'Topic title is required').max(200),
})

export const LogStudyTimeSchema = z.object({
  subject_id:    z.string().uuid('Select a subject'),
  hours_studied: z.number().min(0.5, 'Minimum 0.5 hours').max(16, 'Maximum 16 hours per day'),
  log_date:      z.string(),
})

export const LoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export const OTPSchema = z.object({
  otp: z.string().length(6, 'OTP is 6 digits'),
})

export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>
export type CreateTopicInput   = z.infer<typeof CreateTopicSchema>
export type LogStudyTimeInput  = z.infer<typeof LogStudyTimeSchema>
export type LoginInput         = z.infer<typeof LoginSchema>
export type OTPInput           = z.infer<typeof OTPSchema>
