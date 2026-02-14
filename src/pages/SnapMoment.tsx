import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, Eye, EyeOff, X } from "lucide-react";
import { getSession } from "@/lib/couple-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Snap {
  id: string;
  file_url: string;
  uploaded_by: string;
  visibility: "both" | "only_me";
  created_at: string;
}

const SnapMoment = () => {
  const navigate = useNavigate();
  const session = getSession();
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [viewingSnap, setViewingSnap] = useState<Snap | null>(null);
  const [uploading, setUploading] = useState(false);
  const [visibility, setVisibility] = useState<"both" | "only_me">("both");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session) { navigate("/signin"); return; }
    supabase.from("snap_moments").select("*").eq("couple_id", session.coupleId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          const filtered = (data as Snap[]).filter(s =>
            s.visibility === "both" || s.uploaded_by === session.nickname
          );
          setSnaps(filtered);
        }
      });
  }, []);

  const upload = async (file: File) => {
    if (!session) return;
    setUploading(true);
    const path = `${session.coupleId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("snaps").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("snaps").getPublicUrl(path);
    const newSnap: Partial<Snap> = {
      id: crypto.randomUUID(), file_url: urlData.publicUrl,
      uploaded_by: session.nickname, visibility, created_at: new Date().toISOString(),
    };
    await supabase.from("snap_moments").insert({
      couple_id: session.coupleId, uploaded_by: session.nickname,
      file_url: urlData.publicUrl, visibility,
    });
    setSnaps(prev => [newSnap as Snap, ...prev]);
    setUploading(false);
    toast.success("Snap uploaded! 📸");
  };

  if (!session) return null;

  return (
    <div className="min-h-screen soft-gradient">
      <header className="glass-card border-b border-border/30 p-4 flex items-center gap-3">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Camera className="w-5 h-5 text-primary" />
        <h1 className="font-display font-bold text-foreground tracking-wide">Snap Moments 📷</h1>
      </header>

      <div className="p-5 max-w-lg mx-auto space-y-5">
        {/* Upload */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <div className="flex gap-2">
            {([
              { v: "both" as const, icon: Eye, label: "Both see" },
              { v: "only_me" as const, icon: EyeOff, label: "Only me" },
            ]).map(({ v, icon: Icon, label }) => (
              <button key={v} onClick={() => setVisibility(v)}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${visibility === v ? "border-primary bg-primary/10 shadow-md" : "border-border/50 hover:border-primary/30"}`}>
                <Icon className="w-4 h-4" />
                <span className="text-sm font-display font-bold text-foreground">{label}</span>
              </button>
            ))}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full romantic-btn h-12 font-display font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            <Camera className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload Snap"}
          </button>
        </div>

        {/* Stories row */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {snaps.map((s, i) => (
            <motion.button key={s.id} onClick={() => setViewingSnap(s)}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i < 8 ? i * 0.05 : 0 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="shrink-0 w-20 h-28 rounded-2xl overflow-hidden border-2 border-primary/40 relative shadow-md">
              <img src={s.file_url} alt="Snap" className="w-full h-full object-cover" />
              {s.visibility === "only_me" && (
                <div className="absolute top-1 right-1 bg-foreground/60 rounded-full p-0.5">
                  <EyeOff className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {snaps.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Camera className="w-14 h-14 mx-auto mb-4 text-primary/20" />
            <p className="font-display font-bold">No snap moments yet 📸</p>
          </div>
        )}
      </div>

      {/* Story viewer */}
      <AnimatePresence>
        {viewingSnap && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center"
            onClick={() => setViewingSnap(null)}>
            <button className="absolute top-4 right-4 text-primary-foreground z-10">
              <X className="w-8 h-8" />
            </button>
            <img src={viewingSnap.file_url} alt="Snap" className="max-w-full max-h-full object-contain" />
            <div className="absolute bottom-8 text-center text-primary-foreground">
              <p className="text-sm font-display font-bold">{viewingSnap.uploaded_by}</p>
              <p className="text-xs opacity-60">{new Date(viewingSnap.created_at).toLocaleString()}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SnapMoment;
