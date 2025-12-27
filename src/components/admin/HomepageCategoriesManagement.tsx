import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Edit, MoveUp, MoveDown, Eye, EyeOff } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export const HomepageCategoriesManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    order: 0,
    image_url: "",
    description: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getHomepageCategories();
      console.log('Homepage categories API response:', response);
      if (response.success && response.data) {
        // Handle different possible data structures
        const categoriesData = response.data.categories || response.data.data || response.data;
        const categories = Array.isArray(categoriesData) ? categoriesData : [];
        
        console.log('Raw categories data:', categories);
        console.log('Number of categories:', categories.length);
        
        // Transform categories to match expected structure
        const transformedCategories = categories.map((cat: any) => ({
          _id: cat._id || cat.id,
          name: cat.name || '',
          slug: cat.slug || '',
          description: cat.description || cat.homepage_description || '',
          homepage_image_url: cat.homepage_image_url || cat.image_url || cat.image || null,
          homepage_description: cat.homepage_description || cat.description || '',
          // Map order from homepageOrder or sortOrder or order
          order: cat.homepageOrder || cat.order || cat.sortOrder || 0,
          // Check for both camelCase (showOnHomepage) and snake_case (show_on_homepage) from API
          show_on_homepage: cat.showOnHomepage !== undefined ? cat.showOnHomepage : 
                           (cat.show_on_homepage !== undefined ? cat.show_on_homepage : false),
          createdAt: cat.createdAt || cat.created_at || '',
          updatedAt: cat.updatedAt || cat.updated_at || ''
        }));
        
        console.log('Transformed categories:', transformedCategories);
        const homepageCount = transformedCategories.filter(c => c.show_on_homepage).length;
        const otherCount = transformedCategories.filter(c => !c.show_on_homepage).length;
        console.log(`Homepage categories: ${homepageCount}, Other categories: ${otherCount}`);
        
        setCategories(transformedCategories);
      } else {
        console.error('API response error:', response);
        throw new Error(response.message || "Failed to fetch homepage categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;

    try {
      // Backend expects homepageOrder (camelCase), send both for compatibility
      const response = await apiService.updateHomepageCategories(editingCategory._id, {
        homepageOrder: formData.order,
        order: formData.order, // Fallback for snake_case support
        image_url: formData.image_url || null,
        description: formData.description || null,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to update category");
      }

      toast({
        title: "Success",
        description: "Category homepage settings updated successfully",
      });

      fetchCategories();
      setIsDialogOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const toggleHomepageVisibility = async (categoryId: string, currentStatus: boolean) => {
    try {
      // Backend expects showOnHomepage (camelCase), send both for compatibility
      const response = await apiService.updateHomepageCategories(categoryId, {
        showOnHomepage: !currentStatus,
        show_on_homepage: !currentStatus // Fallback for snake_case support
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to update category visibility");
      }
      
      fetchCategories();
      toast({
        title: "Success",
        description: `Category ${!currentStatus ? 'added to' : 'removed from'} homepage`,
      });
    } catch (error) {
      console.error("Error toggling homepage visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update category visibility",
        variant: "destructive",
      });
    }
  };

  const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const category = categories.find(c => c._id === categoryId);
    if (!category) return;

    const homepageCategories = categories.filter(c => c.show_on_homepage);
    const currentIndex = homepageCategories.findIndex(c => c._id === categoryId);
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === homepageCategories.length - 1)
    ) {
      return;
    }

    const newOrder = direction === 'up' ? category.order - 1 : category.order + 1;
    const swapCategory = homepageCategories.find(c => c.order === newOrder);

    try {
      // Update both categories - send homepageOrder (camelCase) to match backend
      if (swapCategory) {
        await apiService.updateHomepageCategories(category._id, { 
          homepageOrder: swapCategory.order,
          order: swapCategory.order 
        });
        await apiService.updateHomepageCategories(swapCategory._id, { 
          homepageOrder: category.order,
          order: category.order 
        });
      } else {
        await apiService.updateHomepageCategories(categoryId, { 
          homepageOrder: newOrder,
          order: newOrder 
        });
      }

      fetchCategories();
    } catch (error) {
      console.error("Error moving category:", error);
      toast({
        title: "Error",
        description: "Failed to reorder category",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      order: category.order,
      image_url: category.image_url || "",
      description: category.description || "",
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter categories based on homepage visibility
  // Categories with show_on_homepage: true go to homepage section
  // Categories with show_on_homepage: false go to available section
  const homepageCategories = categories.filter(c => c.show_on_homepage === true);
  const otherCategories = categories.filter(c => c.show_on_homepage === false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Homepage Categories</h2>
        <p className="text-muted-foreground">
          Manage which categories appear on the homepage and their display order
        </p>
      </div>

      {/* Homepage Categories */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Categories on Homepage</h3>
        {homepageCategories.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No categories are currently displayed on homepage</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {homepageCategories
              .sort((a, b) => a.order - b.order)
              .map((category, index) => (
                <Card key={category._id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveCategory(category._id, 'up')}
                            disabled={index === 0}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveCategory(category._id, 'down')}
                            disabled={index === homepageCategories.length - 1}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          <h4 className="font-semibold">{category.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Order: {category.order}
                          </p>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleHomepageVisibility(category._id, true)}
                          title="Hide from homepage"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Other Categories */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Categories</h3>
        {otherCategories.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {categories.length === 0 
                  ? "No categories available" 
                  : "All categories are displayed on homepage"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherCategories.map((category) => (
              <Card key={category._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleHomepageVisibility(category._id, false)}
                        title="Show on homepage"
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit Homepage Settings - {editingCategory?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description to show on homepage"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCategory}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
