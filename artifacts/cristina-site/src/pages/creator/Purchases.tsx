import CreatorLayout from "@/components/creator/CreatorLayout";
import { useListPurchases } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreatorPurchases() {
  const { data: purchases, isLoading } = useListPurchases();

  return (
    <CreatorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-medium tracking-tight">Purchases</h1>
          <p className="text-muted-foreground mt-1">View all transactions from your content.</p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : purchases && purchases.length > 0 ? (
              <div className="rounded-md border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(purchase.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">{purchase.contentTitle}</TableCell>
                        <TableCell>{purchase.customerEmail}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            {purchase.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(purchase.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border rounded-md border-dashed border-border/50">
                <p>No purchases found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
  );
}
