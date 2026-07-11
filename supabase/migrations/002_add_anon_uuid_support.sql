-- 1. Add anon_uuid column to notifications, reminders and ambient_preferences
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS anon_uuid TEXT;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS anon_uuid TEXT;
ALTER TABLE public.ambient_preferences ADD COLUMN IF NOT EXISTS anon_uuid TEXT;

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_anon_uuid ON public.notifications(anon_uuid);
CREATE INDEX IF NOT EXISTS idx_reminders_anon_uuid ON public.reminders(anon_uuid);
CREATE INDEX IF NOT EXISTS idx_ambient_preferences_anon_uuid ON public.ambient_preferences(anon_uuid);

-- 3. Re-create RLS Policies to allow anon_uuid checks
DROP POLICY IF EXISTS "Users can manage their notifications" ON public.notifications;
CREATE POLICY "Users can manage their notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

DROP POLICY IF EXISTS "Users can manage their reminders" ON public.reminders;
CREATE POLICY "Users can manage their reminders" ON public.reminders
  FOR ALL USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));

DROP POLICY IF EXISTS "Users can manage their ambient preferences" ON public.ambient_preferences;
CREATE POLICY "Users can manage their ambient preferences" ON public.ambient_preferences
  FOR ALL USING (auth.uid() = user_id OR anon_uuid = COALESCE(current_setting('request.headers', true)::json->>'x-anon-uuid', ''));
