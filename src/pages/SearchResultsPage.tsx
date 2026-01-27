import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { apiService } from "@/services/api";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { computeDiscountedPrice } from "@/utils/pricing";

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
    name: string;
  };
}

export const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const { addToCart } = useCart();
  const { toast } = useToast();

  const loadSearchResults = async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.searchProducts(query, { limit: 50 });
      
      if (response.success) {
        // Handle different possible data structures
        let products = [];
        if (Array.isArray(response.data)) {
          products = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          products = response.data.data;
        } else if (response.data?.products && Array.isArray(response.data.products)) {
          products = response.data.products;
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
            name: product.category?.name || 'Unknown'
          },
          variants: product.variants || []
        }));
        
        setProducts(transformedProducts);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to search products. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching products:', error);
      toast({
        title: "Error",
        description: "Failed to search products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
    loadSearchResults(query);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product.id, 1);
  };

  const currentQuery = searchParams.get('q') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Results</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fragrances..."
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {currentQuery && (
            <p className="text-gray-600 mt-4">
              {loading ? 'Searching...' : `${products.length} results found for "${currentQuery}"`}
            </p>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-4">Searching products...</p>
          </div>
        ) : !currentQuery ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Start your search</h2>
            <p className="text-gray-600">Enter a product name to find your perfect fragrance</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No products found</h2>
            <p className="text-gray-600">Try adjusting your search terms or browse our categories</p>
            <Link to="/products" className="inline-block mt-4">
              <Button>Browse All Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const pricing = computeDiscountedPrice(product);
              const primaryImage = product.image_urls?.[0] || product.image_url || "/placeholder.svg";
              const secondaryImage = product.image_urls?.[1] || primaryImage;
              const savings = pricing.hasDiscount ? Math.round(pricing.savings) : 0;
              const badgeText =
                pricing.discountType === "amount" ? "Sale" : pricing.discountLabel;

              return (
                <Card key={product.id} className="group flex h-full flex-col overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <Link to={`/products/${product.id}`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={primaryImage}
                        alt={product.title}
                        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                      />
                      <img
                        src={secondaryImage}
                        alt={product.title}
                        className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />
                      {pricing.hasDiscount && badgeText && (
                        <Badge className="absolute top-3 left-3 gradient-luxury">{badgeText}</Badge>
                      )}
                    </div>
                  </Link>

                  <CardContent className="flex flex-1 flex-col gap-2 p-4">
                    <div className="space-y-2">
                      <Link to={`/products/${product.id}`}>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {product.title}
                        </CardTitle>
                      </Link>
                    </div>

                    <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                      <span className="text-base font-semibold text-primary">
                        £{pricing.finalPrice.toLocaleString('en-IN')}
                      </span>
                      {pricing.hasDiscount && (
                        <>
                          <span className="text-xs text-muted-foreground line-through">
                            £{pricing.basePrice.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </span>
                          {savings > 0 && (
                            <span className="text-xs font-medium text-emerald-600">
                              Save £{savings.toLocaleString('en-IN')}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 px-4 pb-4">
                    <Button 
                      onClick={() => handleAddToCart(product)}
                      className="w-full"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};
