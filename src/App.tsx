
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SubmitBet from "./pages/SubmitBet";
import History from "./pages/History";
import Statistics from "./pages/Statistics";
import Users from "./pages/Users";
import CurrentRound from "./pages/CurrentRound";
import Auth from "./pages/Auth";
import FixtureImageReview from "./pages/FixtureImageReview";
import AdminResults from "./pages/AdminResults";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";

const queryClient = new QueryClient();

const App = () => {
  console.log('🔥 [APP] App component is mounting...');
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/submit-bet" element={<SubmitBet />} />
            <Route path="/current-round" element={<CurrentRound />} />
            <Route path="/history" element={<History />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/users" element={<Users />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/support" element={<Support />} />
            <Route path="/admin/fixture-image" element={<FixtureImageReview />} />
            <Route path="/admin/results" element={<AdminResults />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
