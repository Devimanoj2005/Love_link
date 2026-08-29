import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, MessageCircle, LogOut, Sparkles, Image, Camera, MapPin, 
  BookOpen, Phone, Bell, X, Battery, BatteryCharging, Smile, Calendar, Edit2 
} from "lucide-react";
import { getSession, clearSession, CoupleSession } from "@/lib/couple-store";
import { supabase } from "@/integrations/supabase/client";
import { playChime } from "@/lib/utils";
import { toast } from "sonner";

const menuItems = [
  { icon: MessageCircle, label: "Chat", desc: "Send love messages 💕", path: "/chat", color: "from-pink-400 to-rose-400" },
  { icon: Sparkles, label: "Truth or Dare", desc: "Play together 🎮", path: "/truth-or-dare", color: "from-purple-400 to-violet-400" },
  { icon: Image, label: "Gallery", desc: "Private photos 📸", path: "/gallery", color: "from-fuchsia-400 to-pink-400" },
  { icon: Camera, label: "Snap Moment", desc: "Share stories 📷", path: "/snap", color: "from-violet-400 to-purple-400" },
  { icon: MapPin, label: "Future To-Do", desc: "Places to visit 🗺️", path: "/todos", color: "from-rose-400 to-pink-400" },
  { icon: BookOpen, label: "Love Diary", desc: "Write memories 📖", path: "/diary", color: "from-pink-400 to-fuchsia-400" },
  { icon: Phone, label: "Counseling", desc: "Premium support 💎", path: "/counseling", color: "from-amber-400 to-orange-400" },
];

const MOODS = [
  { emoji: "💖", label: "Loved" },
  { emoji: "🥺", label: "Miss You" },
  { emoji: "😊", label: "Happy" },
  { emoji: "💤", label: "Sleepy" },
  { emoji: "🍕", label: "Hungry" },
  { emoji: "🧸", label: "Cozy" },
];

interface AppNotification {
  id: string;
  type: string;
  message: string;
  sender_nickname: string;
  recipient_nickname: string;
  is_read: boolean;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSessionState] = useState<CoupleSession | null>(null);
  const [partnerNick, setPartnerNick] = useState<string>("");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // Love Battery and Mood board states
  const [myMood, setMyMood] = useState<string>("Loved 💖");
  const [partnerMood, setPartnerMood] = useState<string>("Unknown 💭");
  const [myBattery, setMyBattery] = useState<number>(80);
  const [partnerBattery, setPartnerBattery] = useState<number>(85);
  const [isMoodOpen, setIsMoodOpen] = useState(false);

  // Anniversary date states
  const [anniversaryDate, setAnniversaryDate] = useState<string>("");
  const [isEditingAnn, setIsEditingAnn] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) { navigate("/signin"); return; }
    setSessionState(s);

    // Load anniversary from localStorage
    const savedAnn = localStorage.getItem(`togethermiles_anniversary_${s.coupleId}`);
    setAnniversaryDate(savedAnn || "2025-02-14");

    // Fetch partner details
    supabase.from("couples").select("*").eq("id", s.coupleId).single()
      .then(({ data }) => {
        if (data) {
          const pn = s.role === "partner1" ? data.partner2_nickname : data.partner1_nickname;
          setPartnerNick(pn || "Waiting for partner...");
        }
      });

    // Fetch notifications for this user
    supabase.from("notifications" as any).select("*")
      .eq("couple_id", s.coupleId)
      .eq("recipient_nickname", s.nickname)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }: any) => { if (data) setNotifications(data as AppNotification[]); });

    // Fetch latest mood and battery
    supabase.from("notifications")
      .select("*")
      .eq("couple_id", s.coupleId)
      .in("type", ["mood", "battery"])
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          let foundMyMood = false;
          let foundPartnerMood = false;
          let foundMyBattery = false;
          let foundPartnerBattery = false;

          for (const item of data) {
            const isMine = item.sender_nickname === s.nickname;
            if (item.type === "mood") {
              if (isMine && !foundMyMood) {
                setMyMood(item.message);
                foundMyMood = true;
              } else if (!isMine && !foundPartnerMood) {
                setPartnerMood(item.message);
                foundPartnerMood = true;
              }
            } else if (item.type === "battery") {
              const val = parseInt(item.message, 10);
              if (!isNaN(val)) {
                if (isMine && !foundMyBattery) {
                  setMyBattery(val);
                  foundMyBattery = true;
                } else if (!isMine && !foundPartnerBattery) {
                  setPartnerBattery(val);
                  foundPartnerBattery = true;
                }
              }
            }
          }
        }
      });

    // Subscribe to real-time notifications, status updates, and mood/battery check-ins
    const channel = supabase
      .channel(`notifs-${s.coupleId}-${s.nickname}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `couple_id=eq.${s.coupleId}`,
      }, (payload: any) => {
        const n = payload.new as AppNotification;
        const isMine = n.sender_nickname === s.nickname;

        if (n.type === "mood") {
          if (isMine) {
            setMyMood(n.message);
          } else {
            setPartnerMood(n.message);
            toast.success(`${n.sender_nickname} updated their mood to: ${n.message}! 💕`);
          }
        } else if (n.type === "battery") {
          const val = parseInt(n.message, 10);
          if (!isNaN(val)) {
            if (isMine) {
              setMyBattery(val);
            } else {
              setPartnerBattery(val);
            }
          }
        }

        if (n.recipient_nickname === s.nickname) {
          setNotifications(prev => [n, ...prev]);
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    if (!session) return;
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await (supabase.from("notifications" as any).update({ is_read: true }).in("id", unreadIds) as any);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleLogout = () => { playChime(); clearSession(); navigate("/signin"); };

  // Calculate relationship days
  const getDaysTogether = () => {
    if (!anniversaryDate) return 0;
    const ann = new Date(anniversaryDate);
    const today = new Date();
    const diff = today.getTime() - ann.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : 0;
  };

  const getDaysToNextAnniversary = () => {
    if (!anniversaryDate) return 0;
    const ann = new Date(anniversaryDate);
    const today = new Date();
    
    const nextAnn = new Date(today.getFullYear(), ann.getMonth(), ann.getDate());
    if (nextAnn.getTime() < today.getTime()) {
      nextAnn.setFullYear(today.getFullYear() + 1);
    }
    
    const diff = nextAnn.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleAnniversarySave = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && session) {
      setAnniversaryDate(val);
      localStorage.setItem(`togethermiles_anniversary_${session.coupleId}`, val);
      setIsEditingAnn(false);
      playChime();
      toast.success("Relationship anniversary updated! 🎉");
    }
  };

  // Broadcast Mood Update
  const updateMood = async (moodStr: string) => {
    if (!session) return;
    setMyMood(moodStr);
    setIsMoodOpen(false);
    playChime();
    try {
      const pName = partnerNick || "Partner";
      await supabase.from("notifications").insert({
        couple_id: session.coupleId,
        recipient_nickname: pName,
        sender_nickname: session.nickname,
        type: "mood",
        message: moodStr
      });
      toast.success(`Mood set to ${moodStr}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Broadcast Battery Update
  const handleBatteryChange = async (val: number) => {
    if (!session) return;
    setMyBattery(val);
  };

  const handleBatteryRelease = async () => {
    if (!session) return;
    playChime();
    try {
      const pName = partnerNick || "Partner";
      await supabase.from("notifications").insert({
        couple_id: session.coupleId,
        recipient_nickname: pName,
        sender_nickname: session.nickname,
        type: "battery",
        message: String(myBattery)
      });
      toast.success(`Broadcasting battery level: ${myBattery}% 🔋`);
    } catch (err) {
      console.error(err);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen soft-gradient pb-10">
      {/* Header */}
      <header className="glass-card border-b border-border/30 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <Heart className="w-6 h-6 text-primary animate-heartbeat" fill="hsl(340, 72%, 58%)" />
          <h1 className="text-lg font-display font-bold romantic-gradient-text tracking-wide">TogetherMiles</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button onClick={() => { playChime(); setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }} className="relative text-muted-foreground hover:text-primary transition-colors p-1.5">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full romantic-gradient text-[10px] text-primary-foreground font-bold flex items-center justify-center shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <span className="text-sm text-muted-foreground font-medium bg-secondary/80 px-3 py-1.5 rounded-full">{session.nickname}</span>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-primary transition-colors p-1.5" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-3 left-3 z-20 glass-card rounded-2xl p-4 shadow-xl max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-foreground text-sm">Notifications 🔔</h3>
              <button onClick={() => setShowNotifs(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No notifications yet 💕</p>
            ) : (
              <div className="space-y-2">
                {notifications.map(n => (
                  <div key={n.id} className={`rounded-xl p-3 text-sm transition-all ${n.is_read ? "bg-card/40" : "bg-primary/10 border border-primary/20"}`}>
                    <p className="text-foreground font-medium">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-5 max-w-lg mx-auto space-y-5 mt-2">
        {/* Couple Card */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="glass-card rounded-3xl p-6 text-center space-y-4 relative overflow-hidden shadow-sm">
          <div className="absolute top-3 left-4 text-primary/10 text-lg">💕</div>
          <div className="absolute bottom-3 right-4 text-primary/10 text-lg">💕</div>
          <div className="flex justify-center gap-6 text-5xl">
            <motion.span className="animate-float" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              {session.role === "partner1" ? "👦" : "👧"}
            </motion.span>
            <Heart className="w-10 h-10 text-primary animate-heartbeat self-center" fill="hsl(340, 72%, 58%)" />
            <motion.span className="animate-float" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}>
              {session.role === "partner1" ? "👧" : "👦"}
            </motion.span>
          </div>
          <p className="font-display font-bold text-xl text-foreground tracking-wide">{session.nickname} & {partnerNick}</p>
          <p className="text-xs text-muted-foreground bg-secondary/60 py-1.5 px-4 rounded-full inline-block font-mono">Couple ID: {session.coupleId}</p>
        </motion.div>

        {/* Live Status & Interactive Widgets */}
        <div className="grid grid-cols-1 gap-4">
          {/* Anniversary Card Widget */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden border border-border/20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex flex-col items-center justify-center text-rose-500 shrink-0">
                <Calendar className="w-6 h-6" />
                <span className="text-[10px] font-bold mt-0.5">
                  {anniversaryDate ? new Date(anniversaryDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "Set Date"}
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display font-bold text-foreground text-base">Anniversary Countdown</h3>
                  <button onClick={() => setIsEditingAnn(!isEditingAnn)} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {isEditingAnn ? (
                  <input type="date" value={anniversaryDate} onChange={handleAnniversarySave}
                    className="romantic-input text-xs px-2 py-1 mt-1 rounded border" />
                ) : (
                  <>
                    <p className="text-2xl font-bold font-display romantic-gradient-text">{getDaysTogether()} Days</p>
                    <p className="text-xs text-muted-foreground">{getDaysToNextAnniversary()} Days left until next anniversary 🎉</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Love Battery Widget */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
            className="glass-card rounded-3xl p-5 shadow-sm space-y-4 border border-border/20">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-1.5">
                <BatteryCharging className="w-4 h-4 text-primary animate-pulse" /> Love Battery Levels
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* My Battery */}
              <div className="space-y-2 bg-secondary/30 p-3.5 rounded-2xl">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>Me</span>
                  <span className="text-primary">{myBattery}%</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden relative flex items-center">
                  <div className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-300" style={{ width: `${myBattery}%` }} />
                  <span className="absolute left-1/2 -translate-x-1/2 text-[9px] text-foreground font-bold">{myBattery}%</span>
                </div>
                <input type="range" min="10" max="100" value={myBattery} 
                  onChange={e => handleBatteryChange(parseInt(e.target.value))}
                  onMouseUp={handleBatteryRelease}
                  onTouchEnd={handleBatteryRelease}
                  className="w-full accent-primary cursor-pointer mt-1 h-1 bg-muted rounded-lg" />
              </div>

              {/* Partner's Battery */}
              <div className="space-y-2 bg-secondary/30 p-3.5 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>{partnerNick || "Partner"}</span>
                  <span className="text-accent-foreground">{partnerBattery}%</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden relative flex items-center my-auto">
                  <div className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all duration-300" style={{ width: `${partnerBattery}%` }} />
                  <span className="absolute left-1/2 -translate-x-1/2 text-[9px] text-foreground font-bold">{partnerBattery}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground text-center italic mt-1">Live synchronized status 🔌</p>
              </div>
            </div>
          </motion.div>

          {/* Mood Check-In Widget */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl p-5 shadow-sm space-y-3.5 border border-border/20 relative">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-primary" /> Mood Tracker
              </h3>
              <button onClick={() => { playChime(); setIsMoodOpen(!isMoodOpen); }} 
                className="text-xs font-bold text-primary hover:underline bg-primary/10 py-1 px-3 rounded-full">
                {isMoodOpen ? "Close" : "Change Mood"}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-2xl">
              <div className="text-center flex-1 border-r border-border/40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">My Mood</p>
                <p className="text-lg font-bold mt-1 font-display text-foreground">{myMood}</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{partnerNick || "Partner"}'s Mood</p>
                <p className="text-lg font-bold mt-1 font-display text-foreground">{partnerMood}</p>
              </div>
            </div>

            <AnimatePresence>
              {isMoodOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2 text-center font-medium">How are you feeling right now? 💕</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {MOODS.map(m => (
                      <button key={m.label} onClick={() => updateMood(`${m.label} ${m.emoji}`)}
                        className="p-2.5 rounded-xl border border-border/40 hover:border-primary/40 bg-card/50 hover:bg-primary/5 transition-all text-center flex flex-col items-center justify-center">
                        <span className="text-xl">{m.emoji}</span>
                        <span className="text-[10px] font-bold text-foreground mt-1 capitalize">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Action Title */}
        <div className="pt-2">
          <h2 className="font-display font-bold text-base text-foreground tracking-wide flex items-center gap-2">
            💕 Our Romantic Space
          </h2>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {menuItems.map((item, i) => (
            <motion.button key={item.path}
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              onClick={() => { playChime(); navigate(item.path); }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="glass-card rounded-2xl p-5 flex flex-col items-center gap-3 text-center transition-all duration-200 hover:shadow-md border border-border/10"
            >
              <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm shrink-0`} style={{ width: 52, height: 52 }}>
                <item.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-display font-bold text-sm text-foreground leading-tight">{item.label}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-1">{item.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
