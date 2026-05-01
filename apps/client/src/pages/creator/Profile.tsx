import { useState, useEffect } from "react";
import CreatorLayout from "@/components/creator/CreatorLayout";
import { useGetProfile, useUpdateProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetProfileQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function CreatorProfile() {
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    bio: "",
    avatarUrl: "",
    coverUrl: "",
    location: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || "",
        username: profile.username || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || "",
        coverUrl: profile.coverUrl || "",
        location: profile.location || "",
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      { data: formData },
      {
        onSuccess: (updatedProfile) => {
          queryClient.setQueryData(getGetProfileQueryKey(), updatedProfile);
          toast({
            title: "Profile Updated",
            description: "Your profile has been successfully saved.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update profile.",
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <CreatorLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-serif font-medium tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your public creator profile.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>This information will be displayed on your public page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    name="displayName" 
                    value={formData.displayName} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    name="username" 
                    value={formData.username} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleChange} 
                  rows={4}
                  placeholder="Tell your fans about yourself..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  placeholder="e.g. Los Angeles, CA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input 
                  id="avatarUrl" 
                  name="avatarUrl" 
                  value={formData.avatarUrl} 
                  onChange={handleChange} 
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverUrl">Cover Image URL</Label>
                <Input 
                  id="coverUrl" 
                  name="coverUrl" 
                  value={formData.coverUrl} 
                  onChange={handleChange} 
                  placeholder="https://..."
                />
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </CreatorLayout>
  );
}
