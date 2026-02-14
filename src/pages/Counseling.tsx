import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Phone, Video, Upload, CheckCircle, Clock, Unlock, ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/couple-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRef } from "react";

const UPI_ID = "2005devimanoj@okhdfcbank";
const UPI_NAME = "TogetherMiles%20Counseling";

const voiceCounselors = [
  { name: "Devi Manoj", phone: "8301922872", emoji: "👩‍⚕️" },
  { name: "Joshna Jojo", phone: "8301922872", emoji: "👩‍💼" },
];

const videoCounselors = [
  { name: "Devi Manoj", phone: "8301922872", emoji: "👩‍⚕️" },
  { name: "Joshna Jojo", phone: "8301922872", emoji: "👩‍💼" },
];

interface PremiumReq {
  id: string;
  plan: "voice" | "video";
  amount: number;
  screenshot_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

type Step = "choose_plan" | "choose_counselor" | "payment";

const Counseling = () => {
  const navigate = useNavigate();
  const session = getSession();
  const [requests, setRequests] = useState<PremiumReq[]>([]);
  const [step, setStep] = useState<Step>("choose_plan");
  const [selectedPlan, setSelectedPlan] = useState<"voice" | "video" | null>(null);
  const [selectedCounselor, setSelectedCounselor] = useState<{ name: string; phone: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isApproved = requests.some(r => r.status === "approved");

  useEffect(() => {
    if (!session) { navigate("/signin"); return; }
    supabase.from("premium_requests").select("*").eq("couple_id", session.coupleId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setRequests(data as PremiumReq[]); });
  }, []);

  const handlePlanSelect = (plan: "voice" | "video") => {
    setSelectedPlan(plan);
    setStep("choose_counselor");
  };

  const handleCounselorSelect = (counselor: { name: string; phone: string }) => {
    setSelectedCounselor(counselor);
    setStep("payment");
    // Open UPI payment
    const amount = selectedPlan === "voice" ? 50 : 100;
    const link = `upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${amount}&cu=INR`;
    window.open(link, "_blank");
  };

  const uploadScreenshot = async (file: File) => {
    if (!session || !selectedPlan) return;
    setUploading(true);
    const amount = selectedPlan === "voice" ? 50 : 100;
    const path = `${session.coupleId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("payment-screenshots").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("payment-screenshots").getPublicUrl(path);
    const { data } = await supabase.from("premium_requests").insert({
      couple_id: session.coupleId, plan: selectedPlan, amount,
      screenshot_url: urlData.publicUrl,
    }).select().single();
    if (data) setRequests(prev => [data as PremiumReq, ...prev]);
    setStep("choose_plan"); setSelectedPlan(null); setSelectedCounselor(null); setUploading(false);
    toast.success("Payment proof submitted! We'll verify shortly 💕");
  };

  const goBack = () => {
    if (step === "payment") { setStep("choose_counselor"); setSelectedCounselor(null); }
    else if (step === "choose_counselor") { setStep("choose_plan"); setSelectedPlan(null); }
  };

  if (!session) return null;

  const counselors = selectedPlan === "video" ? videoCounselors : voiceCounselors;

  return (
    <div className="min-h-screen soft-gradient">
      <header className="glass-card border-b border-border/30 p-4 flex items-center gap-3">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Heart className="w-5 h-5 text-primary" />
        <h1 className="font-display font-bold text-foreground tracking-wide">Counseling 💎</h1>
      </header>

      <div className="p-5 max-w-lg mx-auto space-y-6">
        {isApproved ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-7 space-y-5 text-center">
            <Unlock className="w-14 h-14 mx-auto text-green-500" />
            <h2 className="text-xl font-display font-bold text-foreground">Premium Counseling Unlocked! 💕</h2>
            <p className="text-sm text-muted-foreground font-medium">Available Counselors</p>
            <div className="space-y-3">
              {voiceCounselors.map((c) => (
                <div key={c.name} className="glass-card rounded-2xl p-4 flex items-center gap-4 shadow-md">
                  <div className="w-12 h-12 rounded-2xl romantic-gradient flex items-center justify-center text-xl shadow-md">{c.emoji}</div>
                  <div className="text-left flex-1">
                    <p className="font-display font-bold text-foreground">{c.name}</p>
                    <a href={`tel:${c.phone}`} className="text-sm text-primary font-medium flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {c.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground pt-2">You can now contact the counselor directly 💬</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Step 1: Choose Plan */}
            {step === "choose_plan" && (
              <motion.div key="plan" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="space-y-3">
                <h2 className="font-display font-bold text-lg text-foreground text-center">Choose a Plan ✨</h2>
                {[
                  { plan: "voice" as const, icon: Phone, label: "Voice Call", desc: "30 min session", price: 50 },
                  { plan: "video" as const, icon: Video, label: "Video Call", desc: "30 min session", price: 100 },
                ].map((item) => (
                  <motion.button key={item.plan} onClick={() => handlePlanSelect(item.plan)}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-lg">
                    <div className="w-13 h-13 rounded-2xl romantic-gradient flex items-center justify-center shadow-md" style={{ width: 52, height: 52 }}>
                      <item.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-display font-bold text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <span className="text-lg font-display font-bold text-primary">₹{item.price}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Step 2: Choose Counselor */}
            {step === "choose_counselor" && (
              <motion.div key="counselor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                <button onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="font-display font-bold text-lg text-foreground text-center">
                  Choose a Counselor for {selectedPlan === "voice" ? "Voice" : "Video"} Call {selectedPlan === "voice" ? "📞" : "📹"}
                </h2>
                <div className="space-y-3">
                  {counselors.map((c) => (
                    <motion.button key={c.name} onClick={() => handleCounselorSelect(c)}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-lg">
                      <div className="w-14 h-14 rounded-2xl romantic-gradient flex items-center justify-center text-2xl shadow-md">{c.emoji}</div>
                      <div className="text-left flex-1">
                        <p className="font-display font-bold text-foreground">{c.name}</p>
                        <p className="text-sm text-muted-foreground">{c.phone}</p>
                      </div>
                      <span className="text-sm font-display font-bold text-primary">
                        ₹{selectedPlan === "voice" ? 50 : 100}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment & Upload */}
            {step === "payment" && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                <button onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="glass-card rounded-2xl p-5 space-y-4 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl romantic-gradient flex items-center justify-center text-3xl shadow-md">
                    {selectedPlan === "voice" ? "📞" : "📹"}
                  </div>
                  <h3 className="font-display font-bold text-foreground">{selectedPlan === "voice" ? "Voice" : "Video"} Call with {selectedCounselor?.name}</h3>
                  <p className="text-2xl font-display font-bold text-primary">₹{selectedPlan === "voice" ? 50 : 100}</p>
                  <p className="text-sm text-muted-foreground">Complete payment via UPI and upload the screenshot below for verification</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadScreenshot(f); }} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="w-full romantic-btn h-12 font-display font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                    <Upload className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Upload Payment Screenshot"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Past requests */}
        {requests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground text-sm">Your Requests</h3>
            {requests.map(r => (
              <div key={r.id} className="glass-card rounded-2xl p-4 flex items-center gap-3">
                {r.status === "pending" && <Clock className="w-5 h-5 text-amber-500" />}
                {r.status === "approved" && <CheckCircle className="w-5 h-5 text-green-500" />}
                <div className="flex-1">
                  <p className="text-sm font-display font-bold text-foreground capitalize">{r.plan} Call — ₹{r.amount}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-bold capitalize ${r.status === "approved" ? "text-green-500" : r.status === "rejected" ? "text-destructive" : "text-amber-500"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Counseling;
