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
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
  productType?: string;
  bundle?: {
    size?: number | null;
    price?: number | null;
    allowedProducts?: any[];
    allowDuplicates?: boolean;
  };
  variants?: ProductVariant[];
}

type ProductVariant = {
  _id?: string;
  name: string;
  price: number;
  stock: number;
};

type BundleAllowedProduct = {
  id: string;
  name: string;
  image_url?: string | null;
  image_urls?: string[] | null;
  variants?: ProductVariant[];
};

type BundleSelection = {
  productId: string;
  quantity: number;
  variantId?: string;
  variantName?: string;
  variantPrice?: number;
  product?: BundleAllowedProduct;
};

interface CarouselItem {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  product_id?: string | null;
  video_url?: string | null;
}

interface InstagramMedia {
  id: string;
  media_url: string;
  permalink: string;
  caption?: string | null;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  thumbnail_url?: string | null;
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
  const [variantSheetOpen, setVariantSheetOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [variantSheetLoading, setVariantSheetLoading] = useState(false);
  const [bundleSheetOpen, setBundleSheetOpen] = useState(false);
  const [bundleSheetLoading, setBundleSheetLoading] = useState(false);
  const [activeBundleProduct, setActiveBundleProduct] = useState<Product | null>(null);
  const [bundleAllowedProducts, setBundleAllowedProducts] = useState<BundleAllowedProduct[]>([]);
  const [bundleSelections, setBundleSelections] = useState<Record<string, BundleSelection>>({});
  const [instagramMedia, setInstagramMedia] = useState<InstagramMedia[]>([]);
  const [instagramLoading, setInstagramLoading] = useState(false);
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    loadData();
  }, [selectedCategoryId, sortBy]);

  useEffect(() => {
    void loadInstagramMedia();
  }, []);

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
          productType: product.productType || product.product_type,
          bundle: product.bundle,
          variants: normalizeVariants(product.variants)
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
              productType: product.productType || product.product_type,
              bundle: product.bundle,
              variants: normalizeVariants(product.variants)
            }));
            
        setProducts(transformedProducts);
      }
    } catch (error) {
      console.error("❌ Error loading homepage data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInstagramMedia = async () => {
    try {
      setInstagramLoading(true);
      const response = await apiService.getInstagramMedia({ limit: 4 });
      const responseData: any = response as any;
      const payload = responseData?.data ?? responseData;
      const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      if (items.length > 0) {
        const mapped = items
          .map((item: any) => ({
            id: item.id || item._id,
            media_url: item.media_url,
            permalink: item.permalink,
            caption: item.caption ?? null,
            media_type: item.media_type,
            thumbnail_url: item.thumbnail_url ?? null,
          }))
          .filter((item: InstagramMedia) => Boolean(item.media_url && item.permalink));
        setInstagramMedia(mapped);
      }
    } catch (error) {
      console.error("Failed to load Instagram media:", error);
    } finally {
      setInstagramLoading(false);
    }
  };

  const getCartItemsForProduct = (productId: string) => {
    return items.filter(item => item.productId === productId);
  };

  const getCartQuantityForProduct = (productId: string) => {
    return getCartItemsForProduct(productId).reduce((total, item) => total + item.quantity, 0);
  };

  const getCartItemForDecrement = (productId: string) => {
    const cartItems = getCartItemsForProduct(productId);
    if (cartItems.length === 0) return null;
    return cartItems.reduce((selected, item) => (item.quantity > selected.quantity ? item : selected), cartItems[0]);
  };

  const getCartQuantityForVariant = (productId: string, variant: ProductVariant) => {
    return items
      .filter(item =>
        item.productId === productId &&
        (item.variant_id === variant._id || (!item.variant_id && item.variant_size === variant.name))
      )
      .reduce((total, item) => total + item.quantity, 0);
  };

  const getCartItemForVariant = (productId: string, variant: ProductVariant) => {
    return (
      items.find(item =>
        item.productId === productId &&
        (item.variant_id === variant._id || (!item.variant_id && item.variant_size === variant.name))
      ) || null
    );
  };

  const normalizeVariants = (variants: any): ProductVariant[] => {
    if (!Array.isArray(variants)) return [];
    return variants
      .map((variant: any) => ({
        _id: variant._id || variant.id,
        name: variant.name || variant.size || variant.title || "",
        price: Number(variant.price ?? variant.amount ?? 0),
        stock: Number(variant.stock ?? variant.stock_quantity ?? variant.quantity ?? 0),
      }))
      .filter((variant: ProductVariant) => variant.name);
  };

  const extractPrimaryProduct = (raw: any) => {
    if (!raw) return null;
    let productsData = raw;
    if (raw?.data?.data && Array.isArray(raw.data.data)) {
      productsData = raw.data.data;
    } else if (raw?.data && Array.isArray(raw.data)) {
      productsData = raw.data;
    } else if (raw?.data && !Array.isArray(raw.data)) {
      productsData = raw.data;
    } else if (Array.isArray(raw)) {
      productsData = raw;
    }
    return Array.isArray(productsData) ? productsData[0] : productsData;
  };

  const getVariantKey = (variant: ProductVariant) => {
    return variant._id || variant.name;
  };

  const normalizeAllowedProduct = (raw: any): BundleAllowedProduct | null => {
    if (!raw) return null;
    const id = raw._id || raw.id || raw.productId;
    if (!id) return null;
    const imageUrls = raw.image_urls || raw.images?.map((img: any) => img.url || img) || (raw.image_url ? [raw.image_url] : []);
    return {
      id,
      name: raw.name || raw.title || "Product",
      image_url: raw.image_url || raw.images?.[0]?.url || null,
      image_urls: Array.isArray(imageUrls) ? imageUrls : [],
      variants: normalizeVariants(raw.variants)
    };
  };

  const getBundleTotalCount = (selections: Record<string, BundleSelection>) => {
    return Object.values(selections).reduce((sum, selection) => sum + (selection.quantity || 0), 0);
  };

  const handleBundleQuantityChange = (productId: string, delta: number) => {
    if (!activeBundleProduct?.bundle?.size) return;
    setBundleSelections((prev) => {
      const currentTotal = getBundleTotalCount(prev);
      const allowDuplicates = activeBundleProduct?.bundle?.allowDuplicates ?? true;
      const current = prev[productId] || { productId, quantity: 0 };
      const nextQuantity = Math.max(0, (current.quantity || 0) + delta);
      if (delta > 0 && currentTotal >= activeBundleProduct.bundle!.size) {
        return prev;
      }
      if (!allowDuplicates && nextQuantity > 1) {
        return prev;
      }
      return {
        ...prev,
        [productId]: {
          ...current,
          quantity: nextQuantity
        }
      };
    });
  };

  const handleBundleVariantChange = (productId: string, variant: ProductVariant) => {
    setBundleSelections((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { productId, quantity: 0 }),
        variantId: variant._id ?? variant.name,
        variantName: variant.name,
        variantPrice: variant.price
      }
    }));
  };

  const handleOpenBundleSheet = async (product: Product) => {
    setActiveBundleProduct(product);
    setBundleSheetOpen(true);
    setBundleSheetLoading(true);
    try {
      const allowed = product.bundle?.allowedProducts ?? [];
      const resolved = await Promise.all(
        allowed.map(async (entry: any) => {
          if (typeof entry === "string") {
            const response = await apiService.getProduct(entry);
            if (response?.success && response.data) {
              const primary = extractPrimaryProduct(response.data);
              return normalizeAllowedProduct(primary);
            }
            return null;
          }
          return normalizeAllowedProduct(entry);
        })
      );
      const normalized = resolved.filter(Boolean) as BundleAllowedProduct[];
      setBundleAllowedProducts(normalized);

      const initialSelections: Record<string, BundleSelection> = {};
      normalized.forEach((allowedProduct) => {
        const defaultVariant = allowedProduct.variants?.[0];
        initialSelections[allowedProduct.id] = {
          productId: allowedProduct.id,
          quantity: 0,
          variantId: defaultVariant?._id ?? defaultVariant?.name,
          variantName: defaultVariant?.name,
          variantPrice: defaultVariant?.price,
          product: allowedProduct
        };
      });
      setBundleSelections(initialSelections);
    } catch (error) {
      console.error("Failed to load bundle products", error);
    } finally {
      setBundleSheetLoading(false);
    }
  };

  const handleBundleSheetChange = (open: boolean) => {
    setBundleSheetOpen(open);
    if (!open) {
      setActiveBundleProduct(null);
      setBundleAllowedProducts([]);
      setBundleSelections({});
    }
  };

  const handleAddBundleToCart = async () => {
    if (!activeBundleProduct?.bundle?.size) return;
    const total = getBundleTotalCount(bundleSelections);
    if (total !== activeBundleProduct.bundle.size) {
      toast({
        title: "Bundle incomplete",
        description: `Please select exactly ${activeBundleProduct.bundle.size} items.`,
        variant: "destructive"
      });
      return;
    }
    const bundleItems = Object.values(bundleSelections)
      .filter((selection) => selection.quantity > 0)
      .map((selection) => ({
        productId: selection.productId,
        quantity: selection.quantity,
        variantId: selection.variantId,
        variantSize: selection.variantName,
        variantPrice: selection.variantPrice,
        product: selection.product
          ? {
              _id: selection.product.id,
              name: selection.product.name,
              price: selection.product.variants?.find(v => v._id === selection.variantId)?.price ?? selection.product.variants?.[0]?.price ?? 0,
              image_url: selection.product.image_url || null,
              image_urls: selection.product.image_urls || null,
              images: null
            }
          : undefined
      }));

    await addToCart(activeBundleProduct.id, 1, {
      productType: "bundle",
      bundleItems
    });
    handleBundleSheetChange(false);
  };


  const getPlainTextDescription = (description?: string) => {
    if (!description) return "";
    return description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  };

  const handleAddToCart = async (
    productId: string,
    options?: { variantId?: string; variantSize?: string; variantPrice?: number }
  ) => {
    await addToCart(productId, 1, options);
  };

  const handleIncrement = async (product: Product) => {
    const cartItems = getCartItemsForProduct(product.id);
    const hasVariants = (product.variants?.length ?? 0) > 0;
    const isBundle = product.productType === "bundle";
    if (isBundle) {
      if (cartItems.length > 0) {
        await updateQuantity(cartItems[0]._id, cartItems[0].quantity + 1);
      } else {
        await handleOpenBundleSheet(product);
      }
      return;
    }
    if (hasVariants) {
      await handleOpenVariantSheet(product);
      return;
    }
    if (cartItems.length > 0) {
      await updateQuantity(cartItems[0]._id, cartItems[0].quantity + 1);
    } else {
      await addToCart(product.id, 1);
    }
  };

  const handleDecrement = async (product: Product) => {
    const cartItems = getCartItemsForProduct(product.id);
    const hasVariants = (product.variants?.length ?? 0) > 0;
    const isBundle = product.productType === "bundle";
    if (isBundle) {
      const cartItem = getCartItemForDecrement(product.id);
      if (!cartItem) return;
      if (cartItem.quantity > 1) {
        await updateQuantity(cartItem._id, cartItem.quantity - 1);
      } else {
        await removeFromCart(cartItem._id);
      }
      return;
    }
    if (hasVariants && cartItems.length > 1) {
      await handleOpenVariantSheet(product);
      return;
    }
    const cartItem = getCartItemForDecrement(product.id);
    if (!cartItem) return;
    if (cartItem.quantity > 1) {
      await updateQuantity(cartItem._id, cartItem.quantity - 1);
    } else {
      // Remove from cart when quantity is 1
      await removeFromCart(cartItem._id);
    }
  };

  const handleIncrementVariant = async (product: Product, variant: ProductVariant) => {
    const cartItem = getCartItemForVariant(product.id, variant);
    if (cartItem) {
      await updateQuantity(cartItem._id, cartItem.quantity + 1);
    } else {
      await handleAddToCart(product.id, {
        variantId: variant._id,
        variantSize: variant.name,
        variantPrice: variant.price
      });
    }
  };

  const handleDecrementVariant = async (product: Product, variant: ProductVariant) => {
    const cartItem = getCartItemForVariant(product.id, variant);
    if (!cartItem) return;
    if (cartItem.quantity > 1) {
      await updateQuantity(cartItem._id, cartItem.quantity - 1);
    } else {
      await removeFromCart(cartItem._id);
    }
  };

  const handleOpenVariantSheet = async (product: Product) => {
    const existingVariants = product.variants ?? [];
    setActiveProduct(product);
    setVariantSheetOpen(true);

    if (existingVariants.length > 0) return;

    setVariantSheetLoading(true);
    try {
      const response = await apiService.getProduct(product.id);
      if (response?.success && response.data) {
        const primaryProduct = extractPrimaryProduct(response.data);
        const normalizedVariants = normalizeVariants(primaryProduct?.variants);
        if (normalizedVariants.length > 0) {
          setActiveProduct((prev) =>
            prev ? { ...prev, variants: normalizedVariants } : prev
          );
          setFeaturedProducts((prev) =>
            prev.map((item) => (item.id === product.id ? { ...item, variants: normalizedVariants } : item))
          );
          setProducts((prev) =>
            prev.map((item) => (item.id === product.id ? { ...item, variants: normalizedVariants } : item))
          );
        }
      }
    } catch (error) {
      console.error("Failed to load variants for product:", error);
    } finally {
      setVariantSheetLoading(false);
    }
  };

  const handleVariantSheetChange = (open: boolean) => {
    setVariantSheetOpen(open);
    if (!open) {
      setActiveProduct(null);
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

  const activeHasVariants = (activeProduct?.variants?.length ?? 0) > 0;
  const bundleSize = activeBundleProduct?.bundle?.size ?? 0;
  const bundleTotal = getBundleTotalCount(bundleSelections);
  const bundleReady = bundleSize > 0 && bundleTotal === bundleSize;

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
                const hasVariants = (product.variants?.length ?? 0) > 0;
                const isBundle = product.productType === "bundle";
                const cartQuantity = getCartQuantityForProduct(product.id);

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
                        if (cartQuantity > 0) {
                          return (
                            <div className="flex items-center justify-center gap-2 mt-4">
                              <Button
                                size="icon"
                                className="bg-green-800 text-white hover:bg-green-900 h-10 w-10 rounded-full"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDecrement(product);
                                }}
                              >
                                -
                              </Button>
                              <span className="text-white font-semibold text-lg min-w-[2rem] text-center">
                                {cartQuantity}
                              </span>
                              <Button
                                size="icon"
                                className="bg-green-800 text-white hover:bg-green-900 h-10 w-10 rounded-full"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleIncrement(product);
                                }}
                              >
                                +
                              </Button>
                        </div>
                          );
                        }
                        return (
                          <div className="mt-4">
                            <Button
                              className="w-full bg-green-800 text-white hover:bg-green-900 font-semibold"
                              onClick={(e) => {
                                e.preventDefault();
                                if (isBundle) {
                                  void handleOpenBundleSheet(product);
                                } else {
                                  void handleOpenVariantSheet(product);
                                }
                              }}
                            >
                              {isBundle ? "BUILD BUNDLE" : hasVariants ? "SELECT VARIANT" : "ORDER NOW"}
                            </Button>
                          </div>
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
                const hasVariants = (product.variants?.length ?? 0) > 0;
                const isBundle = product.productType === "bundle";
                const cartQuantity = getCartQuantityForProduct(product.id);

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
                        if (cartQuantity > 0) {
                          return (
                            <div className="flex items-center justify-center gap-2 mt-4">
                              <Button
                                size="icon"
                                className="bg-green-800 text-white hover:bg-green-900 h-10 w-10 rounded-full"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDecrement(product);
                                }}
                              >
                                -
                              </Button>
                              <span className="text-white font-semibold text-lg min-w-[2rem] text-center">
                                {cartQuantity}
                                      </span>
                              <Button
                                size="icon"
                                className="bg-green-800 text-white hover:bg-green-900 h-10 w-10 rounded-full"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleIncrement(product);
                                }}
                              >
                                +
                              </Button>
                            </div>
                          );
                        }
                        return (
                          <div className="mt-4">
                            <Button 
                              className="w-full bg-green-800 text-white hover:bg-green-900 font-semibold"
                              onClick={(e) => {
                                e.preventDefault();
                                if (isBundle) {
                                  void handleOpenBundleSheet(product);
                                } else {
                                  void handleOpenVariantSheet(product);
                                }
                              }}
                            >
                              {isBundle ? "BUILD BUNDLE" : hasVariants ? "SELECT VARIANT" : "ORDER NOW"}
                            </Button>
                          </div>
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
      {/*
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
              {instagramMedia.length > 0 ? (
                instagramMedia.slice(0, 4).map((post) => {
                  const imageUrl =
                    post.media_type === "VIDEO"
                      ? post.thumbnail_url || post.media_url
                      : post.media_url;
                  return (
                    <a
                      key={post.id}
                      href={post.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="group block aspect-square bg-gray-200 rounded-lg overflow-hidden relative"
                    >
                      <img
                        src={imageUrl}
                        alt={post.caption ? post.caption : "Instagram post"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  );
                })
              ) : (
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`aspect-square bg-gray-200 rounded-lg overflow-hidden ${instagramLoading ? "animate-pulse" : ""}`}
                  >
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Instagram className="h-12 w-12" />
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="text-gray-600">
              Tag us <span className="font-semibold text-primary">@phreshmcr</span> to be featured!
            </p>
          </div>
        </div>
      </section>
      */}

      {/* Variant Selection Sheet */}
      <Sheet open={variantSheetOpen} onOpenChange={handleVariantSheetChange}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left">
          <SheetTitle>{activeHasVariants ? "Manage Variants" : "Product Details"}</SheetTitle>
          <SheetDescription>
            {activeHasVariants ? "Adjust quantities for each size." : "Review this item before adding to cart."}
          </SheetDescription>
        </SheetHeader>
          {activeProduct && (
            <div className="mt-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-36 h-36 rounded-lg overflow-hidden border border-gray-200 bg-white">
                  <img
                    src={activeProduct.image_urls?.[0] || activeProduct.image_url || "/api/placeholder/300/300"}
                    alt={activeProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">{activeProduct.title}</h3>
                  <p className="text-sm text-gray-600">{activeProduct.category?.name}</p>
                  {getPlainTextDescription(activeProduct.description) && (
                    <p className="text-sm text-gray-700 line-clamp-4">
                      {getPlainTextDescription(activeProduct.description)}
                    </p>
                  )}
                </div>
              </div>

              {variantSheetLoading ? (
                <div className="rounded-lg border border-gray-200 px-4 py-3">
                  <p className="text-sm text-gray-700">Loading variants...</p>
                </div>
              ) : (activeProduct.variants?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Available Variants</p>
                  <div className="space-y-3">
                    {activeProduct.variants?.map((variant) => {
                      const variantKey = getVariantKey(variant);
                      const isDisabled = variant.stock <= 0;
                    const variantQty = getCartQuantityForVariant(activeProduct.id, variant);
                      return (
                        <div
                          key={variantKey}
                          className={cn(
                            "flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                            isDisabled ? "border-gray-200 opacity-60" : "border-gray-300"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold">
                              {variant.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-medium text-gray-900">{variant.name}</span>
                              {variant.stock <= 0 && (
                                <span className="text-xs text-gray-500">Out of stock</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-4 sm:justify-end">
                            <span className="text-sm font-semibold text-gray-900">
                              £{variant.price.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-9 w-9 rounded-full"
                                onClick={() => handleDecrementVariant(activeProduct, variant)}
                                disabled={variantQty === 0}
                              >
                                -
                              </Button>
                              <span className="min-w-[2rem] text-center text-sm font-semibold">
                                {variantQty}
                              </span>
                              <Button
                                size="icon"
                                className="h-9 w-9 rounded-full"
                                onClick={() => handleIncrementVariant(activeProduct, variant)}
                                disabled={isDisabled}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 px-4 py-3">
                  <p className="text-sm text-gray-700">No variants available. This product will be added as-is.</p>
                </div>
              )}
            </div>
          )}
          <SheetFooter className="mt-8">
            <Button variant="outline" onClick={() => handleVariantSheetChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-800 text-white hover:bg-green-900"
              onClick={() => handleVariantSheetChange(false)}
              disabled={variantSheetLoading}
            >
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Bundle Selection Sheet */}
      <Sheet open={bundleSheetOpen} onOpenChange={handleBundleSheetChange}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>Build your bundle</SheetTitle>
            <SheetDescription>
              Select exactly {bundleSize || "--"} items from the list below.
            </SheetDescription>
          </SheetHeader>
          {activeBundleProduct && (
            <div className="mt-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-36 h-36 rounded-lg overflow-hidden border border-gray-200 bg-white">
                  <img
                    src={activeBundleProduct.image_urls?.[0] || activeBundleProduct.image_url || "/api/placeholder/300/300"}
                    alt={activeBundleProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">{activeBundleProduct.title}</h3>
                  <p className="text-sm text-gray-600">{activeBundleProduct.category?.name}</p>
                  <p className="text-sm text-gray-700">
                    Bundle size: <span className="font-semibold">{bundleSize || "--"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm">
                <span className="text-gray-700">Selected items</span>
                <span className={cn("font-semibold", bundleReady ? "text-green-700" : "text-gray-900")}>
                  {bundleTotal}/{bundleSize || 0}
                </span>
              </div>

              {bundleSheetLoading ? (
                <div className="rounded-lg border border-gray-200 px-4 py-3">
                  <p className="text-sm text-gray-700">Loading bundle items...</p>
                </div>
              ) : bundleAllowedProducts.length === 0 ? (
                <div className="rounded-lg border border-gray-200 px-4 py-3">
                  <p className="text-sm text-gray-700">No products available for this bundle.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bundleAllowedProducts.map((allowedProduct) => {
                    const selection = bundleSelections[allowedProduct.id];
                    const quantity = selection?.quantity || 0;
                    const selectedVariantId =
                      selection?.variantId || allowedProduct.variants?.[0]?._id || allowedProduct.variants?.[0]?.name;
                    const allowDuplicates = activeBundleProduct.bundle?.allowDuplicates ?? true;
                    const maxedOut = bundleSize > 0 && bundleTotal >= bundleSize;
                    const disablePlus = maxedOut || (!allowDuplicates && quantity >= 1);
                    return (
                      <div key={allowedProduct.id} className="rounded-lg border border-gray-200 px-4 py-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded border overflow-hidden bg-muted">
                            <img
                              src={allowedProduct.image_urls?.[0] || allowedProduct.image_url || "/placeholder.svg"}
                              alt={allowedProduct.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{allowedProduct.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 rounded-full"
                              onClick={() => handleBundleQuantityChange(allowedProduct.id, -1)}
                              disabled={quantity <= 0}
                            >
                              -
                            </Button>
                            <span className="min-w-[2rem] text-center text-sm font-semibold">{quantity}</span>
                            <Button
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => handleBundleQuantityChange(allowedProduct.id, 1)}
                              disabled={disablePlus}
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        {(allowedProduct.variants?.length ?? 0) > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">Select size</Label>
                            <RadioGroup
                              value={selectedVariantId}
                              onValueChange={(value) => {
                                const variant = allowedProduct.variants?.find((v) => v._id === value || v.name === value);
                                if (variant) {
                                  handleBundleVariantChange(allowedProduct.id, variant);
                                }
                              }}
                              className="flex flex-wrap gap-2"
                            >
                              {allowedProduct.variants?.map((variant) => (
                                <div key={variant._id || variant.name} className="flex items-center space-x-2">
                                  <RadioGroupItem value={variant._id || variant.name} id={`${allowedProduct.id}-${variant._id || variant.name}`} />
                                  <Label htmlFor={`${allowedProduct.id}-${variant._id || variant.name}`} className="text-sm font-normal">
                                    {variant.name}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <SheetFooter className="mt-8">
            <Button variant="outline" onClick={() => handleBundleSheetChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-800 text-white hover:bg-green-900"
              onClick={handleAddBundleToCart}
              disabled={!bundleReady || bundleSheetLoading}
            >
              Add bundle
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Auth Sheet */}
      <AuthSheet open={authSheetOpen} onOpenChange={setAuthSheetOpen} defaultMode={authMode} />
    </div>
  );
};
