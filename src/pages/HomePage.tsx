import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ShoppingCart, Filter, Droplet, Building2, Truck, Zap, Mail, Instagram } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { computeDiscountedPrice } from "@/utils/pricing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/Header";
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

export const HomePage = () => {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [carouselDelayMs, setCarouselDelayMs] = useState<number>(5000);
  const [carouselAutoplay, setCarouselAutoplay] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("name");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    loadData();
  }, [selectedCategoryId, sortBy]);

  // Scroll to top on mount and when location changes
  useEffect(() => {
    // Scroll to top immediately
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Also scroll after a small delay to ensure it works
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

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
              .filter((item: any) => item.isActive !== false)
              .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
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

      // Load featured products for Best Sellers section
      console.log("⭐ Loading featured products...");
      const featuredResponse = await apiService.getFeaturedProducts({ limit: 3 });
      if (featuredResponse.success && featuredResponse.data) {
        const featuredData = featuredResponse.data.data || featuredResponse.data.products || featuredResponse.data || [];
        const transformed = Array.isArray(featuredData)
          ? featuredData.slice(0, 3).map((product: any) => ({
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
            }))
          : [];
        setFeaturedProducts(transformed);
      }

      // Load categories
      console.log("📂 Loading homepage categories...");
      const categoriesResponse = await apiService.getHomepageCategories();
      console.log("📂 Categories response:", categoriesResponse);
      
      if (categoriesResponse.success && categoriesResponse.data) {
        const categoriesData = categoriesResponse.data.categories || categoriesResponse.data.data || categoriesResponse.data;
        const cats = Array.isArray(categoriesData) 
          ? categoriesData
              .filter((cat: any) => {
                const isActive = cat.isActive !== false;
                const showOnHomepage = cat.showOnHomepage === true || cat.show_on_homepage === true;
                return isActive && showOnHomepage;
              })
              .sort((a: any, b: any) => {
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

      // Load all products for the products section
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
        let productsData = [];
        if (Array.isArray(productsResponse.data)) {
          productsData = productsResponse.data;
        } else if (productsResponse.data?.data && Array.isArray(productsResponse.data.data)) {
          productsData = productsResponse.data.data;
        } else if (productsResponse.data?.products && Array.isArray(productsResponse.data.products)) {
          productsData = productsResponse.data.products;
        }
        
        const homepageCategoryIds = categories.map(c => c.id);
        
        const transformedProducts = productsData
          .filter((p: any) => {
            if (p.isActive === false) return false;
            
            if (homepageCategoryIds.length > 0 && !selectedCategoryId) {
              const productCategoryId = p.category?._id || p.category?.id || p.category;
              return homepageCategoryIds.includes(productCategoryId);
            }
            
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
            
        setProducts(transformedProducts);
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

  const getCartItem = (productId: string) => {
    return items.find(item => item.productId === productId);
  };

  const handleIncrement = async (productId: string) => {
    const cartItem = getCartItem(productId);
    if (cartItem) {
      await updateQuantity(cartItem._id, cartItem.quantity + 1);
    } else {
      await addToCart(productId, 1);
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

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setNewsletterLoading(true);
    try {
      // You can add newsletter subscription API call here
      toast({
        title: "Success!",
        description: "Thank you for subscribing to our newsletter!",
      });
      setNewsletterEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setNewsletterLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header />
      
      {/* Hero Section - with dark green background */}
      <section 
        className="relative py-8 md:py-12"
        style={{
          backgroundImage: 'url(/bg-green.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Hero Text */}
            <div className="text-white space-y-6 z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Fuel Your Day the Phresh Way
              </h1>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                Cold-pressed juices. Wellness boosters. Cleanses & community vibes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/products">
                  <Button size="lg" className="bg-green-800 text-white hover:bg-green-900 font-semibold w-full sm:w-auto">
                    Order Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Hero Carousel */}
            <div className="relative z-10">
              <div className="relative h-80 md:h-96 lg:h-[500px] rounded-lg overflow-hidden">
                  {carouselItems.length > 0 ? (
                    <Carousel
                      opts={{
                        align: "start",
                        loop: true,
                      }}
                      autoPlay={carouselAutoplay}
                      autoPlayInterval={carouselDelayMs}
                      className="w-full h-full"
                    >
                      <CarouselContent className="h-full">
                        {carouselItems.map((item) => (
                          <CarouselItem key={item.id} className="h-full">
                            <div className="relative w-full h-full">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.title || "Phresh Juice"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src="/placeholder.svg"
                                  alt="Phresh Juice"
                                  className="w-full h-full object-cover bg-white/10"
                                />
                              )}
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                  ) : featuredProducts.length > 0 && featuredProducts[0]?.image_url ? (
                    <img
                      src={featuredProducts[0].image_url}
                      alt={featuredProducts[0].title || "Phresh Juice"}
                      className="w-full h-full object-cover"
                    />
                  ) : products.length > 0 && products[0]?.image_url ? (
                    <img
                      src={products[0].image_url}
                      alt={products[0].title || "Phresh Juice"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src="/placeholder.svg"
                      alt="Phresh Juice"
                      className="w-full h-full object-cover bg-white/10"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
      </section>

      {/* About Phresh Section - with bgWhite.png background */}
      <section 
        className="py-16 md:py-24 relative"
        style={{
          backgroundImage: 'url(/bgWhite.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="space-y-6 text-left">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-left">About Phresh</h2>
                <div className="w-20 h-1 bg-primary mb-6"></div>
              </div>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed text-left">
                Phresh is all about clean living and nutrient-packed juices, served with that fresh energy. 
                From stress-busting blends to detox cleanses and wellness shots, we make feeling good look fresh. 
                Experience the power of cold-pressed goodness delivered straight to your door.
              </p>
            </div>

            {/* Right Side - Juice Image */}
            <div className="relative h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden shadow-lg">
              {featuredProducts.length > 0 && featuredProducts[0]?.image_url ? (
                <img
                  src={featuredProducts[0].image_url}
                  alt="Phresh Juices"
                  className="w-full h-full object-cover"
                />
              ) : products.length > 0 && products[0]?.image_url ? (
                <img
                  src={products[0].image_url}
                  alt="Phresh Juices"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src="/placeholder.svg"
                  alt="Phresh Juices"
                  className="w-full h-full object-cover bg-gray-100"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Section - with bg-green.png background */}
      <section 
        className="py-16 md:py-24 relative mt-8"
        style={{
          backgroundImage: 'url(/bg-green.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">Our Best Sellers</h2>
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {featuredProducts.map((product) => {
                const primaryImage = product.image_urls?.[0] || product.image_url || "/api/placeholder/300/300";
                // Use category name or description as tagline
                const tagline = product.category?.name || product.description?.split('.')[0] || "Fresh & Healthy";

                return (
                  <div key={product.id} className="flex flex-col items-center text-center space-y-4 w-full max-w-full">
                    {/* Product Image - Clickable */}
                    <Link to={`/products/${product.id}`} className="relative w-full h-80 md:h-96 overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
                        <img
                          src={primaryImage}
                          alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      </Link>

                    {/* Product Info */}
                    <div className="space-y-2 w-full px-2">
                      <Link to={`/products/${product.id}`} className="block hover:text-green-200 transition-colors">
                        <h3 className="text-xl md:text-2xl font-bold text-white line-clamp-2">{product.title}</h3>
                      </Link>
                      <p className="text-sm md:text-base text-white/80 line-clamp-2">{tagline}</p>
                      {(() => {
                        const cartItem = getCartItem(product.id);
                        if (cartItem && cartItem.quantity > 0) {
                          return (
                            <div className="flex items-center justify-center gap-2 mt-4">
                              <Button
                                size="icon"
                                className="bg-green-800 text-white hover:bg-green-900 h-10 w-10 rounded-full"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDecrement(product.id);
                                }}
                              >
                                -
                              </Button>
                              <span className="text-white font-semibold text-lg min-w-[2rem] text-center">
                                {cartItem.quantity}
                              </span>
                              <Button
                                size="icon"
                                className="bg-green-800 text-white hover:bg-green-900 h-10 w-10 rounded-full"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleIncrement(product.id);
                                }}
                              >
                                +
                              </Button>
                        </div>
                          );
                        }
                        return (
                        <Button
                            className="w-full mt-4 bg-green-800 text-white hover:bg-green-900 font-semibold"
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(product.id);
                            }}
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
          ) : (
            <div className="text-center py-12">
              <p className="text-white/80">Featured products coming soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Phresh Section - with bgWhite.png background */}
      <section 
        className="py-16 md:py-24 relative"
        style={{
          backgroundImage: 'url(/bgWhite.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">Why Choose Phresh?</h2>
            <p className="text-lg md:text-xl text-gray-700 text-center mb-8">What sets Phresh apart from the rest?</p>
            
            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-900 font-medium">Locally cold pressed</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-900 font-medium">Hand packed</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-900 font-medium">Organically inspired</p>
              </div>
            </div>

            {/* Story Content */}
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <p className="text-base md:text-lg">
                We have been making juices in Manchester since 2023, after travelling Europe and South America we returned to rainy Manchester craving that quench of a cold pressed juice in the suburbs. Unfortunately the cold pressed juice scene is way behind the rest of the world, instead we are offered a rainbow of teeth rotting solutions.
              </p>
              
              <p className="text-base md:text-lg font-semibold text-gray-900">
                SO, we are here to introduce real natural juices to be indulged at any time of the day, even replacing whole food meals.
              </p>
              
              <p className="text-base md:text-lg">
                At Phresh we believe in small quantity, but aspire to extremely high grade quality.
              </p>
              
              <p className="text-base md:text-lg">
                Our aim is to introduce juicing to the world. To share our opinions, combinations of juices, whole food meals and an overall less toxic approach to all aspects of life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* All Products Section - with bg-green.png background */}
      <section 
        className="py-16 relative mt-8"
        style={{
          backgroundImage: 'url(/bg-green.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-white">Shop All Products</h2>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Filter by category:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedCategoryId ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryFilter(null)}
                className={!selectedCategoryId ? "bg-green-800 text-white hover:bg-green-900" : "bg-green-700/50 border-green-600 text-white hover:bg-green-700"}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryFilter(category.id)}
                  className={selectedCategoryId === category.id ? "bg-green-800 text-white hover:bg-green-900" : "bg-green-700/50 border-green-600 text-white hover:bg-green-700"}
                >
                  {category.name}
                    </Button>
              ))}
            </div>

            <div className="md:ml-auto">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-white/90 border-white/30 text-gray-900">
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
          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/80">No products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => {
                      const primaryImage = product.image_urls?.[0] || product.image_url || "/api/placeholder/300/300";
                // Use category name or description as tagline
                const tagline = product.category?.name || product.description?.split('.')[0] || "Fresh & Healthy";

                      return (
                  <div key={product.id} className="flex flex-col items-center text-center space-y-4 w-full max-w-full">
                    {/* Product Image - Clickable */}
                    <Link to={`/products/${product.id}`} className="relative w-full h-80 md:h-96 overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
                              <img
                                src={primaryImage}
                                alt={product.title}
                        className="w-full h-full object-cover"
                      />
                            </Link>

                    {/* Product Info */}
                    <div className="space-y-2 w-full px-2">
                      <Link to={`/products/${product.id}`} className="block hover:text-green-200 transition-colors">
                        <h3 className="text-xl md:text-2xl font-bold text-white line-clamp-2">{product.title}</h3>
                      </Link>
                      <p className="text-sm md:text-base text-white/80 line-clamp-2">{tagline}</p>
                      {(() => {
                        const cartItem = getCartItem(product.id);
                        if (cartItem && cartItem.quantity > 0) {
                          return (
                            <div className="flex items-center justify-center gap-2 mt-4">
                              <Button
                                size="icon"
                                className="bg-green-800 text-white hover:bg-green-900 h-10 w-10 rounded-full"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDecrement(product.id);
                                }}
                              >
                                -
                              </Button>
                              <span className="text-white font-semibold text-lg min-w-[2rem] text-center">
                                {cartItem.quantity}
                                      </span>
                              <Button
                                size="icon"
                                className="bg-green-800 text-white hover:bg-green-900 h-10 w-10 rounded-full"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleIncrement(product.id);
                                }}
                              >
                                +
                              </Button>
                            </div>
                          );
                        }
                        return (
                          <Button 
                            className="w-full mt-4 bg-green-800 text-white hover:bg-green-900 font-semibold"
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(product.id);
                            }}
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

      {/* Community in Action Section - with bgWhite.png background */}
      <section 
        className="py-16 md:py-24 relative"
        style={{
          backgroundImage: 'url(/bgWhite.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Community in Action</h2>
            <p className="text-xl text-gray-600 mb-8">Fresh, Healthy, Together</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Instagram className="h-12 w-12" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-gray-600">
              Tag us <span className="font-semibold text-primary">@phresh</span> to be featured!
            </p>
          </div>
        </div>
      </section>

      {/* Auth Sheet */}
      <AuthSheet open={authSheetOpen} onOpenChange={setAuthSheetOpen} defaultMode={authMode} />
    </div>
  );
};
