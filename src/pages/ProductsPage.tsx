import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { apiService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthSheet } from "@/components/AuthSheet";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discount: number | null;
  discount_amount?: number | null;
  discount_type?: "percentage" | "amount" | null;
  image_url: string | null;
  image_urls?: string[] | null;
  category: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

export const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("name");
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const location = useLocation();

  const selectedCategory = searchParams.get("category");

  useEffect(() => {
    loadData();
  }, [selectedCategory, sortBy]);

  const loadData = async () => {
    try {
      // Load categories
      const categoriesResponse = await apiService.getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        const cats = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data.map((cat: any) => ({
              id: cat._id || cat.id,
              name: cat.name
            }))
          : [];
        setCategories(cats);
      }

      // Load products
      const productsParams: any = {};
      if (selectedCategory) {
        productsParams.category = selectedCategory; // Now using ID instead of name
      }
      if (sortBy === 'price_low') {
        productsParams.sortBy = 'price';
        productsParams.sortOrder = 'asc';
      } else if (sortBy === 'price_high') {
        productsParams.sortBy = 'price';
        productsParams.sortOrder = 'desc';
      } else {
        productsParams.sortBy = 'name';
        productsParams.sortOrder = 'asc';
      }
      const productsResponse = await apiService.getProducts(productsParams);

      if (productsResponse.success) {
        // Handle different possible data structures
        let products = [];
        if (Array.isArray(productsResponse.data)) {
          products = productsResponse.data;
        } else if (productsResponse.data?.data && Array.isArray(productsResponse.data.data)) {
          products = productsResponse.data.data;
        } else if (productsResponse.data?.products && Array.isArray(productsResponse.data.products)) {
          products = productsResponse.data.products;
        }
        
        // Transform API data to match frontend interface
        const transformedProducts = products.map((product: any) => ({
          id: product._id,
          title: product.name,
          description: product.description,
          price: product.price,
          discount: null,
          discount_amount: null,
          discount_type: null,
          image_url: product.images?.[0]?.url || null,
          image_urls: product.images?.map((img: any) => img.url) || [],
          category: {
            id: product.category?._id || product.category?.id,
            name: product.category?.name || 'Unknown'
          },
          variants: product.variants || []
        }));
        
        setProducts(transformedProducts);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }
    setSearchParams(params);
  };

  const getCartItem = (productId: string) => {
    return items.find(item => item.productId === productId);
  };

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId, 1);
  };

  const handleIncrement = async (productId: string) => {
    const cartItem = getCartItem(productId);
    if (cartItem) {
      await updateQuantity(cartItem._id, cartItem.quantity + 1);
    }
  };

  const handleDecrement = async (productId: string) => {
    const cartItem = getCartItem(productId);
    if (cartItem) {
      if (cartItem.quantity > 1) {
        await updateQuantity(cartItem._id, cartItem.quantity - 1);
      } else {
        // Remove from cart when quantity is 1
        await removeFromCart(cartItem._id);
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header Section with bg-green.png background */}
      <div
        className="relative w-full"
        style={{
          backgroundImage: 'url(/bg-green.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <Header />
      </div>
      {/* Fresh Juices Section with bgWhite.png background */}
      <section 
        className="relative min-h-screen"
        style={{
          backgroundImage: 'url(/bgWhite.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Content */}
        <div className="container mx-auto px-4 md:px-8 pt-32 md:pt-40 pb-16">
          {/* Heading */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {selectedCategory && categories.find(c => c.id === selectedCategory)
                ? (() => {
                    const categoryName = categories.find(c => c.id === selectedCategory)?.name || "";
                    // If category name already ends with "Juices", don't add it again
                    return categoryName.toLowerCase().endsWith("juices") 
                      ? categoryName 
                      : `${categoryName} Juices`;
                  })()
              : "Fresh Juices"
            }
          </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
            Discover our collection of fresh, healthy juices and find your perfect blend.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-900" />
              <span className="text-sm font-medium text-gray-900">Filter by category:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryFilter(null)}
                className={!selectedCategory ? "bg-green-800 text-white hover:bg-green-900" : "bg-green-100 border-green-600 text-green-800 hover:bg-green-200"}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                  onClick={() => handleCategoryFilter(category.id)}
                  className={selectedCategory === category.id ? "bg-green-800 text-white hover:bg-green-900" : "bg-green-100 border-green-600 text-green-800 hover:bg-green-200"}
              >
                {category.name}
              </Button>
            ))}
          </div>

          <div className="md:ml-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-white border-gray-300 text-gray-900">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price_low">Price (Low to High)</SelectItem>
                <SelectItem value="price_high">Price (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

          {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
              <p className="text-white/80">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
            {products.map((product) => {
              const primaryImage = product.image_urls?.[0] || product.image_url || "/api/placeholder/300/300";
                // Use category name or description as tagline
                const tagline = product.category?.name || product.description?.split('.')[0] || "Fresh & Healthy";

              return (
                  <div key={product.id} className="flex flex-col items-center text-center space-y-4 w-full">
                    {/* Product Image */}
                    <div className="relative w-full h-80 md:h-96 overflow-hidden rounded-lg">
                      <img
                        src={primaryImage}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2 w-full">
                      <h3 className="text-xl md:text-2xl font-bold text-white">{product.title}</h3>
                      <p className="text-sm md:text-base text-white/80">{tagline}</p>
                      {(() => {
                        const cartItem = getCartItem(product.id);
                        if (cartItem && cartItem.quantity > 0) {
                          return (
                            <div className="flex items-center justify-center gap-2 mt-4">
                              <Button
                                size="icon"
                                className="bg-green-800 text-white hover:bg-green-900 h-10 w-10 rounded-full"
                                onClick={() => handleDecrement(product.id)}
                              >
                                -
                              </Button>
                              <span className="text-white font-semibold text-lg min-w-[2rem] text-center">
                                {cartItem.quantity}
                              </span>
                              <Button
                                size="icon"
                                className="bg-green-800 text-white hover:bg-green-900 h-10 w-10 rounded-full"
                                onClick={() => handleIncrement(product.id)}
                              >
                                +
                              </Button>
                            </div>
                          );
                        }
                        return (
                          <Button
                            className="w-full mt-4 bg-green-800 text-white hover:bg-green-900 font-semibold"
                            onClick={() => handleAddToCart(product.id)}
                          >
                            ORDER NOW
                          </Button>
                        );
                      })()}
                    </div>
                  </div>
              );
            })}
          </div>
        )}
      </div>
    </section>

    {/* Footer with bg-green.png background */}
    <Footer />

    {/* Auth Sheet */}
    <AuthSheet open={authSheetOpen} onOpenChange={setAuthSheetOpen} defaultMode={authMode} />
  </div>
);
};
