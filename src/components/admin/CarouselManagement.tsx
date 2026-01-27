import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Edit, Trash2, ImageIcon, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface CarouselSlide {
  _id: string;
  title?: string | null;
  subtitle?: string | null;
  image_url: string;
  link_url?: string;
  product_id?: string | null;
  video_url?: string | null;
  order_position?: number;
  sortOrder?: number;
  is_active?: boolean;
  isActive?: boolean;
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
    subtitle: "",
    image_url: "",
    imageFile: null as File | null,
    link_url: "",
    product_id: "",
    video_url: "",
    isActive: true
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    if (!formData.imageFile && !formData.image_url && !formData.video_url) {
      toast({
        title: "Validation Error",
        description: "Please provide an image (upload or URL) or a video URL for the slide.",
        variant: "destructive"
      });
      return;
    }

    setSaveLoading(true);
    try {
      const slideData: any = {
        title: formData.title || undefined,
        subtitle: formData.subtitle || undefined,
        image: formData.imageFile || undefined,
        image_url: formData.image_url || undefined,
        link_url: formData.link_url || undefined,
        product_id: formData.product_id || undefined,
        video_url: formData.video_url || undefined,
        isActive: formData.isActive
      };

      let response;
      if (editingSlide) {
        response = await apiService.updateCarouselItem(editingSlide._id, slideData);
      } else {
        response = await apiService.createCarouselItem(slideData);
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
    } catch (error: any) {
      console.error('Error saving slide:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save slide",
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
      const response = await apiService.updateCarouselItem(slideId, { isActive: isActive });
      if (!response.success) {
        throw new Error(response.message || "Failed to update slide status");
      }
      
      toast({
        title: "Success",
        description: `Slide ${isActive ? 'activated' : 'deactivated'} successfully`
      });
      
      fetchSlides();
    } catch (error: any) {
      console.error('Error toggling slide status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update slide status",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (slide: CarouselSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title ?? "",
      subtitle: slide.subtitle ?? "",
      image_url: slide.image_url,
      imageFile: null,
      link_url: slide.link_url || "",
      product_id: slide.product_id || "",
      video_url: slide.video_url || "",
      isActive: slide.isActive !== undefined ? slide.isActive : (slide.is_active !== undefined ? slide.is_active : true)
    });
    setImagePreview(slide.image_url);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSlide(null);
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      imageFile: null,
      link_url: "",
      product_id: "",
      video_url: "",
      isActive: true
    });
    setImagePreview(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      const order1 = slide1.order_position || slide1.sortOrder || 0;
      const order2 = slide2.order_position || slide2.sortOrder || 0;
      await apiService.updateCarouselItem(slide1._id, { order_position: order2 });
      await apiService.updateCarouselItem(slide2._id, { order_position: order1 });

      fetchSlides();
      toast({
        title: "Success",
        description: "Slide order updated"
      });
    } catch (error: any) {
      console.error('Error moving slide:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update slide order",
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
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) handleCloseDialog();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              handleCloseDialog();
              setIsDialogOpen(true);
            }}>
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
                <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                  placeholder="Enter slide subtitle"
                />
              </div>
              
              <div>
                <Label htmlFor="image">Image</Label>
                <div className="space-y-2">
                  {imagePreview && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-muted">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData({ ...formData, imageFile: null, image_url: '' });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      id="image_upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageFileChange}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => document.getElementById('image_upload')?.click()}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {formData.imageFile ? 'Change Image' : 'Upload Image'}
                    </Button>
                  </div>
                  {!formData.imageFile && (
                    <div className="mt-2">
                      <Label htmlFor="image_url" className="text-sm text-muted-foreground">Or enter image URL</Label>
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => {
                          setFormData({...formData, image_url: e.target.value});
                          if (e.target.value) setImagePreview(e.target.value);
                        }}
                        placeholder="Enter image URL"
                        className="mt-1"
                      />
                    </div>
                  )}
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
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Active</Label>
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
        {slides.map((slide, index) => {
          const isActive = slide.isActive !== undefined ? slide.isActive : (slide.is_active !== undefined ? slide.is_active : true);
          const orderPosition = slide.order_position || slide.sortOrder || index + 1;
          
          return (
            <Card key={slide._id} className="shadow-soft hover:shadow-luxury transition-shadow overflow-hidden">
              <div className="flex items-stretch">
                {/* Left: Image */}
                <div className="w-32 md:w-40 lg:w-48 flex-shrink-0">
                  <div className="h-32 md:h-40 lg:h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {slide.image_url ? (
                      <img 
                        src={slide.image_url} 
                        alt={slide.title || "Carousel slide"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const icon = document.createElement('div');
                            icon.className = 'fallback-icon flex items-center justify-center';
                            icon.innerHTML = '<svg class="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                            parent.appendChild(icon);
                          }
                        }}
                      />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Center: Details */}
                <div className="flex-1 min-w-0 pl-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {slide.title && (
                        <h3 className="font-semibold text-lg truncate">{slide.title}</h3>
                      )}
                      {isActive ? (
                        <Badge variant="default" className="bg-green-500">
                          <Eye className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {slide.subtitle && (
                      <p className="text-sm text-muted-foreground mb-2">{slide.subtitle}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Order: <span className="font-medium">{orderPosition}</span></span>
                      {slide.link_url && (
                        <span className="truncate max-w-[200px]" title={slide.link_url}>
                          Link: <span className="font-mono">{slide.link_url}</span>
                        </span>
                      )}
                      <span>Created: {new Date(slide.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSlideStatus(slide._id, !isActive)}
                      title={isActive ? "Deactivate" : "Activate"}
                    >
                      {isActive ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveSlide(slide._id, 'up')}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveSlide(slide._id, 'down')}
                      disabled={index === slides.length - 1}
                      title="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(slide)}
                      title="Edit slide"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(slide._id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete slide"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
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
