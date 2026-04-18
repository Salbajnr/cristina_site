import { Link, useLocation } from "wouter";
import { 
  Home, 
  Search, 
  MessageCircle, 
  Bookmark, 
  Heart, 
  Bell, 
  Settings, 
  MoreHorizontal,
  Rss
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetProfile } from "@workspace/api-client-react";

export function Sidebar() {
  const [location] = useLocation();
  const { data: profile } = useGetProfile();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Rss, label: "Free Feed", href: "/feed" },
    { icon: Search, label: "Explore", href: "/search" },
    { icon: MessageCircle, label: "Messages", href: "/messages" },
    { icon: Bookmark, label: "Bookmarks", href: "/bookmarks" },
    { icon: Heart, label: "Subscriptions", href: "/subscriptions" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-20 xl:w-64 border-r border-border bg-background/95 backdrop-blur-sm z-40 hidden md:flex flex-col justify-between py-6">
      <div className="flex flex-col items-center xl:items-start px-0 xl:px-6 w-full space-y-8">
        <Link href="/" className="flex items-center gap-3 text-primary transition-opacity hover:opacity-80">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-serif font-bold text-xl italic">
            C
          </div>
          <span className="hidden xl:block font-serif font-semibold text-2xl tracking-wide text-foreground">Cristina</span>
        </Link>

        <nav className="flex flex-col space-y-2 w-full">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.label}
                href={item.href}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "text-primary font-medium" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <div className="relative">
                  <item.icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <span className="absolute -inset-2 bg-primary/20 blur-xl rounded-full z-[-1]" />
                  )}
                </div>
                <span className="hidden xl:block text-lg">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-0 xl:px-6 w-full flex justify-center xl:justify-start">
        <button className="flex items-center gap-3 p-2 xl:p-3 rounded-full xl:rounded-xl hover:bg-white/5 transition-colors w-full">
          <Avatar className="w-10 h-10 border border-primary/30">
            <AvatarImage src={profile?.avatarUrl || "/avatar.png"} className="object-cover" />
            <AvatarFallback>CL</AvatarFallback>
          </Avatar>
          <div className="hidden xl:flex flex-col items-start flex-1 overflow-hidden">
            <span className="text-sm font-medium text-foreground truncate w-full">{profile?.displayName || "Cristina Lucero"}</span>
            <span className="text-xs text-muted-foreground truncate w-full">@{profile?.username || "cristinalucero"}</span>
          </div>
          <MoreHorizontal className="hidden xl:block w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </aside>
  );
}
