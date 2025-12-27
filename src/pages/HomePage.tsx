import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ShoppingCart, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/components/ui/use-toast";
import { computeDiscountedPrice } from "@/utils/pricing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  variants?: ProductVariant[];
}

type ProductVariant = {
  product_id?: string;
  size: string;
  price: number;
};

interface CarouselItem {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  product_id?: string | null;
  video_url?: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  homepage_image_url: string | null;
  homepage_description: string | null;
}

interface CategoryWithProducts extends Category {
  products: Product[];
}

export const HomePage = () => {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [carouselDelayMs, setCarouselDelayMs] = useState<number>(5000);
  const [carouselAutoplay, setCarouselAutoplay] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("name");
  const { addToCart } = useCart();

  useEffect(() => {
    loadData();
  }, [selectedCategoryId, sortBy]);

  const loadData = async () => {
    try {
      console.log("🏠 Loading homepage data...");
      
      // Load carousel items
      console.log("📸 Loading carousel items...");
      const carouselResponse = await apiService.getCarouselItems();
      console.log("📸 Carousel response:", carouselResponse);
      if (carouselResponse.success && carouselResponse.data) {
        const mappedItems = Array.isArray(carouselResponse.data) 
          ? carouselResponse.data
              .filter((item: any) => item.isActive !== false) // Filter active items
              .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)) // Sort by order
              .map((item: any) => ({
                id: item._id || item.id,
                title: item.title || item.subtitle || null,
                image_url: item.image_url || item.image,
                link_url: item.link_url,
                product_id: item.product_id,
                video_url: item.video_url
              }))
          : [];
        setCarouselItems(mappedItems);
      }

      // Load categories - only show categories that are marked for homepage display
      console.log("📂 Loading homepage categories...");
      const categoriesResponse = await apiService.getHomepageCategories();
      console.log("📂 Categories response:", categoriesResponse);
      
      if (categoriesResponse.success && categoriesResponse.data) {
        const categoriesData = categoriesResponse.data.categories || categoriesResponse.data.data || categoriesResponse.data;
        const cats = Array.isArray(categoriesData) 
          ? categoriesData
              .filter((cat: any) => {
                // Only show categories that are active AND marked for homepage
                const isActive = cat.isActive !== false;
                const showOnHomepage = cat.showOnHomepage === true || cat.show_on_homepage === true;
                return isActive && showOnHomepage;
              })
              .sort((a: any, b: any) => {
                // Sort by homepageOrder first, then by sortOrder
                const orderA = a.homepageOrder || a.order || a.sortOrder || 0;
                const orderB = b.homepageOrder || b.order || b.sortOrder || 0;
                return orderA - orderB;
              })
              .map((cat: any) => ({
                id: cat._id || cat.id,
                name: cat.name,
                description: cat.description || null,
                homepage_image_url: cat.homepage_image_url || cat.image || cat.image_url || null,
                homepage_description: cat.homepage_description || cat.description || null
              }))
          : [];
        console.log("📂 Homepage categories data:", cats);
        setCategories(cats);
      }

      // Load all products
      console.log("🛍️ Loading all products...");
      const productsParams: any = {};
      if (selectedCategoryId) {
        productsParams.category = selectedCategoryId;
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
      console.log("🛍️ Products response:", productsResponse);
      
      if (productsResponse.success && productsResponse.data) {
        // Handle different possible data structures
        let productsData = [];
        if (Array.isArray(productsResponse.data)) {
          productsData = productsResponse.data;
        } else if (productsResponse.data?.data && Array.isArray(productsResponse.data.data)) {
          productsData = productsResponse.data.data;
        } else if (productsResponse.data?.products && Array.isArray(productsResponse.data.products)) {
          productsData = productsResponse.data.products;
        }
        
        console.log("🛍️ Products array:", productsData);
        
        // Get list of homepage category IDs for filtering products
        const homepageCategoryIds = categories.map(c => c.id);
        
        // Transform API data to match frontend interface
        const transformedProducts = productsData
          .filter((p: any) => {
            // Filter active products
            if (p.isActive === false) return false;
            
            // If we have homepage categories and no specific category is selected,
            // only show products from categories that are visible on homepage
            if (homepageCategoryIds.length > 0 && !selectedCategoryId) {
              const productCategoryId = p.category?._id || p.category?.id || p.category;
              return homepageCategoryIds.includes(productCategoryId);
            }
            
            // If a specific category is selected, show all products from that category
            // (even if category is not on homepage - user explicitly selected it)
            return true;
          })
          .map((product: any) => ({
            id: product._id || product.id,
            title: product.name || product.title,
            description: product.description || product.shortDescription || '',
            price: product.price || 0,
            discount: product.discount || null,
            discount_amount: product.discount_amount || null,
            discount_type: product.discount_type || null,
            image_url: product.image_url || product.images?.[0]?.url || null,
            image_urls: product.image_urls || product.images?.map((img: any) => img.url || img) || [product.image_url].filter(Boolean),
            category: {
              name: product.category?.name || 'Unknown'
            },
            variants: product.variants || []
          }));
        
        console.log("🛍️ Transformed products:", transformedProducts);
        setProducts(transformedProducts);
      } else {
        console.warn("⚠️ Products response not successful:", productsResponse);
      }
    } catch (error) {
      console.error("❌ Error loading homepage data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId, 1);
  };

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Hero Carousel */}
      {carouselItems.length > 0 && (
        <section className="relative">
          {carouselItems.length === 1 ? (
            <div className="relative h-96 md:h-[500px] lg:h-[600px] overflow-hidden">
              {(() => {
                const item = carouselItems[0];
                if (item.video_url) {
                  return (
                    <video
                      src={item.video_url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      autoPlay
                    />
                  );
                }
                return (
                  <img
                    src={item.image_url || "/api/placeholder/1200/600"}
                    alt={item.title || "Carousel image"}
                    className="w-full h-full object-contain bg-black md:object-cover"
                  />
                );
              })()}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white drop-shadow-lg">
                  {carouselItems[0].title && (
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">{carouselItems[0].title}</h1>
                  )}
                  {(carouselItems[0].product_id || carouselItems[0].link_url) && (
                    <Button size="lg" className="gradient-luxury" asChild>
                      {carouselItems[0].product_id ? (
                        <Link to={`/products/${carouselItems[0].product_id}`}>Shop Now</Link>
                      ) : carouselItems[0].link_url?.startsWith('/') ? (
                        <Link to={carouselItems[0].link_url}>Shop Now</Link>
                      ) : (
                        <a href={carouselItems[0].link_url!} target="_blank" rel="noopener noreferrer">Shop Now</a>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Carousel
              className="w-full"
              opts={{ loop: true }}
              autoPlay={carouselAutoplay}
              autoPlayInterval={carouselDelayMs}
              setApi={(api) => {
                try {
                  if (!api) return;
                  const syncVideo = () => {
                    const selected = api.selectedScrollSnap();
                    const nodes = api.slideNodes();
                    nodes.forEach((node: Element, i: number) => {
                      const v = node.querySelector('video') as HTMLVideoElement | null;
                      if (!v) return;
                      if (i === selected) {
                        v.play().catch(() => { });
                      } else {
                        try { v.pause(); v.currentTime = 0; } catch { }
                      }
                    });
                  };
                  api.on('select', syncVideo);
                  api.on('reInit', syncVideo);
                  // Initial sync
                  syncVideo();
                } catch { }
              }}
            >
              <CarouselContent>
                {carouselItems.map((item) => (
                  <CarouselItem key={item.id}>
                    <div className="relative h-96 md:h-[500px] lg:h-[600px] overflow-hidden">
                      {item.video_url ? (
                        <video
                          src={item.video_url}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={item.image_url || "/api/placeholder/1200/600"}
                          alt={item.title || "Carousel image"}
                          className="w-full h-full object-contain bg-black md:object-cover"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white drop-shadow-lg">
                          {item.title && (
                            <h1 className="text-4xl md:text-6xl font-bold mb-4">{item.title}</h1>
                          )}
                          {(item.product_id || item.link_url) && (
                            <Button size="lg" className="gradient-luxury" asChild>
                              {item.product_id ? (
                                <Link to={`/products/${item.product_id}`}>Shop Now</Link>
                              ) : item.link_url?.startsWith('/') ? (
                                <Link to={item.link_url}>Shop Now</Link>
                              ) : (
                                <a href={item.link_url!} target="_blank" rel="noopener noreferrer">Shop Now</a>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          )}
        </section>
      )}

      {/* All Products Section */}
      <div className="container py-8 bg-white">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter by category:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={!selectedCategoryId ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryFilter(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategoryId === category.id ? "default" : "outline"}
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

        {/* Products Grid */}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
