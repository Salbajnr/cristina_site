import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ContentCard } from "@/components/content/ContentCard";
import { useListContent } from "@workspace/api-client-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Image, Video, Package, Grid } from "lucide-react";

export default function Explore() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const typeMap: Record<string, "photo" | "video" | "bundle" | undefined> = {
    photos: "photo",
    videos: "video",
    bundles: "bundle",
    all: undefined,
  };
  const type = typeMap[activeTab];

  const { data: contentItems, isLoading } = useListContent({ type: type as any });

  const filtered = (contentItems ?? []).filter((item) =>
    query.trim() === "" ||
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    (item.description ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex justify-center selection:bg-primary/30">
      <Sidebar />

      <main className="flex-1 max-w-3xl w-full md:ml-20 xl:ml-64 pb-20 md:pb-0 px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Explore</h1>
            <p className="text-muted-foreground text-sm">Browse all of Cristina's content</p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search photos, videos, bundles..."
              className="pl-12 py-6 text-base bg-white/5 border-border/50 focus:border-primary/50 rounded-2xl"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border border-border/50 p-1 rounded-xl w-full grid grid-cols-4">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
                <Grid className="w-4 h-4" /> All
              </TabsTrigger>
              <TabsTrigger value="photos" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
                <Image className="w-4 h-4" /> Photos
              </TabsTrigger>
              <TabsTrigger value="videos" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
                <Video className="w-4 h-4" /> Videos
              </TabsTrigger>
              <TabsTrigger value="bundles" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
                <Package className="w-4 h-4" /> Bundles
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-1">Try a different search term or category</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>
              <div className="grid grid-cols-2 gap-4">
                {filtered.map((item) => (
                  <ContentCard key={item.id} content={item} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
