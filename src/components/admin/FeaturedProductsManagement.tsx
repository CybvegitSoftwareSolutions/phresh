import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Star, Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Product {
  _id: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  is_featured?: boolean;
}

export function FeaturedProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch all products
      const response = await apiService.getAllProducts();
      console.log('All products response:', response);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch products");
      }

      // Handle different possible data structures
      // API response: { success: true, data: { success: true, data: [...] } }
      let productsData = [];
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (response.data?.products && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      }
      
      console.log('Extracted products data:', productsData);
      
      // Transform products to match component interface
      const allProducts = (Array.isArray(productsData) ? productsData : []).map((p: any) => ({
        _id: p._id || p.id,
        name: p.name || p.title || 'Unknown Product',
        price: p.price || 0,
        // Map image from images array or image_url field
        image_url: p.images?.[0]?.url || p.image_url || p.image || null,
        // Map category from category object or string
        category: p.category?.name || p.category || null,
        is_featured: p.isFeatured === true || p.is_featured === true,
        isFeatured: p.isFeatured === true || p.is_featured === true
      }));

      console.log('Transformed products:', allProducts);

      // Separate featured and non-featured products
      // Check both is_featured (snake_case) and isFeatured (camelCase)
      const featured = allProducts.filter((p: any) => p.is_featured === true || p.isFeatured === true);
      const nonFeatured = allProducts.filter((p: any) => !(p.is_featured === true || p.isFeatured === true));

      console.log('Featured products:', featured);
      console.log('Non-featured products:', nonFeatured);

      setFeaturedProducts(featured);
      setProducts(nonFeatured);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching products:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch products";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addToFeatured = async (productId: string) => {
    try {
      const response = await apiService.toggleFeaturedProducts(productId, true);
      if (!response.success) {
        throw new Error(response.message || "Failed to add product to featured");
      }

      toast({
        title: "Success",
        description: "Product added to featured products"
      });

      fetchProducts();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding to featured:', error);
      toast({
        title: "Error",
        description: "Failed to add product to featured",
        variant: "destructive"
      });
    }
  };

  const removeFromFeatured = async (productId: string) => {
    if (!confirm('Are you sure you want to remove this product from featured?')) return;

    try {
      const response = await apiService.toggleFeaturedProducts(productId, false);
      if (!response.success) {
        throw new Error(response.message || "Failed to remove product from featured");
      }

      toast({
        title: "Success",
        description: "Product removed from featured products"
      });

      fetchProducts();
    } catch (error) {
      console.error('Error removing from featured:', error);
      toast({
        title: "Error",
        description: "Failed to remove product from featured",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(product =>
    (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Error Loading Products</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchProducts()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Featured Products</h1>
          <p className="text-muted-foreground">Manage products displayed on the homepage</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Featured Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Featured Product</DialogTitle>
              <DialogDescription>
                Select a product to add to the featured products section
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Products List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name || 'Unknown Product'}</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-muted-foreground">£{product.price || 0}</p>
                          {product.category && (
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => addToFeatured(product._id)}
                      size="sm"
                    >
                      Add to Featured
                    </Button>
                  </div>
                ))}
                
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {searchTerm ? "No products found matching your search" : "No products available to feature"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Featured Products Display */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Star className="h-5 w-5 mr-2 text-yellow-500" />
          Current Featured Products ({featuredProducts.length})
        </h2>
        
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredProducts.map((product) => (
              <Card key={product._id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name || 'Product image'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{product.name || 'Unknown Product'}</CardTitle>
                        <CardDescription>£{product.price || 0}</CardDescription>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromFeatured(product._id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                {product.category && (
                  <CardContent>
                    <Badge variant="outline">
                      {product.category}
                    </Badge>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No featured products</h3>
            <p className="text-muted-foreground mb-4">
              Add products to the featured section to highlight them on your homepage
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Featured Product
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}