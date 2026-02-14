import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, User, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { setSession } from "@/lib/couple-store";
import { toast } from "sonner";

const SignIn = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [coupleId, setCoupleId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !coupleId.trim()) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      const { data: couple, error } = await supabase
        .from("couples").select("*").eq("id", coupleId.trim().toUpperCase()).single();
      if (error || !couple) { toast.error("Couple not found"); return; }

      const uTrimmed = username.trim();
      let role: "partner1" | "partner2";
      let nickname: string;
      let partnerNickname: string | undefined;

      if (couple.partner1_username === uTrimmed) {
        role = "partner1"; nickname = couple.partner1_nickname;
        partnerNickname = couple.partner2_nickname ?? undefined;
      } else if (couple.partner2_username === uTrimmed) {
        role = "partner2"; nickname = couple.partner2_nickname!;
        partnerNickname = couple.partner1_nickname;
      } else { toast.error("Username not found in this couple"); return; }

      setSession({ coupleId: couple.id, username: uTrimmed, nickname, role, partnerNickname });
      navigate("/heartbeat");
    } catch (err: any) { toast.error(err.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 soft-gradient">
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-card rounded-3xl p-8 max-w-md w-full space-y-7">

        <div className="text-center space-y-3">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <Heart className="w-12 h-12 mx-auto text-primary" fill="hsl(340, 72%, 58%)" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold romantic-gradient-text tracking-wide">Welcome Back</h1>
          <p className="text-muted-foreground text-sm">Sign in to your couple space 💕</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Link className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
            <input placeholder="Couple ID" value={coupleId} onChange={(e) => setCoupleId(e.target.value)}
              className="w-full bg-card/60 backdrop-blur-sm rounded-xl px-4 py-3 pl-10 text-sm border border-border/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground uppercase tracking-widest font-bold" />
          </div>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-card/60 backdrop-blur-sm rounded-xl px-4 py-3 pl-10 text-sm border border-border/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full romantic-btn h-12 text-base font-display font-bold tracking-wide disabled:opacity-60">
            {loading ? <Heart className="w-5 h-5 animate-heartbeat mx-auto" /> : "Sign In 💓"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <button onClick={() => navigate("/")} className="text-primary font-bold hover:underline">Create Couple</button>
          {" · "}
          <button onClick={() => navigate("/join")} className="text-primary font-bold hover:underline">Join Partner</button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignIn;
