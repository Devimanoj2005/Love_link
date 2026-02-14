import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, User, Phone, Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setSession } from "@/lib/couple-store";
import { toast } from "sonner";

const Join = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [coupleId, setCoupleId] = useState("");
  const [role, setRole] = useState<"boy" | "girl">("girl");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !nickname.trim() || !phone.trim() || !coupleId.trim()) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      const { data: couple, error: fetchErr } = await supabase
        .from("couples").select("*").eq("id", coupleId.trim().toUpperCase()).single();
      if (fetchErr || !couple) { toast.error("Couple ID not found"); return; }
      if (couple.partner2_username) { toast.error("This couple already has 2 partners!"); return; }

      const { error: updateErr } = await supabase.from("couples").update({
        partner2_username: username.trim(), partner2_nickname: nickname.trim(),
        partner2_phone: phone.trim(), partner2_role: role,
      }).eq("id", coupleId.trim().toUpperCase());
      if (updateErr) throw updateErr;

      setSession({
        coupleId: coupleId.trim().toUpperCase(), username: username.trim(),
        nickname: nickname.trim(), role: "partner2", partnerNickname: couple.partner1_nickname,
      });
      toast.success("You're connected! 💕");
      navigate("/heartbeat");
    } catch (err: any) { toast.error(err.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full bg-card/60 backdrop-blur-sm rounded-xl px-4 py-3 pl-10 text-sm border border-border/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground";

  return (
    <div className="min-h-screen flex items-center justify-center p-5 soft-gradient">
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-card rounded-3xl p-8 max-w-md w-full space-y-7">

        <div className="text-center space-y-3">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <Heart className="w-12 h-12 mx-auto text-primary" fill="hsl(340, 72%, 58%)" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold romantic-gradient-text tracking-wide">Join Your Partner</h1>
          <p className="text-muted-foreground text-sm">Enter the Couple ID shared with you 💕</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Link className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
            <input placeholder="Couple ID" value={coupleId} onChange={(e) => setCoupleId(e.target.value)}
              className={`${inputClass} uppercase tracking-widest font-bold`} />
          </div>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} />
          </div>
          <div className="relative">
            <Heart className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
            <input placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputClass} />
          </div>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
            <input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
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
            {loading ? <Heart className="w-5 h-5 animate-heartbeat mx-auto" /> : "Join Partner 💕"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have a Couple ID?{" "}
          <button onClick={() => navigate("/")} className="text-primary font-bold hover:underline">Create Couple</button>
        </p>
      </motion.div>
    </div>
  );
};

export default Join;
