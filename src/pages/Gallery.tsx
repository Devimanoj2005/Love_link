import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Image, Trash2, Eye, EyeOff } from "lucide-react";
import { getSession } from "@/lib/couple-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Photo {
  id: string;
  file_url: string;
  caption: string | null;
  uploaded_by: string;
  created_at: string;
  visibility: string;
}

const Gallery = () => {
  const navigate = useNavigate();
  const session = getSession();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"both" | "only_me">("both");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session) { navigate("/signin"); return; }
    supabase.from("gallery_photos").select("*").eq("couple_id", session.coupleId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          // Filter: show "both" photos + "only_me" photos uploaded by current user
          const filtered = (data as Photo[]).filter(p =>
            p.visibility === "both" || p.uploaded_by === session.nickname
          );
          setPhotos(filtered);
        }
      });
  }, []);

  const upload = async (file: File) => {
    if (!session) return;
    setUploading(true);
    const path = `${session.coupleId}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("gallery").upload(path, file);
    if (uploadErr) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(path);
    await (supabase.from("gallery_photos").insert({
      couple_id: session.coupleId, uploaded_by: session.nickname,
      file_url: urlData.publicUrl, caption: caption.trim() || null,
      visibility,
    } as any) as any);

    // Send notification to partner if shared
    if (visibility === "both") {
      const { data: coupleData } = await supabase.from("couples").select("*").eq("id", session.coupleId).single();
      if (coupleData) {
        const partnerNick = session.role === "partner1" ? coupleData.partner2_nickname : coupleData.partner1_nickname;
        if (partnerNick) {
          await (supabase.from("notifications" as any).insert({
            couple_id: session.coupleId,
            recipient_nickname: partnerNick,
            sender_nickname: session.nickname,
            type: "gallery",
            message: `${session.nickname} added a new photo to the gallery 📸`,
          }) as any);
        }
      }
    }

    setPhotos(prev => [{ id: crypto.randomUUID(), file_url: urlData.publicUrl, caption: caption.trim() || null, uploaded_by: session.nickname, created_at: new Date().toISOString(), visibility }, ...prev]);
    setCaption(""); setUploading(false);
    toast.success("Photo uploaded! 📸");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) upload(file);
  };

  const deletePhoto = async (id: string) => {
    await supabase.from("gallery_photos").delete().eq("id", id);
    setPhotos(prev => prev.filter(p => p.id !== id));
    toast.success("Photo removed");
  };

  if (!session) return null;

  return (
    <div className="min-h-screen soft-gradient">
      <header className="glass-card border-b border-border/30 p-4 flex items-center gap-3">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Image className="w-5 h-5 text-primary" />
        <h1 className="font-display font-bold text-foreground tracking-wide">Private Gallery 📸</h1>
      </header>

      <div className="p-5 max-w-lg mx-auto space-y-5">
        {/* Upload */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <input placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)}
            className="w-full bg-card/60 backdrop-blur-sm rounded-xl px-4 py-3 text-sm border border-border/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground" />

          {/* Visibility Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setVisibility("both")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${visibility === "both" ? "romantic-btn" : "glass-card text-muted-foreground hover:text-foreground"}`}
            >
              <Eye className="w-4 h-4" /> Seen by Both
            </button>
            <button
              onClick={() => setVisibility("only_me")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${visibility === "only_me" ? "romantic-btn" : "glass-card text-muted-foreground hover:text-foreground"}`}
            >
              <EyeOff className="w-4 h-4" /> Only Me
            </button>
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full romantic-btn h-12 font-display font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            <Camera className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          {photos.map((p, i) => (
            <motion.div key={p.id}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i < 8 ? i * 0.05 : 0 }}
              className="relative group rounded-2xl overflow-hidden glass-card shadow-md">
              <img src={p.file_url} alt={p.caption || "Photo"} className="w-full aspect-square object-cover" />
              {/* Privacy badge */}
              <div className="absolute top-2 left-2">
                {p.visibility === "only_me" ? (
                  <span className="bg-foreground/60 text-primary-foreground text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Private
                  </span>
                ) : (
                  <span className="bg-primary/70 text-primary-foreground text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Shared
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="flex-1">
                  {p.caption && <p className="text-xs text-primary-foreground font-medium">{p.caption}</p>}
                  <p className="text-[10px] text-primary-foreground/70">by {p.uploaded_by}</p>
                </div>
                <button onClick={() => deletePhoto(p.id)} className="text-primary-foreground/80 hover:text-primary-foreground">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {photos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Image className="w-14 h-14 mx-auto mb-4 text-primary/20" />
            <p className="font-display font-bold">Your private gallery is empty 📸</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
