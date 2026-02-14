
-- Couples table
CREATE TABLE public.couples (
  id TEXT PRIMARY KEY DEFAULT upper(substr(md5(random()::text), 1, 6)),
  partner1_username TEXT NOT NULL,
  partner1_nickname TEXT NOT NULL,
  partner1_phone TEXT NOT NULL,
  partner1_role TEXT NOT NULL DEFAULT 'boy',
  partner2_username TEXT,
  partner2_nickname TEXT,
  partner2_phone TEXT,
  partner2_role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- Anyone can read couples (for join flow - they need couple ID)
CREATE POLICY "Anyone can read couples by ID" ON public.couples FOR SELECT USING (true);

-- Anyone can create a couple
CREATE POLICY "Anyone can create couples" ON public.couples FOR INSERT WITH CHECK (true);

-- Anyone can update couples (for partner2 joining)
CREATE POLICY "Anyone can update couples" ON public.couples FOR UPDATE USING (true);

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id TEXT NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_nickname TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Couple members can send messages" ON public.messages FOR INSERT WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
