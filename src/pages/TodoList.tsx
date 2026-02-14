import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Plus, Check, X } from "lucide-react";
import { getSession } from "@/lib/couple-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Todo {
  id: string;
  place: string;
  status: "pending" | "visited" | "cancelled";
  added_by: string;
  created_at: string;
}

const TodoList = () => {
  const navigate = useNavigate();
  const session = getSession();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [place, setPlace] = useState("");

  useEffect(() => {
    if (!session) { navigate("/signin"); return; }
    supabase.from("couple_todos").select("*").eq("couple_id", session.coupleId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setTodos(data as Todo[]); });
  }, []);

  const addPlace = async () => {
    if (!session || !place.trim()) return;
    const { data } = await supabase.from("couple_todos").insert({
      couple_id: session.coupleId, place: place.trim(), added_by: session.nickname,
    }).select().single();
    if (data) setTodos(prev => [data as Todo, ...prev]);
    setPlace("");
    toast.success("Place added! 📍");
  };

  const updateStatus = async (id: string, status: "visited" | "cancelled") => {
    await supabase.from("couple_todos").update({ status }).eq("id", id);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  if (!session) return null;

  return (
    <div className="min-h-screen soft-gradient">
      <header className="glass-card border-b border-border/30 p-4 flex items-center gap-3">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <MapPin className="w-5 h-5 text-primary" />
        <h1 className="font-display font-bold text-foreground tracking-wide">Future To-Do 🗺️</h1>
      </header>

      <div className="p-5 max-w-lg mx-auto space-y-5">
        <div className="flex gap-2.5">
          <input placeholder="Add a place..." value={place} onChange={e => setPlace(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addPlace()}
            className="flex-1 bg-card/60 backdrop-blur-sm rounded-xl px-4 py-3 text-sm border border-border/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground" />
          <button onClick={addPlace} disabled={!place.trim()}
            className="w-12 h-12 rounded-xl romantic-gradient flex items-center justify-center text-primary-foreground shrink-0 disabled:opacity-40 shadow-md">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {todos.map((t, i) => (
            <motion.div key={t.id}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i < 10 ? i * 0.05 : 0 }}
              className={`glass-card rounded-2xl p-4 flex items-center gap-3 ${t.status === "visited" ? "opacity-70" : ""} ${t.status === "cancelled" ? "opacity-40" : ""}`}>
              <MapPin className={`w-5 h-5 shrink-0 ${t.status === "visited" ? "text-green-500" : t.status === "cancelled" ? "text-destructive" : "text-primary"}`} />
              <div className="flex-1 min-w-0">
                <p className={`font-display font-bold text-foreground ${t.status !== "pending" ? "line-through" : ""}`}>{t.place}</p>
                <p className="text-xs text-muted-foreground">by {t.added_by}</p>
              </div>
              {t.status === "pending" && (
                <div className="flex gap-1.5">
                  <button onClick={() => updateStatus(t.id, "visited")}
                    className="w-9 h-9 rounded-xl bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => updateStatus(t.id, "cancelled")}
                    className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {t.status === "visited" && <span className="text-xs font-bold text-green-500">Visited ✓</span>}
              {t.status === "cancelled" && <span className="text-xs font-bold text-destructive">Cancelled</span>}
            </motion.div>
          ))}
        </div>

        {todos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="w-14 h-14 mx-auto mb-4 text-primary/20" />
            <p className="font-display font-bold">Add places you want to visit together! 🗺️</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
