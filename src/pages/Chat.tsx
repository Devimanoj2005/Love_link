import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Send } from "lucide-react";
import { getSession } from "@/lib/couple-store";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  sender_nickname: string;
  created_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const session = getSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) { navigate("/signin"); return; }
    supabase.from("messages").select("*").eq("couple_id", session.coupleId)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setMessages(data as Message[]); });

    const channel = supabase
      .channel(`chat-${session.coupleId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `couple_id=eq.${session.coupleId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !session || sending) return;
    setSending(true);
    const msg = text.trim();
    setText("");
    try {
      await supabase.from("messages").insert({
        couple_id: session.coupleId,
        sender_nickname: session.nickname,
        text: msg,
      });
      // Send notification to partner
      const { data: coupleData } = await supabase.from("couples").select("*").eq("id", session.coupleId).single();
      if (coupleData) {
        const partnerNick = session.role === "partner1" ? coupleData.partner2_nickname : coupleData.partner1_nickname;
        if (partnerNick) {
          await (supabase.from("notifications" as any).insert({
            couple_id: session.coupleId,
            recipient_nickname: partnerNick,
            sender_nickname: session.nickname,
            type: "chat",
            message: `${session.nickname}: ${msg.length > 40 ? msg.slice(0, 40) + "..." : msg} 💬`,
          }) as any);
        }
      }
    } catch {}
    setSending(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col chat-bg">
      {/* Header */}
      <header className="glass-card border-b border-border/30 p-4 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Heart className="w-5 h-5 text-primary animate-heartbeat" fill="hsl(340, 72%, 58%)" />
        <h1 className="font-display font-bold text-foreground tracking-wide">Love Chat 💕</h1>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-20">
            <Heart className="w-14 h-14 mx-auto mb-4 text-primary/20 animate-gentle-pulse" />
            <p className="text-sm font-medium">Send your first love message 💕</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.sender_nickname === session.nickname;
          return (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i < 20 ? i * 0.02 : 0 }}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[78%] px-4 py-3 ${isMine ? "chat-bubble-sent" : "chat-bubble-received"}`}>
                {!isMine && (
                  <p className="text-xs font-bold mb-1 opacity-70">{msg.sender_nickname}</p>
                )}
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1.5 ${isMine ? "text-primary-foreground/50" : "text-muted-foreground"} text-right`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="glass-card border-t border-border/30 p-3 flex gap-2.5 shrink-0">
        <input
          placeholder="Type a love message... 💌"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-card/60 backdrop-blur-sm rounded-2xl px-4 py-3 text-sm border border-border/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-12 h-12 rounded-2xl romantic-gradient flex items-center justify-center text-primary-foreground disabled:opacity-40 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Chat;
