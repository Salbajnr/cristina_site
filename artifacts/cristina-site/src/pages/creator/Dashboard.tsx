import { useGetSiteStats, useListPurchases } from "@workspace/api-client-react";
import CreatorLayout from "@/components/creator/CreatorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Users, 
  Image as ImageIcon, 
  Video, 
  Library, 
  DollarSign, 
  CreditCard,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";

export default function CreatorDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetSiteStats();
  const { data: purchases, isLoading: purchasesLoading } = useListPurchases();

  const totalEarnings = purchases?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return (
    <CreatorLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-medium tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your creator platform.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" className="hidden sm:flex border-border/50">
                View Public Site
              </Button>
            </Link>
            <Link href="/creator/content">
              <Button>Add Content</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {purchasesLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {purchasesLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{purchases?.length || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Content</CardTitle>
              <Library className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalContent || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Subscribers</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.subscriberCount || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Recent Purchases</CardTitle>
              <Link href="/creator/purchases">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {purchasesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : purchases && purchases.length > 0 ? (
                <div className="space-y-4">
                  {purchases.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-sm">{p.contentTitle}</p>
                        <p className="text-xs text-muted-foreground">{p.customerEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No purchases yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Content Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <ImageIcon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">Photos</span>
                    </div>
                    <span className="text-lg font-semibold">{stats?.totalPhotos || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-secondary/10">
                        <Video className="h-4 w-4 text-secondary" />
                      </div>
                      <span className="font-medium">Videos</span>
                    </div>
                    <span className="text-lg font-semibold">{stats?.totalVideos || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-accent/10">
                        <Library className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <span className="font-medium">Bundles</span>
                    </div>
                    <span className="text-lg font-semibold">{stats?.totalBundles || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </CreatorLayout>
  );
}
