import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, User, Phone, Copy, Check, Sparkles, Share2, LogIn, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { setSession } from "@/lib/couple-store";
import { playChime } from "@/lib/utils";
import { toast } from "sonner";

const SignUp = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"boy" | "girl">("boy");
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !nickname.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill all fields so we can craft your space 🥺");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long! 🔒");
      return;
    }
    setLoading(true);
    playChime();
    try {
      // 1. Create a real User with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Insert Couple record with the linked partner1_uid
      const { data, error } = await supabase.from("couples").insert({
        partner1_username: username.trim(),
        partner1_nickname: nickname.trim(),
        partner1_phone: phone.trim(),
        partner1_role: role,
        partner1_uid: user.uid,
        partner1_email: email.trim(),
      }).select("id").single();

      if (error) throw error;

      // 3. Create companion user document in Firestore users collection
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: email.trim(),
        username: username.trim(),
        nickname: nickname.trim(),
        role: "partner1",
        coupleId: data.id,
        createdAt: new Date().toISOString()
      });
      
      setCoupleId(data.id);
      setSession({ coupleId: data.id, username: username.trim(), nickname: nickname.trim(), role: "partner1" });
      playChime();
      toast.success("Relationship Space created successfully! 🎉💕");
    } catch (err: any) {
      toast.error(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyId = () => {
    if (coupleId) {
      navigator.clipboard.writeText(coupleId);
      setCopied(true);
      playChime();
      toast.success("Couple ID copied! Send it to your partner 💌");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // If Couple Space is successfully provisioned
  if (coupleId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden bg-gradient-to-br from-pink-50 via-rose-100 to-indigo-50">
        <div className="absolute top-10 left-10 w-44 h-44 rounded-full bg-pink-200/40 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-purple-200/40 blur-3xl" />

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative z-10"
        >
          <motion.div 
            animate={{ scale: [1, 1.15, 1] }} 
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block"
          >
            <Heart className="w-16 h-16 mx-auto text-primary animate-heartbeat" fill="hsl(340, 72%, 58%)" />
          </motion.div>
          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-wide">You're Connected! 🎉</h2>
          <p className="text-muted-foreground text-xs font-medium px-2 leading-relaxed">
            Your romantic digital home has been crafted. Share this custom Couple ID with your partner so they can join you!
          </p>

          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50/50 border border-rose-100 relative overflow-hidden group">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your Space ID</span>
              <span className="text-2xl font-bold font-display tracking-widest text-primary">{coupleId}</span>
            </div>
            <button 
              onClick={copyId} 
              className="p-3 bg-white hover:bg-rose-100/50 rounded-xl transition-all shadow-sm border border-rose-100 text-rose-500 hover:text-rose-600 active:scale-95"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <button 
            onClick={() => { playChime(); navigate("/signin"); }}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-98 text-white font-display font-bold tracking-wide transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
          >
            Enter Our Space <LogIn className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

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
          <button onClick={() => { playChime(); navigate("/"); }} className="text-primary border-b-2 border-primary pb-3 px-2 font-display">
            Create Space
          </button>
          <button onClick={() => { playChime(); navigate("/join"); }} className="hover:text-primary transition-colors pb-3 px-2 font-display">
            Join Partner
          </button>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-2">
          <motion.div 
            animate={{ y: [0, -6, 0] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block"
          >
            <Heart className="w-13 h-13 mx-auto text-primary" fill="hsl(340, 72%, 58%)" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-slate-800 tracking-wide">Craft Together Space</h1>
          <p className="text-muted-foreground text-xs font-medium">Build a beautiful home for just the two of you 💖</p>
        </div>

        {/* Input fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-400" />
              <input 
                placeholder="E.G. user_love" 
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
                placeholder="E.G. Cutiepie" 
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

          {/* Gender character switcher */}
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

          {/* Create Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-98 text-white font-display font-bold tracking-wide transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 disabled:opacity-60 mt-4"
          >
            {loading ? (
              <Heart className="w-5 h-5 animate-heartbeat" fill="#ffffff" />
            ) : (
              <>
                Create Our Space <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-muted-foreground font-medium">
          Once created, you will receive a custom ID to send to your partner ✉️
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;
