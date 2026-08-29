import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, User, Sparkles, Check, ArrowRight, Mail, Lock, Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { setSession } from "@/lib/couple-store";
import { playChime } from "@/lib/utils";
import { toast } from "sonner";

const SignIn = () => {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<"email" | "coupleId">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [coupleId, setCoupleId] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    playChime();

    try {
      if (loginMethod === "email") {
        if (!email.trim() || !password.trim()) {
          toast.error("Please enter your email and password 🥺");
          setLoading(false);
          return;
        }

        // 1. Sign in with Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // 2. Fetch the couple record using specific queries for partner1 and partner2 UIDs
        const { data: couples1, error: error1 } = await supabase
          .from("couples")
          .select("*")
          .eq("partner1_uid", user.uid);

        const { data: couples2, error: error2 } = await supabase
          .from("couples")
          .select("*")
          .eq("partner2_uid", user.uid);

        if (error1 && error2) {
          throw new Error("Could not load your couple space. Please check your connection.");
        }

        const list1 = Array.isArray(couples1) ? couples1 : (couples1 ? [couples1] : []);
        const list2 = Array.isArray(couples2) ? couples2 : (couples2 ? [couples2] : []);
        const couple = list1[0] || list2[0];

        if (!couple) {
          toast.error("We couldn't find a Couple Space linked to this account 🥺");
          setLoading(false);
          return;
        }

        let role: "partner1" | "partner2";
        let nickname: string;
        let partnerNickname: string | undefined;
        let savedUsername: string;

        if (couple.partner1_uid === user.uid) {
          role = "partner1";
          savedUsername = couple.partner1_username;
          nickname = couple.partner1_nickname;
          partnerNickname = couple.partner2_nickname ?? undefined;
        } else {
          role = "partner2";
          savedUsername = couple.partner2_username;
          nickname = couple.partner2_nickname;
          partnerNickname = couple.partner1_nickname ?? undefined;
        }

        setSession({ 
          coupleId: couple.id, 
          username: savedUsername, 
          nickname, 
          role, 
          partnerNickname 
        });

        toast.success(`Welcome back, ${nickname}! 💕`);
        navigate("/heartbeat");
      } else {
        // Legacy Couple ID + Username/Nickname login method
        if (!coupleId.trim() || !username.trim()) {
          toast.error("Please enter your Couple ID and Username/Nickname 🥺");
          setLoading(false);
          return;
        }

        const { data: couple, error } = await supabase
          .from("couples")
          .select("*")
          .eq("id", coupleId.trim().toUpperCase())
          .single();

        if (error || !couple) {
          toast.error("We couldn't find this Couple ID. Please check and try again! 🔍");
          setLoading(false);
          return;
        }

        const uTrimmed = username.trim().toLowerCase();
        let role: "partner1" | "partner2";
        let nickname: string;
        let partnerNickname: string | undefined;

        const p1User = (couple.partner1_username || "").trim().toLowerCase();
        const p1Nick = (couple.partner1_nickname || "").trim().toLowerCase();
        const p2User = (couple.partner2_username || "").trim().toLowerCase();
        const p2Nick = (couple.partner2_nickname || "").trim().toLowerCase();

        if (p1User === uTrimmed || p1Nick === uTrimmed) {
          role = "partner1";
          nickname = couple.partner1_nickname;
          partnerNickname = couple.partner2_nickname ?? undefined;
        } else if (p2User === uTrimmed || p2Nick === uTrimmed) {
          role = "partner2";
          nickname = couple.partner2_nickname!;
          partnerNickname = couple.partner1_nickname;
        } else {
          toast.error("This username or nickname does not belong to this Couple ID 🥺");
          setLoading(false);
          return;
        }

        setSession({ 
          coupleId: couple.id, 
          username: uTrimmed, 
          nickname, 
          role, 
          partnerNickname 
        });

        toast.success(`Welcome back, ${nickname}! 💕`);
        navigate("/heartbeat");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong 🥺");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden bg-gradient-to-br from-pink-50 via-rose-100 to-indigo-50">
      {/* Visual background decorative elements */}
      <div className="absolute top-10 left-10 w-44 h-44 rounded-full bg-pink-200/40 blur-3xl" />
      <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-purple-200/40 blur-3xl" />

      {/* Main Glassmorphic Container */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl relative z-10 space-y-7"
      >
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-rose-100/60 pb-3 justify-around text-sm font-semibold text-muted-foreground">
          <button onClick={() => { playChime(); navigate("/signin"); }} className="text-primary border-b-2 border-primary pb-3 px-2 font-display">
            Sign In
          </button>
          <button onClick={() => { playChime(); navigate("/"); }} className="hover:text-primary transition-colors pb-3 px-2 font-display">
            Create Space
          </button>
          <button onClick={() => { playChime(); navigate("/join")} } className="hover:text-primary transition-colors pb-3 px-2 font-display">
            Join Partner
          </button>
        </div>

        {/* Content Title */}
        <div className="text-center space-y-2">
          <motion.div 
            animate={{ scale: [1, 1.12, 1] }} 
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block"
          >
            <Heart className="w-13 h-13 mx-auto text-primary" fill="hsl(340, 72%, 58%)" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-slate-800 tracking-wide">Enter Love Link</h1>
          <p className="text-muted-foreground text-xs font-medium">Re-connect with your special person 💖</p>
        </div>

        {/* Method Toggle */}
        <div className="bg-rose-50/60 p-1.5 rounded-2xl flex gap-1 border border-rose-100/40">
          <button
            type="button"
            onClick={() => { playChime(); setLoginMethod("email"); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              loginMethod === "email" 
                ? "bg-white text-primary shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => { playChime(); setLoginMethod("coupleId"); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              loginMethod === "coupleId" 
                ? "bg-white text-primary shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Couple ID Login
          </button>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {loginMethod === "email" ? (
              <motion.div
                key="email-fields"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-400" />
                    <input 
                      type="email"
                      placeholder="E.G. love@togethermiles.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/60 focus:bg-white/90 rounded-2xl px-4 py-3 pl-10 text-sm border border-rose-100 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-400" />
                    <input 
                      type="password"
                      placeholder="Enter password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/60 focus:bg-white/90 rounded-2xl px-4 py-3 pl-10 text-sm border border-rose-100 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground" 
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="id-fields"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Couple ID</label>
                  <div className="relative">
                    <Link className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-400" />
                    <input 
                      placeholder="E.G. A1B2C3D4" 
                      value={coupleId} 
                      onChange={(e) => setCoupleId(e.target.value)}
                      className="w-full bg-white/60 focus:bg-white/90 rounded-2xl px-4 py-3 pl-10 text-sm border border-rose-100 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground uppercase tracking-widest font-bold" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Username or Nickname</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-400" />
                    <input 
                      placeholder="Enter username or nickname" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/60 focus:bg-white/90 rounded-2xl px-4 py-3 pl-10 text-sm border border-rose-100 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground" 
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Trigger button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-98 text-white font-display font-bold tracking-wide transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 disabled:opacity-60 mt-3"
          >
            {loading ? (
              <Heart className="w-5 h-5 animate-heartbeat" fill="#ffffff" />
            ) : (
              <>
                Let's Go <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-muted-foreground font-medium">
          Need help? Connect with your partner to share credentials 💕
        </div>
      </motion.div>
    </div>
  );
};

export default SignIn;
