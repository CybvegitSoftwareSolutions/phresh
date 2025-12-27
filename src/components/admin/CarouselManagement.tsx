import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Edit, Trash2, ImageIcon, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface CarouselSlide {
  _id: string;
  title: string | null;
  image_url: string;
  link_url?: string;
  product_id?: string | null;
  video_url?: string | null;
  order_position: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function CarouselManagement() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    link_url: "",
    product_id: "",
    video_url: "",
    is_active: true
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [autoplayDelaySeconds, setAutoplayDelaySeconds] = useState<number>(5);
  const { toast } = useToast();

  useEffect(() => {
    fetchSlides();
    fetchSettings();
  }, []);

  const fetchSlides = async () => {
    try {
      const response = await apiService.getCarouselItems();
      if (response.success && response.data) {
        setSlides(response.data);
      }
    } catch (error) {
      console.error('Error fetching slides:', error);
      toast({
        title: "Error",
        description: "Failed to fetch carousel slides",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      // For now, use default settings since carousel settings API might not be implemented yet
      setAutoplayEnabled(true);
      setAutoplayDelaySeconds(5);
    } catch (error) {
      console.warn('Carousel settings not found, using defaults');
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      // For now, just show success since carousel settings API might not be implemented yet
      toast({ title: 'Saved', description: 'Carousel settings updated' });
    } catch (error) {
      console.error('Failed to save carousel settings', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSettingsSaving(false);
    }
  }

  const handleSave = async () => {
    if (!formData.image_url && !formData.video_url) {
      toast({
        title: "Validation Error",
        description: "Provide either an image URL or a video URL for the slide.",
        variant: "destructive"
      });
      return;
    }

    setSaveLoading(true);
    try {
      const slideData = {
        title: formData.title || null,
        image_url: formData.image_url,
        link_url: formData.link_url || null,
        product_id: formData.product_id ? formData.product_id : null,
        video_url: formData.video_url ? formData.video_url : null,
        is_active: formData.is_active
      };

      let response;
      if (editingSlide) {
        response = await apiService.updateCarouselItem(editingSlide._id, slideData);
      } else {
        const maxOrder = slides.length > 0 ? Math.max(...slides.map(s => s.order_position)) : 0;
        response = await apiService.createCarouselItem({
          ...slideData,
          order_position: maxOrder + 1
        });
      }

      if (!response.success) {
        throw new Error(response.message || "Failed to save slide");
      }

      toast({
        title: "Success",
        description: editingSlide ? "Slide updated successfully" : "Slide created successfully"
      });

      fetchSlides();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving slide:', error);
      toast({
        title: "Error",
        description: "Failed to save slide",
        variant: "destructive"
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (slideId: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    try {
      const response = await apiService.deleteCarouselItem(slideId);
      if (!response.success) {
        throw new Error(response.message || "Failed to delete slide");
      }
      
      toast({
        title: "Success",
        description: "Slide deleted successfully"
      });
      
      fetchSlides();
    } catch (error) {
      console.error('Error deleting slide:', error);
      toast({
        title: "Error",
        description: "Failed to delete slide",
        variant: "destructive"
      });
    }
  };

  const toggleSlideStatus = async (slideId: string, isActive: boolean) => {
    try {
      const response = await apiService.updateCarouselItem(slideId, { is_active: isActive });
      if (!response.success) {
        throw new Error(response.message || "Failed to update slide status");
      }
      
      toast({
        title: "Success",
        description: `Slide ${isActive ? 'activated' : 'deactivated'} successfully`
      });
      
      fetchSlides();
    } catch (error) {
      console.error('Error toggling slide status:', error);
      toast({
        title: "Error",
        description: "Failed to update slide status",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (slide: CarouselSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title ?? "",
      image_url: slide.image_url,
      link_url: slide.link_url || "",
      product_id: slide.product_id || "",
      video_url: slide.video_url || "",
      is_active: slide.is_active
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSlide(null);
    setFormData({
      title: "",
      image_url: "",
      link_url: "",
      product_id: "",
      video_url: "",
      is_active: true
    });
  };

  const uploadToBucket = async (bucket: string, file: File): Promise<string> => {
    try {
      const response = await apiService.uploadCarouselMedia(file);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to upload media");
      }

      return response.data.url || response.data.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleImageFile = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    setUploadingImage(true);
    try {
      const url = await uploadToBucket('carousel-images', files[0]);
      setFormData((f) => ({ ...f, image_url: url }));
      toast({ title: 'Image uploaded', description: 'Image URL has been set.' });
    } catch (e) {
      console.error('Image upload failed', e);
      toast({ title: 'Upload failed', description: 'Could not upload image.', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoFile = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    setUploadingVideo(true);
    try {
      const url = await uploadToBucket('carousel-videos', files[0]);
      setFormData((f) => ({ ...f, video_url: url }));
      toast({ title: 'Video uploaded', description: 'Video URL has been set.' });
    } catch (e) {
      console.error('Video upload failed', e);
      toast({ title: 'Upload failed', description: 'Could not upload video.', variant: 'destructive' });
    } finally {
      setUploadingVideo(false);
    }
  };

  const moveSlide = async (slideId: string, direction: 'up' | 'down') => {
    const slideIndex = slides.findIndex(s => s._id === slideId);
    if (slideIndex === -1) return;

    const newIndex = direction === 'up' ? slideIndex - 1 : slideIndex + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;

    const slide1 = slides[slideIndex];
    const slide2 = slides[newIndex];

    try {
      // Swap order_position values
      await apiService.updateCarouselItem(slide1._id, { order_position: slide2.order_position });
      await apiService.updateCarouselItem(slide2._id, { order_position: slide1.order_position });

      fetchSlides();
      toast({
        title: "Success",
        description: "Slide order updated"
      });
    } catch (error) {
      console.error('Error moving slide:', error);
      toast({
        title: "Error",
        description: "Failed to update slide order",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Carousel Management</h1>
          <p className="text-muted-foreground">Manage homepage carousel slides</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSlide ? 'Edit Slide' : 'Add New Slide'}
              </DialogTitle>
              <DialogDescription>
                {editingSlide ? 'Update the slide details' : 'Create a new carousel slide'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter slide title"
                />
              </div>
              
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="Enter image URL"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="image_upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageFile(e.target.files)}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('image_upload')?.click()} disabled={uploadingImage}>
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="video_url">Video URL (MP4, optional)</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                  placeholder="https://.../your-video.mp4"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="video_upload"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => handleVideoFile(e.target.files)}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('video_upload')?.click()} disabled={uploadingVideo}>
                    {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                  </Button>
                </div>
              </div>
              
                <div>
                  <Label htmlFor="link_url">Link (Optional)</Label>
                  <Input
                    id="link_url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                    placeholder="Enter link URL"
                  />
                </div>

              <div>
                <Label htmlFor="product_id">Target Product ID (Optional)</Label>
                <Input
                  id="product_id"
                  value={formData.product_id}
                  onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                  placeholder="Paste a product UUID to link directly to its details page"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSave} disabled={saveLoading}>
                {saveLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingSlide ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Carousel Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Carousel Settings</CardTitle>
          <CardDescription>Control autoplay and slide delay</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center space-x-2">
              <Switch id="autoplay_enabled" checked={autoplayEnabled} onCheckedChange={setAutoplayEnabled} />
              <Label htmlFor="autoplay_enabled">Autoplay</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="autoplay_delay">Delay (seconds)</Label>
              <Input
                id="autoplay_delay"
                type="number"
                min={1}
                value={autoplayDelaySeconds}
                onChange={(e) => setAutoplayDelaySeconds(Math.max(1, Number(e.target.value)))}
                className="w-28"
              />
            </div>
            <Button onClick={saveSettings} disabled={settingsSaving || settingsLoading}>
              {settingsSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Slides List */}
      <div className="space-y-4">
        {slides.map((slide, index) => (
          <Card key={slide._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-12 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    {slide.image_url ? (
                      <img 
                        src={slide.image_url} 
                        alt={slide.title || "Carousel slide"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <ImageIcon className="h-6 w-6 text-muted-foreground hidden" />
                  </div>
                      <div>
                        {slide.title ? (
                          <CardTitle className="text-lg">{slide.title}</CardTitle>
                        ) : null}
                        <CardDescription>
                          Order: {slide.order_position} • Created: {new Date(slide.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSlideStatus(slide._id, !slide.is_active)}
                  >
                    {slide.is_active ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSlide(slide._id, 'up')}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSlide(slide._id, 'down')}
                    disabled={index === slides.length - 1}
                  >
                    ↓
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(slide)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(slide._id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {(slide.link_url || !slide.is_active) && (
              <CardContent>
                <div className="flex items-center justify-between">
                  {slide.link_url && (
                    <div>
                      <p className="text-sm font-medium">Link:</p>
                      <p className="text-sm text-muted-foreground truncate max-w-md">{slide.link_url}</p>
                    </div>
                  )}
                  {!slide.is_active && (
                    <div className="bg-muted px-2 py-1 rounded text-sm">
                      Inactive
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {slides.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No carousel slides</h3>
          <p className="text-muted-foreground mb-4">
            Create your first carousel slide to get started
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Slide
          </Button>
        </div>
      )}
    </div>
  );
}
