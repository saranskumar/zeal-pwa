-- Zeal PWA Database Schema
-- Run this in your Supabase SQL Editor

-- ─── Types and Enums ────────────────────────────────────────────────────────

CREATE TYPE public.subject_strength AS ENUM ('weak', 'average', 'strong');
CREATE TYPE public.plan_intensity AS ENUM ('chill', 'balanced', 'aggressive');
CREATE TYPE public.topic_status AS ENUM ('pending', 'completed', 'overdue');
CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');

-- ─── Tables ─────────────────────────────────────────────────────────────────

-- 1. users
CREATE TABLE public.users (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

-- 2. subjects
CREATE TABLE public.subjects (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  exam_date text,
  strength public.subject_strength DEFAULT 'average'::public.subject_strength NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

-- 3. topics
CREATE TABLE public.topics (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  status public.topic_status DEFAULT 'pending'::public.topic_status NOT NULL,
  priority_score double precision DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  completed_at timestamp with time zone,
  deleted_at timestamp with time zone,
  PRIMARY KEY (id)
);

-- 4. daily_plans
CREATE TABLE public.daily_plans (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  assigned_date text NOT NULL,
  is_completed boolean DEFAULT false NOT NULL,
  carried_over boolean DEFAULT false NOT NULL,
  version integer DEFAULT 1 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, topic_id, assigned_date)
);

-- 5. daily_plan_versions
CREATE TABLE public.daily_plan_versions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date text NOT NULL,
  version_number integer NOT NULL,
  snapshot jsonb NOT NULL,
  change_reason text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, plan_date, version_number)
);

-- 6. study_logs
CREATE TABLE public.study_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  log_date text NOT NULL,
  hours_studied double precision NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, subject_id, log_date)
);

-- 7. scores
CREATE TABLE public.scores (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_date text NOT NULL,
  daily_points integer NOT NULL,
  cumulative_points integer NOT NULL,
  streak_count integer NOT NULL,
  raw_topic_points integer NOT NULL,
  raw_time_points integer NOT NULL,
  penalty_applied boolean DEFAULT false NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (user_id, score_date)
);

-- 8. friendships
CREATE TABLE public.friendships (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.friendship_status DEFAULT 'pending'::public.friendship_status NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (requester_id, addressee_id)
);

-- 9. activity_events
CREATE TABLE public.activity_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

-- ─── Triggers ───────────────────────────────────────────────────────────────

-- Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name)
  VALUES (
    new.id,
    'user_' || substr(new.id::text, 1, 8),
    split_part(new.email, '@', 1)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scores_updated_at
  BEFORE UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Row Level Security (RLS) ───────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- subjects
CREATE POLICY "Users can view own subjects." ON public.subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subjects." ON public.subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subjects." ON public.subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subjects." ON public.subjects FOR DELETE USING (auth.uid() = user_id);

-- topics
CREATE POLICY "Users can view own topics." ON public.topics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own topics." ON public.topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topics." ON public.topics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own topics." ON public.topics FOR DELETE USING (auth.uid() = user_id);

-- daily_plans
CREATE POLICY "Users can view own plans." ON public.daily_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans." ON public.daily_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans." ON public.daily_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans." ON public.daily_plans FOR DELETE USING (auth.uid() = user_id);

-- daily_plan_versions
CREATE POLICY "Users can view own plan versions." ON public.daily_plan_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plan versions." ON public.daily_plan_versions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- study_logs
CREATE POLICY "Users can view own study logs." ON public.study_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study logs." ON public.study_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study logs." ON public.study_logs FOR UPDATE USING (auth.uid() = user_id);

-- scores (Friends can view your score)
CREATE POLICY "Scores viewable by owner and friends." ON public.scores FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
      AND ((requester_id = auth.uid() AND addressee_id = public.scores.user_id) OR
           (addressee_id = auth.uid() AND requester_id = public.scores.user_id))
  )
);
CREATE POLICY "Users can insert own scores." ON public.scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scores." ON public.scores FOR UPDATE USING (auth.uid() = user_id);

-- friendships
CREATE POLICY "Friendships viewable by requester or addressee." ON public.friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Log in users can send requests." ON public.friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Addressee can accept or decline." ON public.friendships FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

-- activity_events
CREATE POLICY "Activity viewable by owner and friends." ON public.activity_events FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
      AND ((requester_id = auth.uid() AND addressee_id = public.activity_events.user_id) OR
           (addressee_id = auth.uid() AND requester_id = public.activity_events.user_id))
  )
);
CREATE POLICY "Users can insert own activity." ON public.activity_events FOR INSERT WITH CHECK (auth.uid() = user_id);
