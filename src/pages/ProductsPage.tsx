import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { apiService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthSheet } from "@/components/AuthSheet";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

interface ProductVariant {
  _id?: string;
  name: string;
  price: number;
  stock: number;
}

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
  productType?: string;
  bundle?: {
    size?: number | null;
    price?: number | null;
    allowedProducts?: any[];
    allowDuplicates?: boolean;
  };
  variants?: ProductVariant[];
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
  const [variantSheetOpen, setVariantSheetOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [bundleSheetOpen, setBundleSheetOpen] = useState(false);
  const [bundleSheetLoading, setBundleSheetLoading] = useState(false);
  const [activeBundleProduct, setActiveBundleProduct] = useState<Product | null>(null);
  const [bundleAllowedProducts, setBundleAllowedProducts] = useState<BundleAllowedProduct[]>([]);
  const [bundleSelections, setBundleSelections] = useState<Record<string, BundleSelection>>({});
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
          productType: product.productType || product.product_type,
          bundle: product.bundle,
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

  const getVariantKey = (variant: ProductVariant) => {
    return variant._id || variant.name;
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
      await handleAddToCart(product.id);
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

  const handleOpenVariantSheet = (product: Product) => {
    setActiveProduct(product);
    setVariantSheetOpen(true);
  };

  const handleVariantSheetChange = (open: boolean) => {
    setVariantSheetOpen(open);
    if (!open) {
      setActiveProduct(null);
    }
  };

  const activeHasVariants = (activeProduct?.variants?.length ?? 0) > 0;

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
                const hasVariants = (product.variants?.length ?? 0) > 0;
                const isBundle = product.productType === "bundle";
                const cartQuantity = getCartQuantityForProduct(product.id);

              return (
                  <div key={product.id} className="flex flex-col items-center text-center space-y-4 w-full">
                    {/* Product Image */}
                    <Link
                      to={`/products/${product.id}`}
                      className="relative w-full h-80 md:h-96 overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={primaryImage}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Product Info */}
                    <div className="space-y-2 w-full">
                      <Link to={`/products/${product.id}`} className="block hover:text-green-200 transition-colors">
                        <h3 className="text-xl md:text-2xl font-bold text-white">{product.title}</h3>
                      </Link>
                      <p className="text-sm md:text-base text-white/80">{tagline}</p>
                      {(() => {
                        if (cartQuantity > 0) {
                          return (
                            <div className="flex items-center justify-center gap-2 mt-4">
                              <Button
                                size="icon"
                                className="bg-green-800 text-white hover:bg-green-900 h-10 w-10 rounded-full"
                                onClick={() => handleDecrement(product)}
                              >
                                -
                              </Button>
                              <span className="text-white font-semibold text-lg min-w-[2rem] text-center">
                                {cartQuantity}
                              </span>
                              <Button
                                size="icon"
                                className="bg-green-800 text-white hover:bg-green-900 h-10 w-10 rounded-full"
                                onClick={() => handleIncrement(product)}
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
                              onClick={() => {
                                if (isBundle) {
                                  void handleOpenBundleSheet(product);
                                } else {
                                  handleOpenVariantSheet(product);
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

    {/* Footer with bg-green.png background */}
    <Footer />

    {/* Auth Sheet */}
    <AuthSheet open={authSheetOpen} onOpenChange={setAuthSheetOpen} defaultMode={authMode} />

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

            {(activeProduct.variants?.length ?? 0) > 0 ? (
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
            Select exactly {activeBundleProduct?.bundle?.size ?? "--"} items from the list below.
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
                  Bundle size: <span className="font-semibold">{activeBundleProduct.bundle?.size ?? "--"}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm">
              <span className="text-gray-700">Selected items</span>
              <span className={cn("font-semibold", getBundleTotalCount(bundleSelections) === (activeBundleProduct.bundle?.size ?? 0) ? "text-green-700" : "text-gray-900")}>
                {getBundleTotalCount(bundleSelections)}/{activeBundleProduct.bundle?.size ?? 0}
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
                  const bundleSize = activeBundleProduct.bundle?.size ?? 0;
                  const bundleTotal = getBundleTotalCount(bundleSelections);
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
            disabled={(activeBundleProduct?.bundle?.size ?? 0) === 0 || getBundleTotalCount(bundleSelections) !== (activeBundleProduct?.bundle?.size ?? 0)}
          >
            Add bundle
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  </div>
);
};
