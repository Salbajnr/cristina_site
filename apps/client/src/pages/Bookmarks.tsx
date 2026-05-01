import { Sidebar } from "@/components/layout/Sidebar";
import { ContentCard } from "@/components/content/ContentCard";
import { useListContent } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark } from "lucide-react";
import { Link } from "wouter";

const BOOKMARKS_KEY = "cristina_bookmarks";

export function getBookmarks(): number[] {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function toggleBookmark(id: number): boolean {
  const bookmarks = getBookmarks();
  const idx = bookmarks.indexOf(id);
  if (idx === -1) {
    bookmarks.push(id);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    return true;
  } else {
    bookmarks.splice(idx, 1);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    return false;
  }
}

export default function Bookmarks() {
  const { data: allContent, isLoading } = useListContent({});
  const bookmarkedIds = getBookmarks();
  const bookmarked = (allContent ?? []).filter((item) => bookmarkedIds.includes(item.id));

  return (
    <div className="min-h-screen bg-background flex justify-center selection:bg-primary/30">
      <Sidebar />

      <main className="flex-1 max-w-3xl w-full md:ml-20 xl:ml-64 pb-20 md:pb-0 px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Bookmarks</h1>
            <p className="text-muted-foreground text-sm">Content you've saved for later</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
              ))}
            </div>
          ) : bookmarked.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <Bookmark className="w-8 h-8 opacity-30" />
              </div>
              <p className="text-lg font-medium text-foreground">Nothing saved yet</p>
              <p className="text-sm mt-1 max-w-xs">
                Open any post and tap the bookmark icon to save it here.
              </p>
              <Link href="/" className="mt-6 text-primary text-sm font-medium hover:underline">
                Browse content
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{bookmarked.length} saved item{bookmarked.length !== 1 ? "s" : ""}</p>
              <div className="grid grid-cols-2 gap-4">
                {bookmarked.map((item) => (
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
