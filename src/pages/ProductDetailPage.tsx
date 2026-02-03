import { useState, useEffect, FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Star, ArrowLeft, ShoppingCart, Gift, RefreshCcw, Package, CheckCircle2 } from "lucide-react";
import { apiService } from "@/services/api";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { computeDiscountedPrice } from "@/utils/pricing";
import { cn } from "@/lib/utils";

interface Product {
  _id: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  stock?: number;
  discount: number | null;
  discount_amount?: number | null;
  discount_type?: "percentage" | "amount" | null;
  image_url?: string | null;
  image_urls?: string[];
  images?: Array<{ url?: string; _id?: string }> | string[];
  category?: {
    _id?: string;
    name: string;
    slug?: string;
    description?: string;
  };
  variants?: Array<{
    _id?: string;
    name: string;
    price: number;
    stock: number;
  }>;
  selling_points?: string[] | null;
  shipping_information?: string | null;
  productType?: string;
  bundle?: {
    size?: number | null;
    price?: number | null;
    allowedProducts?: any[];
    allowDuplicates?: boolean;
  };
}

interface ProductVariant {
  _id: string;
  size: string;
  price: number;
  stock_quantity: number;
}

interface BundleAllowedProduct {
  id: string;
  name: string;
  image_url?: string | null;
  image_urls?: string[] | null;
  variants?: ProductVariant[];
}

interface BundleSelection {
  productId: string;
  quantity: number;
  variantId?: string;
  variantName?: string;
  variantPrice?: number;
  product?: BundleAllowedProduct;
}

interface Review {
  _id: string;
  customer_name: string;
  email?: string | null;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id?: string | null;
}

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [newRating, setNewRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [newComment, setNewComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [userReviewId, setUserReviewId] = useState<string | null>(null);
  const [questionName, setQuestionName] = useState("");
  const [questionEmail, setQuestionEmail] = useState("");
  const [questionMessage, setQuestionMessage] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [bundleAllowedProducts, setBundleAllowedProducts] = useState<BundleAllowedProduct[]>([]);
  const [bundleSelections, setBundleSelections] = useState<Record<string, BundleSelection>>({});
  const [bundleLoading, setBundleLoading] = useState(false);

  const getCartItemsForProduct = (productId: string) => {
    return items.filter(item => item.productId === productId);
  };

  const getCartQuantityForProduct = (productId: string) => {
    return getCartItemsForProduct(productId).reduce((total, item) => total + item.quantity, 0);
  };

  const getCartQuantityForVariant = (productId: string, variantId?: string | null, variantName?: string | null) => {
    if (!variantId && !variantName) return 0;
    return items
      .filter(item =>
        item.productId === productId &&
        (item.variant_id === variantId || (!item.variant_id && variantName && item.variant_size === variantName))
      )
      .reduce((total, item) => total + item.quantity, 0);
  };

  const getCartItemForVariant = (productId: string, variantId?: string | null, variantName?: string | null) => {
    const cartItems = getCartItemsForProduct(productId);
    if (cartItems.length === 0) return null;
    if (variantId || variantName) {
      return (
        cartItems.find(
          item =>
            item.variant_id === variantId ||
            (!item.variant_id && variantName && item.variant_size === variantName)
        ) ?? null
      );
    }
    return cartItems[0];
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
      variants: (raw.variants || []).map((variant: any) => ({
        _id: variant._id || `${id}_${variant.name}`,
        size: variant.name || variant.size,
        price: variant.price,
        stock_quantity: variant.stock ?? variant.stock_quantity ?? 0,
      }))
    };
  };

  const getBundleTotalCount = (selections: Record<string, BundleSelection>) => {
    return Object.values(selections).reduce((sum, selection) => sum + (selection.quantity || 0), 0);
  };

  const handleBundleQuantityChange = (productId: string, delta: number) => {
    if (!product?.bundle?.size) return;
    setBundleSelections((prev) => {
      const currentTotal = getBundleTotalCount(prev);
      const allowDuplicates = product.bundle?.allowDuplicates ?? true;
      const current = prev[productId] || { productId, quantity: 0 };
      const nextQuantity = Math.max(0, (current.quantity || 0) + delta);
      if (delta > 0 && currentTotal >= product.bundle!.size) {
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
        variantId: variant._id ?? variant.size,
        variantName: variant.size,
        variantPrice: variant.price
      }
    }));
  };

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;

      try {
        // Fetch product details (new API structure with nested data + variants)
        const productResponse = await apiService.getProduct(id);
        if (!productResponse.success || !productResponse.data) {
          throw new Error(productResponse.message || "Failed to fetch product");
        }

        const raw = productResponse.data as any;
        // Support different nesting levels: response.data.data.data or response.data.data or response.data
        // Handle the nested structure: { success: true, data: { success: true, data: [...] } }
        let productsData = raw;
        if (raw?.data?.data && Array.isArray(raw.data.data)) {
          // Nested structure: response.data.data.data
          productsData = raw.data.data;
        } else if (raw?.data && Array.isArray(raw.data)) {
          // Direct array: response.data
          productsData = raw.data;
        } else if (Array.isArray(raw)) {
          // Already an array
          productsData = raw;
        }
        
        const primaryProduct: Product = Array.isArray(productsData)
          ? (productsData[0] as Product)
          : (productsData as Product);
        
        console.log('Parsed product:', primaryProduct);

        // Fetch product reviews
        const reviewsResponse = await apiService.getProductReviews(id);
        if (!reviewsResponse.success) {
          throw new Error(reviewsResponse.message || "Failed to fetch reviews");
        }

        // Map variants from product payload (if present)
        let mappedVariants: ProductVariant[] = [];
        if (primaryProduct.variants && primaryProduct.variants.length > 0) {
          mappedVariants = primaryProduct.variants.map((variant: any) => ({
            _id: variant._id || `${primaryProduct._id}_${variant.name}`,
            size: variant.name,
            price: variant.price,
            stock_quantity: variant.stock,
          }));
        } else {
          // Fallback to legacy variants endpoint if needed
          const variantsResponse = await apiService.getProductVariants(id);
          if (variantsResponse.success && Array.isArray(variantsResponse.data)) {
            mappedVariants = variantsResponse.data.map((variant: any) => ({
              _id: variant._id,
              size: variant.name || variant.size,
              price: variant.price,
              stock_quantity: variant.stock || variant.stock_quantity,
            }));
          }
        }

        // Extract images from the API response structure
        let imageUrls: string[] = [];
        if (primaryProduct.image_urls && Array.isArray(primaryProduct.image_urls)) {
          imageUrls = primaryProduct.image_urls;
        } else if (primaryProduct.images && Array.isArray(primaryProduct.images)) {
          // Handle images array with objects: [{ url: "...", ... }] or string array
          imageUrls = primaryProduct.images.map((img: any) => 
            typeof img === 'string' ? img : (img.url || img.image_url || '')
          ).filter(Boolean);
        } else if (primaryProduct.image_url) {
          imageUrls = [primaryProduct.image_url];
        }
        
        // Update product with extracted image URLs
        const updatedProduct = {
          ...primaryProduct,
          image_urls: imageUrls.length > 0 ? imageUrls : (primaryProduct.image_url ? [primaryProduct.image_url] : []),
          image_url: imageUrls[0] || primaryProduct.image_url || null,
        };
        
        setProduct(updatedProduct);
        setVariants(mappedVariants);
        setReviews(reviewsResponse.data || []);

        if (updatedProduct.productType === "bundle") {
          setBundleLoading(true);
          try {
            const allowed = updatedProduct.bundle?.allowedProducts ?? [];
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
                variantId: defaultVariant?._id ?? defaultVariant?.size,
                variantName: defaultVariant?.size,
                variantPrice: defaultVariant?.price,
                product: allowedProduct
              };
            });
            setBundleSelections(initialSelections);
          } catch (error) {
            console.error("Failed to load bundle items", error);
          } finally {
            setBundleLoading(false);
          }
        } else {
          setBundleAllowedProducts([]);
          setBundleSelections({});
        }
        
        if (reviewsResponse.data && reviewsResponse.data.length > 0 && user) {
          const mine = reviewsResponse.data.find((r: any) => r.user_id === user.id);
          setUserReviewId(mine?._id || null);
        } else {
          setUserReviewId(null);
        }
        
        // Set default variant if available
        if (mappedVariants.length > 0) {
          const firstAvailable =
            mappedVariants.find((variant) => variant.stock_quantity > 0) ??
            mappedVariants[0];
          setSelectedVariant(firstAvailable);
        }
        
        // Reset selected image index
        setSelectedImageIndex(0);
        
      } catch (error) {
        console.error('Error fetching product data:', error);
        toast({
          title: "Error",
          description: "Failed to load product details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id, user]);

  const addProductToCart = async (showSuccessToast = true) => {
    if (!product) return false;

    try {
      const opts = selectedVariant
        ? { variantId: selectedVariant._id, variantSize: selectedVariant.size, variantPrice: selectedVariant.price }
        : undefined;
      await addToCart(product._id, 1, opts);
      if (showSuccessToast) {
        toast({
          title: "Added to Cart",
          description: `${product.name}${selectedVariant ? ` (${selectedVariant.size})` : ''} added to cart`
        });
      }
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
      return false;
    }
  };

  const addBundleToCart = async (showSuccessToast = true) => {
    if (!product?.bundle?.size) return false;
    const total = getBundleTotalCount(bundleSelections);
    if (total !== product.bundle.size) {
      toast({
        title: "Bundle incomplete",
        description: `Please select exactly ${product.bundle.size} items.`,
        variant: "destructive"
      });
      return false;
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

    await addToCart(product._id, 1, {
      productType: "bundle",
      bundleItems
    });

    if (showSuccessToast) {
      toast({
        title: "Added to Cart",
        description: `${product.name} bundle added to cart`
      });
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (product?.productType === "bundle") {
      await addBundleToCart(true);
      return;
    }
    await addProductToCart(true);
  };

  const handleIncrementFromDetail = async () => {
    if (!product) return;
    if (product.productType === "bundle") {
      const cartItem = getCartItemForVariant(product._id);
      if (cartItem) {
        await updateQuantity(cartItem._id, cartItem.quantity + 1);
        return;
      }
      await addBundleToCart(true);
      return;
    }
    if (variants.length > 0) {
      if (!selectedVariant) return;
      const cartItem = getCartItemForVariant(product._id, selectedVariant._id, selectedVariant.size);
      if (cartItem) {
        await updateQuantity(cartItem._id, cartItem.quantity + 1);
        return;
      }
      await addToCart(product._id, 1, {
        variantId: selectedVariant._id,
        variantSize: selectedVariant.size,
        variantPrice: selectedVariant.price
      });
      return;
    }
    const cartItem = getCartItemForVariant(product._id);
    if (cartItem) {
      await updateQuantity(cartItem._id, cartItem.quantity + 1);
      return;
    }
    await addToCart(product._id, 1);
  };

  const handleDecrementFromDetail = async () => {
    if (!product) return;
    if (product.productType === "bundle") {
      const cartItem = getCartItemForVariant(product._id);
      if (!cartItem) return;
      if (cartItem.quantity > 1) {
        await updateQuantity(cartItem._id, cartItem.quantity - 1);
      } else {
        await removeFromCart(cartItem._id);
      }
      return;
    }
    const targetVariantId = selectedVariant?._id ?? null;
    const targetVariantName = selectedVariant?.size ?? null;
    const cartItem = getCartItemForVariant(product._id, targetVariantId, targetVariantName);
    if (!cartItem) return;
    if (cartItem.quantity > 1) {
      await updateQuantity(cartItem._id, cartItem.quantity - 1);
    } else {
      await removeFromCart(cartItem._id);
    }
  };

  const handleBuyNow = async () => {
    const success = product?.productType === "bundle"
      ? await addBundleToCart(false)
      : await addProductToCart(false);
    if (success) {
      navigate('/checkout?buy_now=1');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-orange-400 text-orange-400' : 'text-gray-200'
        }`}
      />
    ));
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const getSellingPointIcon = (point: string) => {
    const normalized = point.toLowerCase();
    if (normalized.includes("gift")) return Gift;
    if (normalized.includes("return")) return RefreshCcw;
    if (normalized.includes("inventory") || normalized.includes("stock")) return Package;
    return CheckCircle2;
  };

  const handleDeleteMyReview = async () => {
    if (!user || !userReviewId) return;
    try {
      const response = await apiService.deleteReview(userReviewId);
      if (!response.success) {
        throw new Error(response.message || "Failed to delete review");
      }
      
      toast({ title: 'Review removed', description: 'You can write a new review now.' });
      
      // Refresh reviews
      const reviewsResponse = await apiService.getProductReviews(id!);
      if (reviewsResponse.success) {
        setReviews(reviewsResponse.data || []);
      }
      setUserReviewId(null);
    } catch (e: any) {
      console.error('Delete review error', e);
      toast({ title: 'Failed to delete review', description: e.message || 'Try again', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-300 rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-20 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <Link to="/products">
              <Button>Return to Products</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isBundle = product.productType === "bundle";
  const currentPrice = isBundle ? product.price : (selectedVariant ? selectedVariant.price : product.price);
  const pricing = computeDiscountedPrice(product, currentPrice);
  const selectedVariantQuantity = isBundle
    ? getCartQuantityForProduct(product._id)
    : selectedVariant
      ? getCartQuantityForVariant(product._id, selectedVariant._id, selectedVariant.size)
      : getCartQuantityForProduct(product._id);
  const discountedPrice = pricing.finalPrice;
  const hasDiscount = pricing.hasDiscount;
  const savingsAmount = hasDiscount ? Math.round(pricing.savings) : 0;

  const bundleSize = product.bundle?.size ?? 0;
  const bundleTotal = getBundleTotalCount(bundleSelections);
  const bundleReady = isBundle && bundleSize > 0 && bundleTotal === bundleSize;

  const formatSize = (size: string) => {
    const s = size?.toString() || "";
    return /ml$/i.test(s.trim()) ? s : `${s} ml`;
  };

  const hasAvailableVariant = variants.some((variant) => variant.stock_quantity > 0);

  const handleSubmitReview = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to leave a review.", variant: "destructive" });
      return;
    }
    if (!id) return;
    if (newRating < 1) {
      toast({ title: "Rating required", description: "Please select a star rating." });
      return;
    }
    try {
      setSubmittingReview(true);
      const displayName = (user.user_metadata?.full_name as string) || (user.email?.split("@")[0] ?? "Customer");
      
      const response = await apiService.createReview(id!, {
        rating: newRating,
        comment: newComment || null,
      });
      
      if (!response.success) {
        throw new Error(response.message || "Failed to submit review");
      }
      
      toast({ title: "Review submitted", description: "Thanks! Your review is pending approval." });
      
      // Refresh reviews
      const reviewsResponse = await apiService.getProductReviews(id);
      if (reviewsResponse.success) {
        setReviews(reviewsResponse.data || []);
      }
      
      // Reset form
      setNewRating(0);
      setHoverRating(0);
      setNewComment("");
    } catch (e: any) {
      console.error('Review submit error', e);
      const msg = e?.message || '';
      if (msg.includes('duplicate') || e?.code === '23505') {
        // Already has a review — refresh reviews and show notice
        const reviewsResponse = await apiService.getProductReviews(id!);
        if (reviewsResponse.success) {
          setReviews(reviewsResponse.data || []);
          const mine = (reviewsResponse.data || []).find((r: any) => r.user_id === user?.id);
          setUserReviewId(mine?._id || null);
        }
        toast({ title: 'You have already reviewed this product.', description: 'You can delete your review and write a new one.' });
      } else {
        toast({ title: "Failed to submit review", description: msg || 'Please try again', variant: "destructive" });
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAskQuestionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!questionName || !questionEmail || !questionMessage) {
      toast({ title: "Missing info", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    try {
      setSubmittingQuestion(true);
      const response = await apiService.submitContactQuery({
        name: questionName,
        email: questionEmail,
        subject: `Product question - ${product?.name}`,
        message: questionMessage,
        category: "product_question"
      });
      
      if (!response.success) {
        throw new Error(response.message || "Failed to submit question");
      }
      
      toast({ title: "Thanks!", description: "We have received your question." });
      setQuestionName("");
      setQuestionEmail("");
      setQuestionMessage("");
    } catch (error: any) {
      console.error('Ask question submit error', error);
      toast({ title: "Failed to send", description: error?.message || 'Please try again', variant: "destructive" });
    } finally {
      setSubmittingQuestion(false);
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

      {/* Main Content Section - with bgWhite.png background */}
      <section 
        className="py-8 md:py-12 relative"
        style={{
          backgroundImage: 'url(/bgWhite.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-4 py-8">
          <Link to="/products" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-lg shadow-elegant">
              <img 
                src={
                  (product.image_urls && product.image_urls.length > 0 
                    ? product.image_urls[selectedImageIndex] 
                    : product.image_url) || '/placeholder.svg'
                } 
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            {/* Image Thumbnails */}
            {product.image_urls && product.image_urls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.image_urls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === selectedImageIndex 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.category?.name}
              </Badge>
              <h1 className="text-3xl font-bold mb-2 uppercase tracking-[0.08em]">{product.name}</h1>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {renderStars(Math.round(averageRating))}
                </div>
                <span className="text-sm text-muted-foreground">{reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-primary">
                  £{pricing.finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
                {hasDiscount && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-muted-foreground line-through">
                      £{pricing.basePrice.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                    <Badge variant="destructive">Save £{savingsAmount.toLocaleString('en-IN')}</Badge>
                  </div>
                )}
              </div>

              {product.selling_points && product.selling_points.length > 0 && (
                <ul className="space-y-2">
                  {product.selling_points.map((point, index) => {
                    const Icon = getSellingPointIcon(point);
                    return (
                      <li key={`${point}-${index}`} className="flex items-center gap-3 text-sm">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>{point}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {!isBundle && variants.length > 0 && (
                <div className="pt-2">
                  <h3 className="font-semibold mb-3 uppercase tracking-widest text-xs text-muted-foreground">Select Size</h3>
                  <RadioGroup
                    value={selectedVariant?._id ?? ""}
                    onValueChange={(value) => {
                      const next = variants.find((variant) => variant._id === value) ?? null;
                      setSelectedVariant(next);
                    }}
                    className="gap-3"
                  >
                    {variants.map((variant) => {
                      const label = `${formatSize(variant.size)} - £${variant.price.toFixed(2)}`;
                      const isDisabled = hasAvailableVariant && variant.stock_quantity === 0;
                      return (
                        <div
                          key={variant._id}
                          className={cn(
                            "flex items-center justify-between rounded-lg border px-4 py-3",
                            isDisabled ? "border-muted bg-muted/40 opacity-70" : "border-border"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={variant._id} id={`variant-${variant._id}`} disabled={isDisabled} />
                            <Label htmlFor={`variant-${variant._id}`} className="flex flex-col text-left">
                              <span className="text-sm font-medium">{label}</span>
                              {variant.stock_quantity === 0 && (
                                <span className="text-xs text-destructive">Out of stock</span>
                              )}
                            </Label>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {variant.stock_quantity > 0 ? "Available" : "Unavailable"}
                          </span>
                        </div>
                      );
                    })}
                  </RadioGroup>
                  {selectedVariant && selectedVariant.stock_quantity === 0 && (
                    <p className="mt-2 text-xs text-destructive">
                      This size is currently out of stock.
                    </p>
                  )}
                </div>
              )}

              {isBundle && (
                <div className="pt-2 space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm">
                    <span className="text-gray-700">Bundle items selected</span>
                    <span className={cn("font-semibold", bundleReady ? "text-green-700" : "text-gray-900")}>
                      {bundleTotal}/{bundleSize}
                    </span>
                  </div>

                  {bundleLoading ? (
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
                          selection?.variantId || allowedProduct.variants?.[0]?._id || allowedProduct.variants?.[0]?.size;
                        const allowDuplicates = product.bundle?.allowDuplicates ?? true;
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
                                    const variant = allowedProduct.variants?.find((v) => v._id === value || v.size === value);
                                    if (variant) {
                                      handleBundleVariantChange(allowedProduct.id, variant);
                                    }
                                  }}
                                  className="flex flex-wrap gap-2"
                                >
                                  {allowedProduct.variants?.map((variant) => (
                                    <div key={variant._id || variant.size} className="flex items-center space-x-2">
                                      <RadioGroupItem value={variant._id ?? variant.size} id={`${allowedProduct.id}-${variant._id ?? variant.size}`} />
                                      <Label htmlFor={`${allowedProduct.id}-${variant._id ?? variant.size}`} className="text-sm font-normal">
                                        {variant.size}
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
            </div>

            <div className="space-y-3">
              {selectedVariantQuantity > 0 ? (
                <div className="flex items-center justify-center gap-3">
                  <Button
                    size="icon"
                    className="h-11 w-11 rounded-full"
                    variant="outline"
                    onClick={handleDecrementFromDetail}
                  >
                    -
                  </Button>
                  <span className="text-lg font-semibold min-w-[2.5rem] text-center">{selectedVariantQuantity}</span>
                  <Button
                    size="icon"
                    className="h-11 w-11 rounded-full"
                    onClick={handleIncrementFromDetail}
                    disabled={variants.length > 0 && selectedVariant?.stock_quantity === 0}
                  >
                    +
                  </Button>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full gradient-luxury shadow-luxury"
                  onClick={handleAddToCart}
                  disabled={
                    (isBundle && !bundleReady) ||
                    (!isBundle && variants.length > 0 && (!selectedVariant || selectedVariant.stock_quantity === 0))
                  }
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                  {!isBundle && selectedVariant && ` - ${formatSize(selectedVariant.size)}`}
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={handleBuyNow}
                disabled={
                  (isBundle && !bundleReady) ||
                  (!isBundle && variants.length > 0 && (!selectedVariant || selectedVariant.stock_quantity === 0))
                }
              >
                Buy It Now
              </Button>
              {!isBundle && selectedVariant && selectedVariant.stock_quantity < 10 && selectedVariant.stock_quantity > 0 && (
                <p className="text-sm text-orange-600">
                  Only {selectedVariant.stock_quantity} left in stock!
                </p>
              )}
            </div>

            <Accordion type="single" collapsible className="rounded-lg border divide-y bg-white/60">
              <AccordionItem value="description">
                <AccordionTrigger className="px-4 py-3 text-sm font-semibold tracking-wide uppercase">Description</AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm text-black leading-relaxed">
                  {product.description ? (
                    <div
                      className="rich-text-content"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  ) : (
                    "Details coming soon."
                  )}
                </AccordionContent>
              </AccordionItem>
              {product.shipping_information && (
                <AccordionItem value="shipping">
                  <AccordionTrigger className="px-4 py-3 text-sm font-semibold tracking-wide uppercase">Shipping Information</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {product.shipping_information}
                  </AccordionContent>
                </AccordionItem>
              )}
              <AccordionItem value="question">
                <AccordionTrigger className="px-4 py-3 text-sm font-semibold tracking-wide uppercase">Ask a Question</AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <form onSubmit={handleAskQuestionSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-widest mb-1 block">Name</label>
                        <Input value={questionName} onChange={(e) => setQuestionName(e.target.value)} placeholder="Your name" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-widest mb-1 block">Email</label>
                        <Input type="email" value={questionEmail} onChange={(e) => setQuestionEmail(e.target.value)} placeholder="you@example.com" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-widest mb-1 block">Question</label>
                      <Textarea rows={4} value={questionMessage} onChange={(e) => setQuestionMessage(e.target.value)} placeholder="What would you like to know?" />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={submittingQuestion}>
                        {submittingQuestion ? 'Sending…' : 'Submit'}
                      </Button>
                    </div>
                  </form>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

          {/* Add Review (signed-in users) */}
          {user ? (
            userReviewId ? (
              <Card className="shadow-soft mb-8">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    You’ve already reviewed this product.
                  </div>
                  <Button variant="outline" onClick={handleDeleteMyReview}>
                    Delete My Review
                  </Button>
                </CardContent>
              </Card>
            ) : (
            <Card className="shadow-soft mb-8">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Write a Review</h3>
                <div className="mb-3 flex items-center gap-2">
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(star)}
                      className="focus:outline-none"
                      aria-label={`Rate ${star} star${star>1?'s':''}`}
                    >
                      <Star className={`h-6 w-6 ${ (hoverRating || newRating) >= star ? 'fill-orange-400 text-orange-400' : 'text-gray-200' }`} />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Share your experience (optional)"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="mt-3 flex justify-end">
                  <Button onClick={handleSubmitReview} disabled={submittingReview || newRating < 1}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            )
          ) : (
            <div className="mb-6 text-sm text-muted-foreground">
              Please <Link to="/auth" className="text-primary underline">sign in</Link> to write a review.
            </div>
          )}
          
          {reviews.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {reviews
                .filter((review) => review.status === 'approved' || (user && review.user_id === user.id))
                .map((review) => (
                  <Card key={review._id} className="shadow-soft">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{review.customer_name}</h4>
                          {review.status === 'approved' ? (
                            <Badge variant="outline" className="text-xs mt-1">
                              Verified Purchase
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Pending approval
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 text-orange-400">
                            {renderStars(review.rating)}
                          </div>
                          {user?.id === review.user_id && (
                            <Button variant="ghost" size="sm" onClick={handleDeleteMyReview}>
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                      {review.comment ? (
                        <p className="text-muted-foreground">{review.comment}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card className="shadow-soft">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
              </CardContent>
            </Card>
          )}
        </div>
        </div>
      </section>

      {/* Footer with bg-green.png background */}
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
