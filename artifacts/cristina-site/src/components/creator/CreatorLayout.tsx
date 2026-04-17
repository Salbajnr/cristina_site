import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { isAuthenticated, clearCreatorToken } from "@/lib/auth";
import { useGetProfile } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  User, 
  CreditCard, 
  Globe, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface CreatorLayoutProps {
  children: ReactNode;
}

export default function CreatorLayout({ children }: CreatorLayoutProps) {
  const [location, setLocation] = useLocation();
  const { data: profile } = useGetProfile();

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/creator/login");
    }
  }, [location, setLocation]);

  if (!isAuthenticated()) {
    return null; // Will redirect
  }

  const handleLogout = () => {
    clearCreatorToken();
    setLocation("/creator/login");
  };

  const navItems = [
    { href: "/creator/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/creator/content", label: "Content", icon: ImageIcon },
    { href: "/creator/purchases", label: "Purchases", icon: CreditCard },
    { href: "/creator/profile", label: "Profile", icon: User },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarImage src={profile?.avatarUrl || ""} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {profile?.displayName?.charAt(0) || "C"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">{profile?.displayName || "Creator"}</p>
            <p className="text-xs text-muted-foreground mt-1">Dashboard</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${isActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'hover:bg-muted'}`}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-2">
        <Link href="/">
          <Button variant="outline" className="w-full justify-start border-border/50">
            <Globe className="mr-2 h-4 w-4" />
            View Public Site
          </Button>
        </Link>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 fixed h-full z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatarUrl || ""} />
              <AvatarFallback>C</AvatarFallback>
            </Avatar>
            <span className="font-serif font-medium">{profile?.displayName || "Creator"}</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-border">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
