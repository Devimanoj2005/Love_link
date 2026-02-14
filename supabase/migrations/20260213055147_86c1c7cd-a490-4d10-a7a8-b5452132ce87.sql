
-- Add visibility column to gallery_photos
ALTER TABLE public.gallery_photos ADD COLUMN visibility text NOT NULL DEFAULT 'both';

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id text NOT NULL,
  recipient_nickname text NOT NULL,
  sender_nickname text NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "insert_notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "update_notifications" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "delete_notifications" ON public.notifications FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
