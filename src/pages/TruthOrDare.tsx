import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Sparkles, Send } from "lucide-react";
import { getSession } from "@/lib/couple-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEFAULT_TRUTHS = [
  "What's your favorite memory of us?",
  "What did you first notice about me?",
  "What's something you've never told me?",
  "What's your biggest fear about our relationship?",
  "What's the most romantic thing you've ever imagined us doing?",
  "When did you realize you loved me?",
  "What's your favorite thing I do for you?",
  "What song reminds you of us?",
];

const DEFAULT_DARES = [
  "Send me a voice note saying 'I love you' in 3 languages",
  "Change your profile picture to a photo of us for 24 hours",
  "Write me a 4-line poem right now",
  "Send me your most embarrassing selfie",
  "Call me and sing our favorite song",
  "Tell me 5 things you love about me in 30 seconds",
];

interface Round {
  id: string;
  type: "truth" | "dare";
  question: string;
  is_custom: boolean;
  asked_by: string;
  answer: string | null;
  answered_by: string | null;
  created_at: string;
}

const TruthOrDare = () => {
  const navigate = useNavigate();
  const session = getSession();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [customQ, setCustomQ] = useState("");
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) { navigate("/signin"); return; }
    supabase.from("truth_or_dare").select("*").eq("couple_id", session.coupleId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setRounds(data as Round[]); });

    const channel = supabase
      .channel(`tod-${session.coupleId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "truth_or_dare",
        filter: `couple_id=eq.${session.coupleId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setRounds(prev => [payload.new as Round, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setRounds(prev => prev.map(r => r.id === (payload.new as Round).id ? payload.new as Round : r));
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const playRound = async (type: "truth" | "dare") => {
    if (!session) return;
    setLoading(true);
    const pool = type === "truth" ? DEFAULT_TRUTHS : DEFAULT_DARES;
    const question = pool[Math.floor(Math.random() * pool.length)];
    await supabase.from("truth_or_dare").insert({
      couple_id: session.coupleId, type, question, asked_by: session.nickname,
    });
    setLoading(false);
  };

  const askCustom = async (type: "truth" | "dare") => {
    if (!session || !customQ.trim()) return;
    await supabase.from("truth_or_dare").insert({
      couple_id: session.coupleId, type, question: customQ.trim(),
      is_custom: true, asked_by: session.nickname,
    });
    setCustomQ("");
    toast.success("Custom question sent! 💕");
  };

  const submitAnswer = async (roundId: string) => {
    if (!session || !answerText[roundId]?.trim()) return;
    await supabase.from("truth_or_dare")
      .update({ answer: answerText[roundId].trim(), answered_by: session.nickname })
      .eq("id", roundId);
    setAnswerText(prev => ({ ...prev, [roundId]: "" }));
    toast.success("Answer sent! 💕");
  };

  if (!session) return null;

  const inputClass = "w-full bg-card/60 backdrop-blur-sm rounded-xl px-4 py-3 text-sm border border-border/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground";

  return (
    <div className="min-h-screen soft-gradient">
      <header className="glass-card border-b border-border/30 p-4 flex items-center gap-3">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Sparkles className="w-5 h-5 text-primary" />
        <h1 className="font-display font-bold text-foreground tracking-wide">Truth or Dare 🎮</h1>
      </header>

      <div className="p-5 max-w-lg mx-auto space-y-5">
        {/* Play buttons */}
        <div className="flex gap-3">
          <motion.button onClick={() => playRound("truth")} disabled={loading}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex-1 h-14 text-lg romantic-btn font-display font-bold disabled:opacity-60">
            🤔 Truth
          </motion.button>
          <motion.button onClick={() => playRound("dare")} disabled={loading}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex-1 h-14 text-lg bg-accent text-accent-foreground border-0 rounded-2xl font-display font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60">
            🔥 Dare
          </motion.button>
        </div>

        {/* Custom question */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <p className="text-sm font-display font-bold text-foreground">Ask a custom question 💬</p>
          <input placeholder="Type your question..." value={customQ} onChange={e => setCustomQ(e.target.value)} className={inputClass} />
          <div className="flex gap-2">
            <button onClick={() => askCustom("truth")} disabled={!customQ.trim()}
              className="romantic-btn px-4 py-2 text-sm font-display font-bold disabled:opacity-40">As Truth</button>
            <button onClick={() => askCustom("dare")} disabled={!customQ.trim()}
              className="px-4 py-2 text-sm rounded-xl border border-border/60 text-foreground font-display font-bold hover:bg-accent/30 transition-colors disabled:opacity-40">
              As Dare
            </button>
          </div>
        </div>

        {/* Rounds */}
        <div className="space-y-3">
          {rounds.map((r, i) => (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i < 10 ? i * 0.05 : 0 }}
              className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${r.type === "truth" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}>
                  {r.type === "truth" ? "🤔 Truth" : "🔥 Dare"}
                </span>
                {r.is_custom && <span className="text-xs text-muted-foreground">Custom</span>}
                <span className="text-xs text-muted-foreground ml-auto">by {r.asked_by}</span>
              </div>
              <p className="font-display font-bold text-foreground">{r.question}</p>

              {r.answer ? (
                <div className="bg-secondary/60 backdrop-blur-sm rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Answer by {r.answered_by}</p>
                  <p className="text-sm text-foreground">{r.answer}</p>
                </div>
              ) : r.asked_by !== session.nickname ? (
                <div className="flex gap-2">
                  <input placeholder="Type your answer..."
                    value={answerText[r.id] || ""}
                    onChange={e => setAnswerText(prev => ({ ...prev, [r.id]: e.target.value }))}
                    className={`${inputClass} flex-1`} />
                  <button onClick={() => submitAnswer(r.id)}
                    className="w-11 h-11 rounded-xl romantic-gradient flex items-center justify-center text-primary-foreground shrink-0 shadow-md">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Waiting for partner's answer... 💭</p>
              )}
            </motion.div>
          ))}

          {rounds.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="w-14 h-14 mx-auto mb-4 text-primary/20" />
              <p className="font-display font-bold">Tap Truth or Dare to start playing! 🎮</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TruthOrDare;
