import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { apiService } from "@/services/api";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

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

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId, 1);
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <Header />

      <div className="container py-8">
        <div className="gradient-luxury p-12 text-center shadow-luxury rounded-lg mb-8">
          <h1 className="text-4xl font-bold mb-4 text-primary-foreground">
            {selectedCategory && categories.find(c => c.id === selectedCategory)
              ? `${categories.find(c => c.id === selectedCategory)?.name} Juices`
              : "Fresh Juices"
            }
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Discover our collection of fresh, healthy juices and find your perfect blend.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter by category:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryFilter(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryFilter(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          <div className="md:ml-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
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

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
            {products.map((product) => {
              const primaryImage = product.image_urls?.[0] || product.image_url || "/api/placeholder/300/300";
              const secondaryImage = product.image_urls?.[1] || primaryImage;
              const pricing = computeDiscountedPrice(product);
              const formattedFinalPrice = pricing.finalPrice.toLocaleString('en-IN');
              const formattedSavings = pricing.hasDiscount
                ? Math.round(pricing.savings).toLocaleString('en-IN')
                : null;
              const badgeText =
                pricing.discountType === "amount" ? "Sale" : pricing.discountLabel;

              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="block h-full w-[338px] flex-shrink-0 snap-start md:w-full md:flex-shrink md:snap-normal"
                >
                  <Card className="group flex h-[500px] min-h-[500px] flex-col overflow-hidden hover:shadow-elegant transition-shadow duration-300">
                    <div className="relative h-[360px] overflow-hidden">
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
                        <Badge className="absolute top-3 left-3 gradient-luxury">
                          {badgeText}
                        </Badge>
                      )}
                    </div>

                    <CardContent className="flex h-[120px] flex-col justify-between gap-2 p-4">
                      <h3 className="font-bold text-base group-hover:text-primary transition-colors leading-snug h-[48px] overflow-hidden">
                        {product.title}
                      </h3>

                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                        <span className="text-base font-semibold text-primary">Rs {formattedFinalPrice}</span>
                        {pricing.hasDiscount && (
                          <>
                            <span className="text-xs text-muted-foreground line-through">
                              Rs {pricing.basePrice.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </span>
                            {formattedSavings && (
                              <span className="text-xs font-medium text-emerald-600">Save Rs {formattedSavings}</span>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="mt-auto pt-0 px-4 pb-4">
                      <Button
                        className="w-full"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddToCart(product.id);
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>

                // <Link
                //   key={product.id}
                //   to={`/products/${product.id}`}
                //   className="block h-full w-[338px] flex-shrink-0 snap-start md:w-full md:flex-shrink md:snap-normal"
                // >
                //   <Card className="group flex h-[430px] min-h-[430px] flex-col overflow-hidden hover:shadow-elegant transition-shadow duration-300">
                //     <div className="relative h-[310px] overflow-hidden">
                //       <img
                //         src={primaryImage}
                //         alt={product.title}
                //         className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                //       />
                //       <img
                //         src={secondaryImage}
                //         alt={product.title}
                //         className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                //       />
                //       {product.discount > 0 && (
                //         <Badge className="absolute top-3 left-3 gradient-luxury">
                //           -{product.discount}%
                //         </Badge>
                //       )}
                //     </div>

                //     <CardContent className="flex flex-1 flex-col gap-3 p-5">
                //       <h3 className="font-bold text-base group-hover:text-primary transition-colors">
                //         {product.title}
                //       </h3>

                //       <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                //         <span className="text-base font-semibold text-primary">Rs {formattedFinalPrice}</span>
                //         {hasDiscount && (
                //           <>
                //             <span className="text-xs text-muted-foreground line-through">Rs {basePrice.toFixed(2)}</span>
                //             <span className="text-xs font-medium text-emerald-600">Save Rs {formattedSavings}</span>
                //           </>
                //         )}
                //       </div>
                //     </CardContent>

                //     <CardFooter className="pt-0 px-5 pb-5">
                //       <Button
                //         className="w-full"
                //         onClick={(e) => {
                //           e.preventDefault();
                //           e.stopPropagation();
                //           handleAddToCart(product.id);
                //         }}
                //       >
                //         <ShoppingCart className="h-4 w-4 mr-2" />
                //         Add to Cart
                //       </Button>
                //     </CardFooter>
                //   </Card>
                // </Link>
                // <Card
                //   key={product.id}
                //   className="group mx-auto flex h-[430px] min-h-[430px] w-full max-w-[338px] flex-col overflow-hidden hover:shadow-elegant transition-shadow duration-300 border-2 border-amber-300/40"
                // >
                //   <Link to={`/products/${product.id}`} className="block">
                //     <div className="relative h-[310px] overflow-hidden">
                //       <img
                //         src={primaryImage}
                //         alt={product.title}
                //         className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                //       />
                //       <img
                //         src={secondaryImage}
                //         alt={product.title}
                //         className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                //       />
                //       {product.discount > 0 && (
                //         <Badge className="absolute top-3 left-3 gradient-luxury">
                //           -{product.discount}%
                //         </Badge>
                //       )}
                //     </div>
                //   </Link>

                //   <CardContent className="flex flex-1 flex-col gap-3 p-5">
                //     <h3 className="font-bold text-base group-hover:text-primary transition-colors">
                //       <Link to={`/products/${product.id}`}>
                //         {product.title}
                //       </Link>
                //     </h3>

                //     <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                //       <span className="text-base font-semibold text-primary">Rs {finalPrice.toFixed(2)}</span>
                //       {product.discount > 0 && (
                //         <>
                //           <span className="text-xs text-muted-foreground line-through">Rs {basePrice.toFixed(2)}</span>
                //           <span className="text-xs font-medium text-emerald-600">Save Rs {savings.toFixed(2)}</span>
                //         </>
                //       )}
                //     </div>
                //   </CardContent>

                //   <CardFooter className="pt-0 px-5 pb-5">
                //     <Button
                //       className="w-full"
                //       onClick={(e) => {
                //         e.preventDefault();
                //         e.stopPropagation();
                //         handleAddToCart(product.id);
                //       }}
                //     >
                //       <ShoppingCart className="h-4 w-4 mr-2" />
                //       Add to Cart
                //     </Button>
                //   </CardFooter>
                // </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
