import { format, subDays, addDays } from 'date-fns'
import type { Subject, Topic, Score, LeaderboardEntry } from '@/types'

const today = format(new Date(), 'yyyy-MM-dd')
const mockId = '123e4567-e89b-12d3-a456-426614174000'

// ─── Subjects ───────────────────────────────────────────────────────────────
export const DEMO_SUBJECTS: Subject[] = [
  { id: 'sub_1', user_id: mockId, name: 'Differential Equations', strength: 'average', exam_date: format(addDays(new Date(), 14), 'yyyy-MM-dd'), created_at: today },
  { id: 'sub_2', user_id: mockId, name: 'Quantum Mechanics', strength: 'weak', exam_date: format(addDays(new Date(), 21), 'yyyy-MM-dd'), created_at: today },
  { id: 'sub_3', user_id: mockId, name: 'Data Structures', strength: 'strong', exam_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'), created_at: today }
]

// ─── Topics ─────────────────────────────────────────────────────────────────
export const DEMO_TOPICS: Topic[] = [
  { id: 'top_1', user_id: mockId, subject_id: 'sub_1', title: 'First-order linear ODEs', status: 'completed', priority_score: 95, created_at: today, completed_at: null, deleted_at: null },
  { id: 'top_2', user_id: mockId, subject_id: 'sub_1', title: 'Laplace Transforms', status: 'pending', priority_score: 80, created_at: today, completed_at: null, deleted_at: null },
  { id: 'top_3', user_id: mockId, subject_id: 'sub_2', title: 'Schrödinger Equation', status: 'pending', priority_score: 100, created_at: today, completed_at: null, deleted_at: null },
  { id: 'top_4', user_id: mockId, subject_id: 'sub_2', title: 'Perturbation Theory', status: 'overdue', priority_score: 110, created_at: today, completed_at: null, deleted_at: null },
  { id: 'top_5', user_id: mockId, subject_id: 'sub_3', title: 'Red-Black Trees', status: 'pending', priority_score: 60, created_at: today, completed_at: null, deleted_at: null },
]

// ─── Daily Plan ─────────────────────────────────────────────────────────────
export const DEMO_DAILY_PLANS: any[] = [
  { id: 'dp_1', user_id: mockId, topic_id: 'top_1', assigned_date: today, is_completed: true, carried_over: false, topics: Object.assign({}, DEMO_TOPICS[0], { subjects: DEMO_SUBJECTS[0] }) },
  { id: 'dp_2', user_id: mockId, topic_id: 'top_2', assigned_date: today, is_completed: false, carried_over: false, topics: Object.assign({}, DEMO_TOPICS[1], { subjects: DEMO_SUBJECTS[0] }) },
  { id: 'dp_3', user_id: mockId, topic_id: 'top_3', assigned_date: today, is_completed: false, carried_over: false, topics: Object.assign({}, DEMO_TOPICS[2], { subjects: DEMO_SUBJECTS[1] }) },
  { id: 'dp_4', user_id: mockId, topic_id: 'top_4', assigned_date: today, is_completed: false, carried_over: true, topics: Object.assign({}, DEMO_TOPICS[3], { subjects: DEMO_SUBJECTS[1] }) },
  { id: 'dp_5', user_id: mockId, topic_id: 'top_5', assigned_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), is_completed: false, carried_over: false, topics: Object.assign({}, DEMO_TOPICS[4], { subjects: DEMO_SUBJECTS[2] }) },
]

// ─── Scores ─────────────────────────────────────────────────────────────────
export const DEMO_SCORE_HISTORY: Score[] = Array.from({ length: 30 }).map((_, i) => {
  const d = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
  return {
    id: `score_${i}`, user_id: mockId, score_date: d,
    daily_points: Math.floor(Math.random() * 80) + 20,
    cumulative_points: i * 50,
    streak_count: i < 5 ? i : 5,
    raw_topic_points: 0, raw_time_points: 0, penalty_applied: false, updated_at: d
  }
})

// ─── Leaderboard ────────────────────────────────────────────────────────────
export const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { user: { id: mockId, username: 'demo_student', display_name: 'Local Demo', avatar_url: null, created_at: today }, score: { daily_points: 450, cumulative_points: 1200, score_date: today, user_id: mockId, id: 'x', streak_count: 5, raw_time_points: 0, raw_topic_points: 0, penalty_applied: false, updated_at: today } },
  { user: { id: 'usr_b', username: 'study_wizard', display_name: 'Alex Wizard', avatar_url: null, created_at: today }, score: { daily_points: 320, cumulative_points: 800, score_date: today, user_id: 'usr_b', id: 'y', streak_count: 2, raw_time_points: 0, raw_topic_points: 0, penalty_applied: false, updated_at: today } },
  { user: { id: 'usr_c', username: 'lazy_sloth', display_name: 'Sloth Master', avatar_url: null, created_at: today }, score: { daily_points: 85, cumulative_points: 85, score_date: today, user_id: 'usr_c', id: 'z', streak_count: 0, raw_time_points: 0, raw_topic_points: 0, penalty_applied: false, updated_at: today } },
]

// ─── Activity Feed ──────────────────────────────────────────────────────────
export const DEMO_ACTIVITY: any[] = [
  { id: 'act_1', event_type: 'topic_completed', payload: { subject_name: 'Differential Equations' }, created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), user_id: 'usr_b' },
  { id: 'act_2', event_type: 'streak_milestone', payload: { streak_count: 5 }, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), user_id: mockId },
  { id: 'act_3', event_type: 'hours_logged', payload: { hours: 2.5 }, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), user_id: 'usr_c' },
  { id: 'act_4', event_type: 'friend_joined', payload: { friend_user_id: 'x' }, created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), user_id: 'usr_b' },
]

export const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'
