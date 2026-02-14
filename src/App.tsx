import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUp from "./pages/SignUp";
import Join from "./pages/Join";
import SignIn from "./pages/SignIn";
import Heartbeat from "./pages/Heartbeat";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import TruthOrDare from "./pages/TruthOrDare";
import Gallery from "./pages/Gallery";
import SnapMoment from "./pages/SnapMoment";
import TodoList from "./pages/TodoList";
import Diary from "./pages/Diary";
import Counseling from "./pages/Counseling";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignUp />} />
          <Route path="/join" element={<Join />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/heartbeat" element={<Heartbeat />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/truth-or-dare" element={<TruthOrDare />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/snap" element={<SnapMoment />} />
          <Route path="/todos" element={<TodoList />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/counseling" element={<Counseling />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
