import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ContentDetail from "@/pages/ContentDetail";
import Checkout from "@/pages/Checkout";
import Explore from "@/pages/Explore";
import Messages from "@/pages/Messages";
import Bookmarks from "@/pages/Bookmarks";
import Subscriptions from "@/pages/Subscriptions";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";
import Feed from "@/pages/Feed";
import CreatorLogin from "@/pages/creator/Login";
import CreatorDashboard from "@/pages/creator/Dashboard";
import CreatorContent from "@/pages/creator/Content";
import CreatorProfile from "@/pages/creator/Profile";
import CreatorPurchases from "@/pages/creator/Purchases";
import CreatorInquiries from "@/pages/creator/Inquiries";
import CreatorPosts from "@/pages/creator/Posts";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/content/:id" component={ContentDetail} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/feed" component={Feed} />
      <Route path="/search" component={Explore} />
      <Route path="/messages" component={Messages} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route path="/subscriptions" component={Subscriptions} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/settings" component={Settings} />
      
      {/* Creator Routes */}
      <Route path="/creator" component={CreatorLogin} />
      <Route path="/creator/login" component={CreatorLogin} />
      <Route path="/creator/dashboard" component={CreatorDashboard} />
      <Route path="/creator/content" component={CreatorContent} />
      <Route path="/creator/profile" component={CreatorProfile} />
      <Route path="/creator/purchases" component={CreatorPurchases} />
      <Route path="/creator/inquiries" component={CreatorInquiries} />
      <Route path="/creator/posts" component={CreatorPosts} />
      
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
