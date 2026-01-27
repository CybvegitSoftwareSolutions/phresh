import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, Plus, Edit2, Trash2, Upload, X, Image as ImageIcon, Home, CheckCircle2, XCircle } from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image?: string | null;
  image_url?: string | null;
  isActive: boolean;
  sortOrder: number;
  showOnHomepage: boolean;
  homepageOrder: number;
  parentCategory?: string | null;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export const CategoriesManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null as File | null,
    imagePreview: "" as string | null,
    isActive: true,
    sortOrder: 0,
    showOnHomepage: false,
    homepageOrder: 0,
    parentCategory: "",
    seoTitle: "",
    seoDescription: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllCategories();
      console.log('Categories response:', response);
      if (response.success && response.data) {
        // Handle nested data structure: response.data.data contains the array
        const categoriesData = response.data.data?.data || response.data.data || response.data.categories || response.data;
        const categories = Array.isArray(categoriesData) ? categoriesData : [];
        
        // Use the categories directly from API response
        setCategories(categories);
      } else {
        throw new Error(response.message || "Failed to fetch categories");
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    try {
      // Validate required fields
      if (!formData.name || formData.name.length < 2 || formData.name.length > 50) {
        toast({
          title: "Validation Error",
          description: "Category name must be between 2 and 50 characters",
          variant: "destructive"
        });
        return;
      }

      if (formData.description && formData.description.length > 500) {
        toast({
          title: "Validation Error",
          description: "Description must be less than 500 characters",
          variant: "destructive"
        });
        return;
      }

      if (formData.seoTitle && formData.seoTitle.length > 60) {
        toast({
          title: "Validation Error",
          description: "SEO Title must be less than 60 characters",
          variant: "destructive"
        });
        return;
      }

      if (formData.seoDescription && formData.seoDescription.length > 160) {
        toast({
          title: "Validation Error",
          description: "SEO Description must be less than 160 characters",
          variant: "destructive"
        });
        return;
      }

      let response;
      if (editingCategory) {
        // For editing, we'll keep using the old API for now
        response = await apiService.updateCategory(editingCategory._id, {
          name: formData.name,
          description: formData.description,
        });
      } else {
        // For creating, use the new multipart/form-data API
        const categoryData: any = {
          name: formData.name,
          description: formData.description || undefined,
          isActive: formData.isActive,
          sortOrder: formData.sortOrder,
          showOnHomepage: formData.showOnHomepage,
          homepageOrder: formData.homepageOrder,
          seoTitle: formData.seoTitle || undefined,
          seoDescription: formData.seoDescription || undefined,
        };

        if (formData.image) {
          categoryData.image = formData.image;
        }
        if (formData.parentCategory) {
          categoryData.parentCategory = formData.parentCategory;
        }

        response = await apiService.createCategory(categoryData);
      }

      if (!response.success) {
        throw new Error(response.message || "Failed to save category");
      }

      toast({
        title: "Success",
        description: `Category ${editingCategory ? 'updated' : 'created'} successfully`
      });

      setDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive"
      });
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await apiService.deleteCategory(id);
      if (!response.success) {
        throw new Error(response.message || "Failed to delete category");
      }

      toast({
        title: "Success",
        description: "Category deleted successfully"
      });

      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      image: null,
      imagePreview: category.image || category.image_url || null,
      isActive: category.isActive !== undefined ? category.isActive : true,
      sortOrder: category.sortOrder || 0,
      showOnHomepage: category.showOnHomepage || false,
      homepageOrder: category.homepageOrder || 0,
      parentCategory: category.parentCategory || "",
      seoTitle: category.seoTitle || "",
      seoDescription: category.seoDescription || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      image: null,
      imagePreview: null,
      isActive: true,
      sortOrder: 0,
      showOnHomepage: false,
      homepageOrder: 0,
      parentCategory: "",
      seoTitle: "",
      seoDescription: "",
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const removeImage = () => {
    setFormData({
      ...formData,
      image: null,
      imagePreview: null,
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Categories Management</h2>
          <p className="text-muted-foreground">Organize your products by categories</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="shadow-luxury">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Required Fields */}
              <div className="space-y-2">
                <Label htmlFor="name">Category Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Category name (2-50 characters)"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">{formData.name.length}/50 characters</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category description (max 500 characters)"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">{formData.description.length}/500 characters</p>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Category Image</Label>
                {formData.imagePreview ? (
                  <div className="relative">
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      Upload Image
                    </Button>
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="homepageOrder">Homepage Order</Label>
                  <Input
                    id="homepageOrder"
                    type="number"
                    value={formData.homepageOrder}
                    onChange={(e) => setFormData({ ...formData, homepageOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Parent Category */}
              <div className="space-y-2">
                <Label htmlFor="parentCategory">Parent Category (Optional)</Label>
                <Select
                  value={formData.parentCategory || undefined}
                  onValueChange={(value) => setFormData({ ...formData, parentCategory: value === "none" ? "" : value })}
                >
                  <SelectTrigger id="parentCategory">
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories
                      .filter((cat) => cat._id !== editingCategory?._id)
                      .map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Active</Label>
                    <p className="text-xs text-muted-foreground">Category will be visible to customers</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showOnHomepage">Show on Homepage</Label>
                    <p className="text-xs text-muted-foreground">Display this category on the homepage</p>
                  </div>
                  <Switch
                    id="showOnHomepage"
                    checked={formData.showOnHomepage}
                    onCheckedChange={(checked) => setFormData({ ...formData, showOnHomepage: checked })}
                  />
                </div>
              </div>

              {/* SEO Fields */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">SEO Settings</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    placeholder="SEO title (max 60 characters)"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">{formData.seoTitle.length}/60 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoDescription">SEO Description</Label>
                  <Textarea
                    id="seoDescription"
                    value={formData.seoDescription}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    placeholder="SEO description (max 160 characters)"
                    rows={2}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">{formData.seoDescription.length}/160 characters</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCategory}>
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const CategoryCardItem = () => {
            const [imageError, setImageError] = useState(false);
            const imageUrl = category.image || category.image_url;
            
            return (
              <Card className="shadow-soft hover:shadow-luxury transition-shadow overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Category Image - Left Side */}
                  <div className="relative w-full md:w-64 h-48 md:h-auto bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {imageUrl && !imageError ? (
                      <img
                        src={imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="flex items-center justify-center">
                        <FolderOpen className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content - Right Side */}
                  <div className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                            {category.isActive ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                            {category.showOnHomepage && (
                              <Badge variant="outline">
                                <Home className="h-3 w-3 mr-1" />
                                On Homepage
                              </Badge>
                            )}
                          </div>
                </div>
                        <div className="flex space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(category)}
                            title="Edit category"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCategory(category._id)}
                            title="Delete category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                {category.description || "No description"}
              </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs">Sort Order:</span>
                          <p className="font-medium">{category.sortOrder || 0}</p>
                        </div>
                        {category.showOnHomepage && (
                          <div>
                            <span className="text-muted-foreground text-xs">Homepage Order:</span>
                            <p className="font-medium">{category.homepageOrder || 0}</p>
                          </div>
                        )}
                        {category.parentCategory ? (
                          <div>
                            <span className="text-muted-foreground text-xs">Parent Category:</span>
                            <p className="font-medium">Has Parent</p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-muted-foreground text-xs">Parent Category:</span>
                            <p className="font-medium">None</p>
                          </div>
                        )}
                        {category.slug && (
                          <div>
                            <span className="text-muted-foreground text-xs">Slug:</span>
                            <p className="font-mono text-xs truncate" title={category.slug}>
                              {category.slug}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground text-xs">Created:</span>
                          <p className="font-medium">{new Date(category.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Updated:</span>
                          <p className="font-medium">{new Date(category.updatedAt).toLocaleDateString()}</p>
                        </div>
              </div>
            </CardContent>
                  </div>
                </div>
          </Card>
            );
          };
          
          return <CategoryCardItem key={category._id} />;
        })}
        
        {categories.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Categories Yet</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first product category</p>
            <Button onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Category
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};