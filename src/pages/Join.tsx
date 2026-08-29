import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, User, Phone, Link, Sparkles, Check, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { setSession } from "@/lib/couple-store";
import { playChime } from "@/lib/utils";
import { toast } from "sonner";

const Join = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [coupleId, setCoupleId] = useState("");
  const [role, setRole] = useState<"boy" | "girl">("girl");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !nickname.trim() || !phone.trim() || !coupleId.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill all fields so we can connect you 🥺");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long! 🔒");
      return;
    }
    setLoading(true);
    playChime();
    try {
      const { data: couple, error: fetchErr } = await supabase
        .from("couples")
        .select("*")
        .eq("id", coupleId.trim().toUpperCase())
        .single();

      if (fetchErr || !couple) {
        toast.error("Couple ID not found. Verify with your partner! 🔍");
        return;
      }
      if (couple.partner2_username) {
        toast.error("This couple space already has 2 registered partners! 🥺");
        return;
      }

      // 1. Create a real User with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Link Partner 2 to the existing Couple record
      const { error: updateErr } = await supabase
        .from("couples")
        .update({
          partner2_username: username.trim(),
          partner2_nickname: nickname.trim(),
          partner2_phone: phone.trim(),
          partner2_role: role,
          partner2_uid: user.uid,
          partner2_email: email.trim(),
        })
        .eq("id", coupleId.trim().toUpperCase());

      if (updateErr) throw updateErr;

      // 3. Create companion user document in Firestore users collection
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: email.trim(),
        username: username.trim(),
        nickname: nickname.trim(),
        role: "partner2",
        coupleId: coupleId.trim().toUpperCase(),
        createdAt: new Date().toISOString()
      });

      setSession({
        coupleId: coupleId.trim().toUpperCase(),
        username: username.trim(),
        nickname: nickname.trim(),
        role: "partner2",
        partnerNickname: couple.partner1_nickname,
      });

      playChime();
      toast.success("Successfully connected to your partner! 💕🎉");
      navigate("/heartbeat");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please check your network and try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden bg-gradient-to-br from-pink-50 via-rose-100 to-indigo-50">
      <div className="absolute top-10 left-10 w-44 h-44 rounded-full bg-pink-200/40 blur-3xl" />
      <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-purple-200/40 blur-3xl" />

      <motion.div 
        initial={{ y: 30, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl relative z-10 space-y-7"
      >
        {/* Navigation Tabs */}
        <div className="flex border-b border-rose-100/60 pb-3 justify-around text-sm font-semibold text-muted-foreground">
          <button onClick={() => { playChime(); navigate("/signin"); }} className="hover:text-primary transition-colors pb-3 px-2 font-display">
            Sign In
          </button>
          <button onClick={() => { playChime(); navigate("/"); }} className="hover:text-primary transition-colors pb-3 px-2 font-display">
            Create Space
          </button>
          <button onClick={() => { playChime(); navigate("/join"); }} className="text-primary border-b-2 border-primary pb-3 px-2 font-display">
            Join Partner
          </button>
        </div>

        {/* Content Header */}
        <div className="text-center space-y-2">
          <motion.div 
            animate={{ scale: [1, 1.15, 1] }} 
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block"
          >
            <Heart className="w-13 h-13 mx-auto text-primary animate-pulse" fill="hsl(340, 72%, 58%)" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-slate-800 tracking-wide">Join Your Partner</h1>
          <p className="text-muted-foreground text-xs font-medium">Enter the Couple Space ID shared with you 💖</p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-400" />
              <input 
                placeholder="Enter unique username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/60 focus:bg-white/90 rounded-2xl px-4 py-3 pl-10 text-sm border border-rose-100 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-400" />
              <input 
                type="email"
                placeholder="E.G. partner@togethermiles.com" 
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
                placeholder="Minimum 6 characters" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/60 focus:bg-white/90 rounded-2xl px-4 py-3 pl-10 text-sm border border-rose-100 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">My Nickname</label>
            <div className="relative">
              <Heart className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-400" />
              <input 
                placeholder="E.G. Sweetheart" 
                value={nickname} 
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-white/60 focus:bg-white/90 rounded-2xl px-4 py-3 pl-10 text-sm border border-rose-100 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-400" />
              <input 
                placeholder="E.G. +1 555-0199" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/60 focus:bg-white/90 rounded-2xl px-4 py-3 pl-10 text-sm border border-rose-100 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground" 
              />
            </div>
          </div>

          {/* Gender selection cards */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">I am a...</label>
            <div className="flex gap-3">
              {(["boy", "girl"] as const).map((r) => (
                <button 
                  key={r} 
                  type="button" 
                  onClick={() => { playChime(); setRole(r); }}
                  className={`flex-1 py-3.5 px-4 rounded-2xl border-2 transition-all text-center relative overflow-hidden flex flex-col items-center justify-center ${
                    role === r 
                      ? "border-pink-500 bg-pink-50/50 text-slate-800 shadow-md shadow-pink-100" 
                      : "border-slate-100 hover:border-pink-100 bg-white/40 text-slate-600"
                  }`}
                >
                  <span className="text-3xl">{r === "boy" ? "👦" : "👧"}</span>
                  <p className="text-xs mt-1.5 font-display font-bold capitalize">{r}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Join action button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-98 text-white font-display font-bold tracking-wide transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 disabled:opacity-60 mt-4"
          >
            {loading ? (
              <Heart className="w-5 h-5 animate-heartbeat" fill="#ffffff" />
            ) : (
              <>
                Connect Space <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-muted-foreground font-medium">
          Once submitted, you will be connected instantly to your partner 💌
        </div>
      </motion.div>
    </div>
  );
};

export default Join;
