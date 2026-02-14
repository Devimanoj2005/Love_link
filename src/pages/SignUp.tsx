import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, User, Phone, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setSession } from "@/lib/couple-store";
import { toast } from "sonner";

const SignUp = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"boy" | "girl">("boy");
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !nickname.trim() || !phone.trim()) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from("couples").insert({
        partner1_username: username.trim(), partner1_nickname: nickname.trim(),
        partner1_phone: phone.trim(), partner1_role: role,
      }).select("id").single();
      if (error) throw error;
      setCoupleId(data.id);
      setSession({ coupleId: data.id, username: username.trim(), nickname: nickname.trim(), role: "partner1" });
      toast.success("Couple created!");
    } catch (err: any) { toast.error(err.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  const copyId = () => {
    if (coupleId) { navigator.clipboard.writeText(coupleId); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  if (coupleId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5 soft-gradient">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass-card rounded-3xl p-8 max-w-md w-full text-center space-y-6">
          <Heart className="w-16 h-16 mx-auto text-primary animate-heartbeat" fill="hsl(340, 72%, 58%)" />
          <h2 className="text-2xl font-display font-bold text-foreground tracking-wide">You're all set! 🎉</h2>
          <p className="text-muted-foreground text-sm">Share this Couple ID with your partner so they can join you</p>
          <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-secondary/60 backdrop-blur-sm">
            <span className="text-3xl font-bold font-display tracking-widest text-primary">{coupleId}</span>
            <button onClick={copyId} className="text-muted-foreground hover:text-primary transition-colors">
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <button onClick={() => navigate("/signin")}
            className="w-full romantic-btn h-12 text-base font-display font-bold tracking-wide">Go to Sign In 💕</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 soft-gradient">
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-card rounded-3xl p-8 max-w-md w-full space-y-7">

        <div className="text-center space-y-3">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <Heart className="w-12 h-12 mx-auto text-primary" fill="hsl(340, 72%, 58%)" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold romantic-gradient-text tracking-wide">TogetherMiles</h1>
          <p className="text-muted-foreground text-sm">Create your couple space 💕</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-card/60 backdrop-blur-sm rounded-xl px-4 py-3 pl-10 text-sm border border-border/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground" />
          </div>
          <div className="relative">
            <Heart className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
            <input placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-card/60 backdrop-blur-sm rounded-xl px-4 py-3 pl-10 text-sm border border-border/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground" />
          </div>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
            <input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-card/60 backdrop-blur-sm rounded-xl px-4 py-3 pl-10 text-sm border border-border/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-display font-bold text-foreground">I am a...</p>
            <div className="flex gap-3">
              {(["boy", "girl"] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all text-center ${
                    role === r ? "border-primary bg-primary/10 shadow-md" : "border-border/50 hover:border-primary/30"
                  }`}>
                  <span className="text-3xl">{r === "boy" ? "👦" : "👧"}</span>
                  <p className="text-sm mt-1 font-display font-bold text-foreground capitalize">{r}</p>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full romantic-btn h-12 text-base font-display font-bold tracking-wide disabled:opacity-60">
            {loading ? <Heart className="w-5 h-5 animate-heartbeat mx-auto" /> : "Create Couple ❤️"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have a Couple ID?{" "}
          <button onClick={() => navigate("/join")} className="text-primary font-bold hover:underline">Join Partner</button>
          {" · "}
          <button onClick={() => navigate("/signin")} className="text-primary font-bold hover:underline">Sign In</button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUp;
