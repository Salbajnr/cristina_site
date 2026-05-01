import { useState } from "react";
import CreatorLayout from "@/components/creator/CreatorLayout";
import { 
  useListContent, 
  useDeleteContent, 
  useUpdateContent, 
  useCreateContent,
  useListCategories,
  getListContentQueryKey,
  getGetSiteStatsQueryKey
} from "@workspace/api-client-react";
import type { ContentItem, ContentItemType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, Image as ImageIcon, Video, Library, Star, Lock } from "lucide-react";

export default function CreatorContent() {
  const { data: content, isLoading } = useListContent();
  const { data: categories } = useListCategories();
  const deleteContent = useDeleteContent();
  const updateContent = useUpdateContent();
  const createContent = useCreateContent();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "photo" as ContentItemType,
    price: "",
    previewUrl: "",
    isLocked: true,
    isFeatured: false,
    categoryId: "none",
    tags: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "photo" as ContentItemType,
      price: "",
      previewUrl: "",
      isLocked: true,
      isFeatured: false,
      categoryId: "none",
      tags: "",
    });
    setEditingItem(null);
  };

  const handleOpenAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: ContentItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      type: item.type,
      price: (item.price / 100).toString(),
      previewUrl: item.previewUrl,
      isLocked: item.isLocked,
      isFeatured: item.isFeatured,
      categoryId: item.categoryId?.toString() || "none",
      tags: item.tags?.join(", ") || "",
    });
    setIsFormOpen(true);
  };

  const confirmDelete = (id: number) => {
    setItemToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    
    deleteContent.mutate(
      { id: itemToDelete },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListContentQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSiteStatsQueryKey() });
          toast({ title: "Content deleted" });
          setIsDeleteDialogOpen(false);
          setItemToDelete(null);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error deleting content" });
        }
      }
    );
  };

  const handleToggleStatus = (id: number, field: 'isLocked' | 'isFeatured', currentValue: boolean) => {
    updateContent.mutate(
      { id, data: { [field]: !currentValue } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListContentQueryKey() });
        }
      }
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      title: formData.title,
      description: formData.description || undefined,
      type: formData.type,
      price: Math.round(parseFloat(formData.price || "0") * 100),
      previewUrl: formData.previewUrl,
      isLocked: formData.isLocked,
      isFeatured: formData.isFeatured,
      categoryId: formData.categoryId !== "none" ? parseInt(formData.categoryId) : undefined,
      tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
    };

    if (editingItem) {
      updateContent.mutate(
        { id: editingItem.id, data: submitData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListContentQueryKey() });
            toast({ title: "Content updated successfully" });
            setIsFormOpen(false);
          },
          onError: () => {
            toast({ variant: "destructive", title: "Error updating content" });
          }
        }
      );
    } else {
      createContent.mutate(
        { data: submitData as any },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListContentQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetSiteStatsQueryKey() });
            toast({ title: "Content created successfully" });
            setIsFormOpen(false);
          },
          onError: () => {
            toast({ variant: "destructive", title: "Error creating content" });
          }
        }
      );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return <ImageIcon className="w-3 h-3 mr-1" />;
      case 'video': return <Video className="w-3 h-3 mr-1" />;
      case 'bundle': return <Library className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <CreatorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-medium tracking-tight">Content Manager</h1>
            <p className="text-muted-foreground mt-1">Manage photos, videos, and bundles.</p>
          </div>
          <Button onClick={handleOpenAddForm}>
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card/50 border border-border/50 rounded-lg overflow-hidden backdrop-blur-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-16"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="w-12 h-12 rounded bg-muted overflow-hidden flex items-center justify-center">
                        {item.previewUrl ? (
                          <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium truncate max-w-[200px]">{item.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {item.categoryName || "Uncategorized"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {getTypeIcon(item.type)}
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={item.isLocked} 
                            onCheckedChange={() => handleToggleStatus(item.id, 'isLocked', item.isLocked)}
                          />
                          <Label className="text-xs flex items-center cursor-pointer">
                            <Lock className="w-3 h-3 mr-1" /> Locked
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={item.isFeatured} 
                            onCheckedChange={() => handleToggleStatus(item.id, 'isFeatured', item.isFeatured)}
                          />
                          <Label className="text-xs flex items-center cursor-pointer text-amber-500">
                            <Star className="w-3 h-3 mr-1" /> Featured
                          </Label>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditForm(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => confirmDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!content?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No content items found. Add some content to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Content Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/50">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Content' : 'Add New Content'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(val) => setFormData({...formData, type: val as ContentItemType})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photo">Photo</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="bundle">Bundle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (USD)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    required 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    placeholder="e.g. 19.99"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(val) => setFormData({...formData, categoryId: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories?.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preview Image URL</Label>
                <Input 
                  required 
                  value={formData.previewUrl} 
                  onChange={e => setFormData({...formData, previewUrl: e.target.value})} 
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input 
                  value={formData.tags} 
                  onChange={e => setFormData({...formData, tags: e.target.value})} 
                  placeholder="photoshoot, exclusive, behind the scenes"
                />
              </div>

              <div className="flex items-center gap-6 p-4 border border-border/50 rounded-lg bg-background/50">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.isLocked} 
                    onCheckedChange={(val) => setFormData({...formData, isLocked: val})}
                  />
                  <Label className="cursor-pointer">Requires Purchase (Locked)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.isFeatured} 
                    onCheckedChange={(val) => setFormData({...formData, isFeatured: val})}
                  />
                  <Label className="cursor-pointer">Feature on Homepage</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createContent.isPending || updateContent.isPending}>
                  {(createContent.isPending || updateContent.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingItem ? 'Save Changes' : 'Create Content'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the content item from your platform.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleteContent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CreatorLayout>
  );
}
