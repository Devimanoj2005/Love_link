import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Plus, Eye, EyeOff, Trash2 } from "lucide-react";
import { getSession } from "@/lib/couple-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  visibility: "both" | "only_me";
  written_by: string;
  created_at: string;
}

const Diary = () => {
  const navigate = useNavigate();
  const session = getSession();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"both" | "only_me">("both");

  useEffect(() => {
    if (!session) { navigate("/signin"); return; }
    supabase.from("diary_entries").select("*").eq("couple_id", session.coupleId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          const filtered = (data as DiaryEntry[]).filter(e =>
            e.visibility === "both" || e.written_by === session.nickname
          );
          setEntries(filtered);
        }
      });
  }, []);

  const addEntry = async () => {
    if (!session || !title.trim() || !content.trim()) return;
    const { data } = await supabase.from("diary_entries").insert({
      couple_id: session.coupleId, title: title.trim(), content: content.trim(),
      visibility, written_by: session.nickname,
    }).select().single();
    if (data) setEntries(prev => [data as DiaryEntry, ...prev]);
    setTitle(""); setContent(""); setShowForm(false);
    toast.success("Memory saved! 📖");
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("diary_entries").delete().eq("id", id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  if (!session) return null;

  const inputClass = "w-full bg-card/60 backdrop-blur-sm rounded-xl px-4 py-3 text-sm border border-border/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground";

  return (
    <div className="min-h-screen soft-gradient">
      <header className="glass-card border-b border-border/30 p-4 flex items-center gap-3">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <BookOpen className="w-5 h-5 text-primary" />
        <h1 className="font-display font-bold text-foreground tracking-wide">Love Diary 📖</h1>
        <button onClick={() => setShowForm(!showForm)} className="ml-auto text-primary">
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="p-5 max-w-lg mx-auto space-y-5">
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-5 space-y-3">
            <input placeholder="Memory title" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
            <textarea placeholder="Write your memory..." value={content} onChange={e => setContent(e.target.value)} rows={4}
              className={`${inputClass} resize-none`} />
            <div className="flex gap-2">
              {([
                { v: "both" as const, icon: Eye, label: "Both" },
                { v: "only_me" as const, icon: EyeOff, label: "Only me" },
              ]).map(({ v, icon: Icon, label }) => (
                <button key={v} onClick={() => setVisibility(v)}
                  className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all text-sm ${visibility === v ? "border-primary bg-primary/10 shadow-md" : "border-border/50 hover:border-primary/30"}`}>
                  <Icon className="w-4 h-4" /> <span className="font-display font-bold text-foreground">{label}</span>
                </button>
              ))}
            </div>
            <button onClick={addEntry} disabled={!title.trim() || !content.trim()}
              className="w-full romantic-btn h-12 font-display font-bold disabled:opacity-60">Save Memory 💕</button>
          </motion.div>
        )}

        {entries.map((e, i) => (
          <motion.div key={e.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i < 10 ? i * 0.05 : 0 }}
            className="glass-card rounded-2xl p-5 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-bold text-foreground">{e.title}</h3>
                <p className="text-xs text-muted-foreground">{e.written_by} · {new Date(e.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                {e.visibility === "only_me" && <EyeOff className="w-4 h-4 text-muted-foreground" />}
                {e.written_by === session.nickname && (
                  <button onClick={() => deleteEntry(e.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{e.content}</p>
          </motion.div>
        ))}

        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-14 h-14 mx-auto mb-4 text-primary/20" />
            <p className="font-display font-bold">Start writing your love story 📖</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Diary;
