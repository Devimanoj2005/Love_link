
-- Truth or Dare game rounds
CREATE TABLE public.truth_or_dare (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id TEXT NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('truth', 'dare')),
  question TEXT NOT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  asked_by TEXT NOT NULL,
  answer TEXT,
  answered_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.truth_or_dare ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_tod" ON public.truth_or_dare FOR SELECT USING (true);
CREATE POLICY "insert_tod" ON public.truth_or_dare FOR INSERT WITH CHECK (true);
CREATE POLICY "update_tod" ON public.truth_or_dare FOR UPDATE USING (true);

-- Gallery photos
CREATE TABLE public.gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id TEXT NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  uploaded_by TEXT NOT NULL,
  file_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_gallery" ON public.gallery_photos FOR SELECT USING (true);
CREATE POLICY "insert_gallery" ON public.gallery_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_gallery" ON public.gallery_photos FOR DELETE USING (true);

-- Snap moments (stories)
CREATE TABLE public.snap_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id TEXT NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  uploaded_by TEXT NOT NULL,
  file_url TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'both' CHECK (visibility IN ('both', 'only_me')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.snap_moments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_snaps" ON public.snap_moments FOR SELECT USING (true);
CREATE POLICY "insert_snaps" ON public.snap_moments FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_snaps" ON public.snap_moments FOR DELETE USING (true);

-- Couple to-do list
CREATE TABLE public.couple_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id TEXT NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  place TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'visited', 'cancelled')),
  added_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.couple_todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_todos" ON public.couple_todos FOR SELECT USING (true);
CREATE POLICY "insert_todos" ON public.couple_todos FOR INSERT WITH CHECK (true);
CREATE POLICY "update_todos" ON public.couple_todos FOR UPDATE USING (true);
CREATE POLICY "delete_todos" ON public.couple_todos FOR DELETE USING (true);

-- Diary entries
CREATE TABLE public.diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id TEXT NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'both' CHECK (visibility IN ('both', 'only_me')),
  written_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_diary" ON public.diary_entries FOR SELECT USING (true);
CREATE POLICY "insert_diary" ON public.diary_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_diary" ON public.diary_entries FOR DELETE USING (true);

-- Premium / counseling requests
CREATE TABLE public.premium_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id TEXT NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('voice', 'video')),
  amount INTEGER NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.premium_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_premium" ON public.premium_requests FOR SELECT USING (true);
CREATE POLICY "insert_premium" ON public.premium_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "update_premium" ON public.premium_requests FOR UPDATE USING (true);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('snaps', 'snaps', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', true);

-- Storage policies
CREATE POLICY "gallery_select" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "gallery_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery');
CREATE POLICY "snaps_select" ON storage.objects FOR SELECT USING (bucket_id = 'snaps');
CREATE POLICY "snaps_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'snaps');
CREATE POLICY "screenshots_select" ON storage.objects FOR SELECT USING (bucket_id = 'payment-screenshots');
CREATE POLICY "screenshots_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-screenshots');

-- Enable realtime for truth_or_dare
ALTER PUBLICATION supabase_realtime ADD TABLE public.truth_or_dare;
