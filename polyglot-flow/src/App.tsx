import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Exercises from "./pages/Exercises";
import ExerciseSession from "./pages/ExerciseSession";
import HistoriaSelection from "./pages/HistoriaSelection";
import Video from "./pages/Video";
import VideoPlayer from "./pages/VideoPlayer";
import Anki from "./pages/Anki";
import Conversation from "./pages/Conversation";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import { ProtectedRoute, PublicRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Rotas Públicas (apenas se não estiver logado) */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Rotas Protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/exercises" element={<Exercises />} />
              <Route path="/historia" element={<HistoriaSelection />} />
              <Route path="/exercises/:type/:id" element={<ExerciseSession />} />
              <Route path="/video" element={<Video />} />
              <Route path="/video/:videoId" element={<VideoPlayer />} />
              <Route path="/anki" element={<Anki />} />
              <Route path="/conversation" element={<Conversation />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
