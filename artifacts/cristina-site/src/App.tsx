import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ContentDetail from "@/pages/ContentDetail";
import Checkout from "@/pages/Checkout";
import CreatorLogin from "@/pages/creator/Login";
import CreatorDashboard from "@/pages/creator/Dashboard";
import CreatorContent from "@/pages/creator/Content";
import CreatorProfile from "@/pages/creator/Profile";
import CreatorPurchases from "@/pages/creator/Purchases";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/content/:id" component={ContentDetail} />
      <Route path="/checkout" component={Checkout} />
      
      {/* Creator Routes */}
      <Route path="/creator" component={CreatorLogin} />
      <Route path="/creator/login" component={CreatorLogin} />
      <Route path="/creator/dashboard" component={CreatorDashboard} />
      <Route path="/creator/content" component={CreatorContent} />
      <Route path="/creator/profile" component={CreatorProfile} />
      <Route path="/creator/purchases" component={CreatorPurchases} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
