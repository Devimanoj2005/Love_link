import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Heart } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center soft-gradient">
      <div className="text-center space-y-4">
        <Heart className="w-16 h-16 mx-auto text-primary/30" />
        <h1 className="text-5xl font-display font-bold romantic-gradient-text">404</h1>
        <p className="text-lg text-muted-foreground font-medium">Oops! This page doesn't exist 💔</p>
        <a href="/" className="inline-block romantic-btn px-6 py-3 font-display font-bold">
          Return Home 💕
        </a>
      </div>
    </div>
  );
};

export default NotFound;
