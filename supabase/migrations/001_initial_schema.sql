-- CalmNest Complete Supabase PostgreSQL Schema & RLS Policies
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. TABLES & SCHEMA DEFINITIONS
-- ==========================================

-- Public users mirror table (synchronized with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table (stores user metadata, roles, streak counts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  bio TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'USER',
  streak INT NOT NULL DEFAULT 1,
  best_streak INT NOT NULL DEFAULT 1,
  last_check_in TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Journals
CREATE TABLE IF NOT EXISTS public.journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  anon_uuid TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood_tag TEXT,
  custom_tags JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  is_draft BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Journal Tags (normalized tags table)
CREATE TABLE IF NOT EXISTS public.journal_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations (AI Therapy Chat Sessions)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  anon_uuid TEXT,
  title TEXT NOT NULL DEFAULT 'New Session',
  risk_detected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages inside Conversations
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sentiment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Moods
CREATE TABLE IF NOT EXISTS public.moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  anon_uuid TEXT,
  mood_score INT NOT NULL,
  intensity INT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habits
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  anon_uuid TEXT,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '✨',
  frequency TEXT DEFAULT 'DAILY',
  color TEXT DEFAULT '#6366f1',
  streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habit Logs (Completions)
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  anon_uuid TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_habit_date UNIQUE(habit_id, date)
);

-- Meditation Sessions
CREATE TABLE IF NOT EXISTS public.meditation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  anon_uuid TEXT,
  type TEXT NOT NULL,
  duration INT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Breathing Sessions
CREATE TABLE IF NOT EXISTS public.breathing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  anon_uuid TEXT,
  pattern TEXT NOT NULL,
  duration INT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assessments (Template catalog & custom assessments)
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  anon_uuid TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assessment Results
CREATE TABLE IF NOT EXISTS public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  anon_uuid TEXT,
  type TEXT NOT NULL,
  score INT NOT NULL,
  severity TEXT NOT NULL,
  answers JSONB NOT NULL,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wellness Plans
CREATE TABLE IF NOT EXISTS public.wellness_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  anon_uuid TEXT,
  title TEXT NOT NULL,
  goals JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  time TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  days JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY,
  anon_uuid TEXT,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_anonymous BOOLEAN DEFAULT false,
  merged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ambient Sound Preferences
CREATE TABLE IF NOT EXISTS public.ambient_preferences (
  user_id UUID PRIMARY KEY,
  favorites JSONB DEFAULT '[]'::jsonb,
  custom_mixes JSONB DEFAULT '[]'::jsonb,
  volume_ratios JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Memory (Persistent Context for AI Therapist)
CREATE TABLE IF NOT EXISTS public.ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  anon_uuid TEXT,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_ai_memory_key UNIQUE(user_id, key)
);

-- Streaks (Global User Streak Tracking)
CREATE TABLE IF NOT EXISTS public.streaks (
  user_id UUID PRIMARY KEY,
  anon_uuid TEXT,
  current_streak INT DEFAULT 1,
  best_streak INT DEFAULT 1,
  last_activity_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  anon_uuid TEXT,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON public.journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_anon_uuid ON public.journals(anon_uuid);
CREATE INDEX IF NOT EXISTS idx_journals_created_at ON public.journals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_tags_journal_id ON public.journal_tags(journal_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_moods_user_id ON public.moods(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_created_at ON public.moods(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON public.habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON public.habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON public.habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_id ON public.meditation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON public.assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_anon_uuid ON public.user_settings(anon_uuid);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ==========================================
-- 3. TRIGGERS (Auto-update updated_at & Profile creation)
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_journals_updated_at
  BEFORE UPDATE ON public.journals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'CalmNest User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breathing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambient_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Macro / Helper function for ownership
CREATE OR REPLACE FUNCTION public.is_owner(record_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = record_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Journals Policies
CREATE POLICY "Users can view their own journals" ON public.journals
  FOR SELECT USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

CREATE POLICY "Users can insert their own journals" ON public.journals
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NOT NULL);

CREATE POLICY "Users can update their own journals" ON public.journals
  FOR UPDATE USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

CREATE POLICY "Users can delete their own journals" ON public.journals
  FOR DELETE USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

-- Journal Tags Policies
CREATE POLICY "Users can manage their journal tags" ON public.journal_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.journals j WHERE j.id = journal_tags.journal_id AND (j.user_id = auth.uid() OR j.anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''))
    )
  );

-- Conversations Policies
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

CREATE POLICY "Users can insert their own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NOT NULL);

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

CREATE POLICY "Users can delete their own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

-- Messages Policies
CREATE POLICY "Users can manage their conversation messages" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.user_id = auth.uid() OR c.anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''))
    )
  );

-- Moods Policies
CREATE POLICY "Users can manage their moods" ON public.moods
  FOR ALL USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

-- Habits Policies
CREATE POLICY "Users can manage their habits" ON public.habits
  FOR ALL USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

-- Habit Logs Policies
CREATE POLICY "Users can manage their habit logs" ON public.habit_logs
  FOR ALL USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

-- Meditation Sessions Policies
CREATE POLICY "Users can manage their meditation sessions" ON public.meditation_sessions
  FOR ALL USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

-- Breathing Sessions Policies
CREATE POLICY "Users can manage their breathing sessions" ON public.breathing_sessions
  FOR ALL USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

-- Assessments & Results Policies
CREATE POLICY "Users can manage their assessments" ON public.assessments
  FOR ALL USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

CREATE POLICY "Users can manage their assessment results" ON public.assessment_results
  FOR ALL USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

-- Wellness Plans & Reminders Policies
CREATE POLICY "Users can manage their wellness plans" ON public.wellness_plans
  FOR ALL USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

CREATE POLICY "Users can manage their reminders" ON public.reminders
  FOR ALL USING (auth.uid() = user_id);

-- User Settings Policies
CREATE POLICY "Users can manage their user settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

-- Ambient Preferences Policies
CREATE POLICY "Users can manage their ambient preferences" ON public.ambient_preferences
  FOR ALL USING (auth.uid() = user_id);

-- AI Memory Policies
CREATE POLICY "Users can manage their ai memory" ON public.ai_memory
  FOR ALL USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

-- Streaks Policies
CREATE POLICY "Users can manage their streaks" ON public.streaks
  FOR ALL USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

-- Notifications Policies
CREATE POLICY "Users can manage their notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Analytics Events Policies
CREATE POLICY "Users can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);
