import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { getSession } from "@/lib/couple-store";

const Heartbeat = () => {
  const navigate = useNavigate();
  const session = getSession();
  const [phase, setPhase] = useState<"move" | "heart" | "done">("move");

  useEffect(() => {
    if (!session) { navigate("/signin"); return; }
    const t1 = setTimeout(() => setPhase("heart"), 1800);
    const t2 = setTimeout(() => setPhase("done"), 3600);
    const t3 = setTimeout(() => navigate("/dashboard"), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center soft-gradient overflow-hidden">
      {/* Floating decorative hearts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: [0, 0.15, 0], y: -200 }}
            transition={{ duration: 4, delay: i * 0.6, repeat: Infinity }}
            className="absolute text-primary/20"
            style={{ left: `${15 + i * 14}%`, bottom: 0 }}>
            <Heart className="w-6 h-6" fill="currentColor" />
          </motion.div>
        ))}
      </div>

      <div className="relative w-full max-w-md h-64 flex items-center justify-center">
        <AnimatePresence>
          {phase === "move" && (
            <>
              <motion.div key="girl"
                initial={{ x: -200, opacity: 0 }} animate={{ x: -20, opacity: 1 }}
                exit={{ opacity: 0 }} transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute text-7xl">👧</motion.div>
              <motion.div key="boy"
                initial={{ x: 200, opacity: 0 }} animate={{ x: 20, opacity: 1 }}
                exit={{ opacity: 0 }} transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute text-7xl">👦</motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(phase === "heart" || phase === "done") && (
            <motion.div key="heart"
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-5">
              <Heart className="w-28 h-28 text-primary animate-heartbeat" fill="hsl(340, 72%, 58%)" />
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-display font-bold romantic-gradient-text tracking-wide">
                Connected with love 💕
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Heartbeat;
