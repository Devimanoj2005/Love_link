import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, LogOut, Sparkles, Image, Camera, MapPin, BookOpen, Phone, Bell, X } from "lucide-react";
import { getSession, clearSession, CoupleSession } from "@/lib/couple-store";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  { icon: MessageCircle, label: "Chat", desc: "Send love messages 💕", path: "/chat", color: "from-pink-400 to-rose-400" },
  { icon: Sparkles, label: "Truth or Dare", desc: "Play together 🎮", path: "/truth-or-dare", color: "from-purple-400 to-violet-400" },
  { icon: Image, label: "Gallery", desc: "Private photos 📸", path: "/gallery", color: "from-fuchsia-400 to-pink-400" },
  { icon: Camera, label: "Snap Moment", desc: "Share stories 📷", path: "/snap", color: "from-violet-400 to-purple-400" },
  { icon: MapPin, label: "Future To-Do", desc: "Places to visit 🗺️", path: "/todos", color: "from-rose-400 to-pink-400" },
  { icon: BookOpen, label: "Love Diary", desc: "Write memories 📖", path: "/diary", color: "from-pink-400 to-fuchsia-400" },
  { icon: Phone, label: "Counseling", desc: "Premium support 💎", path: "/counseling", color: "from-amber-400 to-orange-400" },
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

  useEffect(() => {
    const s = getSession();
    if (!s) { navigate("/signin"); return; }
    setSessionState(s);
    supabase.from("couples").select("*").eq("id", s.coupleId).single()
      .then(({ data }) => {
        if (data) {
          const pn = s.role === "partner1" ? data.partner2_nickname : data.partner1_nickname;
          setPartnerNick(pn || "Waiting for partner...");
        }
      });

    // Fetch notifications for this user
    (supabase.from("notifications" as any).select("*")
      .eq("couple_id", s.coupleId)
      .eq("recipient_nickname", s.nickname)
      .order("created_at", { ascending: false })
      .limit(20) as any)
      .then(({ data }: any) => { if (data) setNotifications(data as AppNotification[]); });

    // Subscribe to real-time notifications
    const channel = supabase
      .channel(`notifs-${s.coupleId}-${s.nickname}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `couple_id=eq.${s.coupleId}`,
      }, (payload: any) => {
        const n = payload.new as AppNotification;
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

  const handleLogout = () => { clearSession(); navigate("/signin"); };

  if (!session) return null;

  return (
    <div className="min-h-screen soft-gradient">
      {/* Header */}
      <header className="glass-card border-b border-border/30 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <Heart className="w-6 h-6 text-primary animate-heartbeat" fill="hsl(340, 72%, 58%)" />
          <h1 className="text-lg font-display font-bold romantic-gradient-text tracking-wide">TogetherMiles</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }} className="relative text-muted-foreground hover:text-primary transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full romantic-gradient text-[10px] text-primary-foreground font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <span className="text-sm text-muted-foreground font-medium">{session.nickname}</span>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-primary transition-colors">
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
          className="glass-card rounded-3xl p-7 text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-3 left-4 text-primary/10 text-lg">💕</div>
          <div className="absolute bottom-3 right-4 text-primary/10 text-lg">💕</div>
          <div className="flex justify-center gap-5 text-5xl">
            <motion.span className="animate-float" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>👧</motion.span>
            <Heart className="w-8 h-8 text-primary animate-heartbeat self-center" fill="hsl(340, 72%, 58%)" />
            <motion.span className="animate-float" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}>👦</motion.span>
          </div>
          <p className="font-display font-bold text-lg text-foreground tracking-wide">{session.nickname} & {partnerNick}</p>
          <p className="text-xs text-muted-foreground tracking-wider">Couple ID: {session.coupleId}</p>
        </motion.div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {menuItems.map((item, i) => (
            <motion.button key={item.path}
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 + i * 0.06 }}
              onClick={() => navigate(item.path)}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="glass-card rounded-2xl p-5 flex flex-col items-center gap-3 text-center transition-all duration-200 hover:shadow-lg"
            >
              <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md`} style={{ width: 52, height: 52 }}>
                <item.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-display font-bold text-sm text-foreground leading-tight">{item.label}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{item.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
