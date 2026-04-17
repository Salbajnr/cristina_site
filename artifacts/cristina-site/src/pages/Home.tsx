import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { ContentCard } from "@/components/content/ContentCard";
import { 
  useGetProfile, 
  useGetSiteStats, 
  useListContent
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Video, Grid, Lock, MapPin, Calendar, Heart, Share } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const { data: profile, isLoading: isProfileLoading } = useGetProfile();
  const { data: stats } = useGetSiteStats();
  
  const typeMap: Record<string, "photo" | "video" | "bundle"> = {
    photos: "photo",
    videos: "video",
    bundles: "bundle",
  };
  const type = typeMap[activeTab];

  const { data: contentItems, isLoading: isContentLoading } = useListContent({ 
    type: type as any
  });

  return (
    <div className="min-h-screen bg-background flex justify-center selection:bg-primary/30">
      <Sidebar />
      
      <main className="flex-1 max-w-3xl w-full md:ml-20 xl:ml-64 pb-20 md:pb-0">
        {/* Header / Cover */}
        <div className="relative">
          <div className="h-48 md:h-64 lg:h-80 w-full relative overflow-hidden bg-muted">
            {profile?.coverUrl || true ? (
              <img 
                src={profile?.coverUrl || "/cover.png"} 
                alt="Cover" 
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/20 to-background" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
          </div>

          <div className="absolute top-4 right-4 flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full bg-black/20 backdrop-blur-md border-white/10 hover:bg-white/10 text-white">
              <Share className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full bg-black/20 backdrop-blur-md border-white/10 hover:bg-white/10 text-white">
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-4 md:px-6 relative -top-16 md:-top-20 z-10">
          <div className="flex justify-between items-end mb-4">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-xl">
              <AvatarImage src={profile?.avatarUrl || "/avatar.png"} className="object-cover" />
              <AvatarFallback className="text-4xl">CL</AvatarFallback>
            </Avatar>
            <div className="flex gap-2 lg:hidden">
              <Button className="rounded-full bg-primary hover:bg-primary/90 text-white px-6">
                Subscribe
              </Button>
            </div>
          </div>

          {isProfileLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full mt-4" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground flex items-center gap-2">
                  {profile?.displayName || "Cristina Lucero"}
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-sans tracking-wide">VERIFIED</span>
                </h1>
                <p className="text-muted-foreground">@{profile?.username || "cristinalucero"}</p>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {profile?.location && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {profile?.location}</span>
                )}
                {profile?.joinedDate && (
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {formatDate(profile.joinedDate)}</span>
                )}
              </div>

              <p className="text-foreground/90 leading-relaxed font-light text-lg">
                {profile?.bio || "Welcome to my private world. Exclusive photos, videos, and behind the scenes content you won't find anywhere else."}
              </p>

              <div className="flex items-center gap-6 py-4 border-b border-border/50">
                <div className="flex flex-col items-center">
                  <span className="font-serif text-xl font-bold text-foreground">{formatNumber(stats?.totalPhotos || 0)}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Photos</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-serif text-xl font-bold text-foreground">{formatNumber(stats?.totalVideos || 0)}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Videos</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-serif text-xl font-bold text-foreground">{formatNumber(stats?.subscriberCount || 0)}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Fans</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Feed */}
        <div className="px-4 md:px-6 pb-12">
          <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto bg-transparent h-auto p-0 border-b border-border/50 rounded-none mb-6 no-scrollbar">
              <TabsTrigger 
                value="all" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Grid className="w-4 h-4 mr-2" /> All Posts
              </TabsTrigger>
              <TabsTrigger 
                value="photos" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Image className="w-4 h-4 mr-2" /> Photos
              </TabsTrigger>
              <TabsTrigger 
                value="videos" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Video className="w-4 h-4 mr-2" /> Videos
              </TabsTrigger>
              <TabsTrigger 
                value="bundles" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Bundles
              </TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {isContentLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
                ))
              ) : contentItems?.length ? (
                contentItems.map(item => (
                  <ContentCard key={item.id} content={item} />
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium text-foreground">No posts found</p>
                  <p className="text-sm">This category doesn't have any content yet.</p>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </main>

      <RightSidebar />
    </div>
  );
}
