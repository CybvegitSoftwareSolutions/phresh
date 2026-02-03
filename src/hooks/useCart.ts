import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { computeDiscountedPrice } from "@/utils/pricing";

export interface CartItem {
  _id: string;
  productId: string;
  quantity: number;
  variant_id?: string | null;
  variant_size?: string | null;
  variant_price?: number | null;
  productType?: string | null;
  bundle_signature?: string | null;
  bundleItems?: Array<{
    productId: string;
    quantity: number;
    variant_id?: string | null;
    variant_size?: string | null;
    variant_price?: number | null;
    product?: {
      _id: string;
      name: string;
      price: number;
      image_url?: string | null;
      image_urls?: string[] | null;
      images?: any[] | null;
    };
  }>;
  product: {
    _id: string;
    name: string;
    price: number;
    discount: number | null;
    discount_amount?: number | null;
    discount_type?: "percentage" | "amount" | null;
    image_url: string | null;
    image_urls?: string[] | null;
    images?: any[] | null;
  };
}

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const CART_EVENT = "cart-items-updated";
  const CART_STORAGE_KEY = "phresh_cart";

  const setItemsAndBroadcast = (updatedItems: CartItem[]) => {
    setItems(updatedItems);
    // Always save to localStorage immediately
    if (typeof window !== "undefined") {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedItems));
      window.dispatchEvent(new CustomEvent<CartItem[]>(CART_EVENT, { detail: updatedItems }));
    }
  };

  // Load cart from localStorage on mount
  useEffect(() => {
    loadCartFromStorage();
  }, []);

  useEffect(() => {
    const handleCartUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<CartItem[]>;
      if (customEvent.detail) {
        setItems(customEvent.detail);
      } else {
        loadCartFromStorage();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener(CART_EVENT, handleCartUpdated);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(CART_EVENT, handleCartUpdated);
      }
    };
  }, []);

  // Load cart from localStorage (only storage)
  const loadCartFromStorage = () => {
    if (typeof window === "undefined") return;
    
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        const parsedCart = JSON.parse(stored);
        setItems(parsedCart);
      } catch (error) {
        console.error("Error parsing cart from storage:", error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  };

  // Add to cart - uses localStorage only (instant, no API calls)
  const addToCart = async (
    productId: string,
    quantity: number = 1,
    options?: {
      variantId?: string;
      variantSize?: string;
      variantPrice?: number;
      bundleItems?: Array<{
        productId: string;
        quantity: number;
        variantId?: string | null;
        variantSize?: string | null;
        variantPrice?: number | null;
        product?: {
          _id: string;
          name: string;
          price: number;
          image_url?: string | null;
          image_urls?: string[] | null;
          images?: any[] | null;
        };
      }>;
      productType?: string;
    }
  ) => {
    setLoading(true);
    try {
      // Get product details from backend (needed for product info)
      const response = await apiService.getProduct(productId);
      if (!response.success || !response.data) {
        toast({
          title: "Error",
          description: "Product not found",
          variant: "destructive"
        });
        return;
      }

      // Parse product data (handle nested response structure)
      const raw = response.data as any;
      let productData = raw;
      if (raw?.data?.data && Array.isArray(raw.data.data)) {
        productData = raw.data.data[0];
      } else if (raw?.data && !Array.isArray(raw.data)) {
        productData = raw.data;
      }

      const product = productData;
      const normalizeBundleSignature = (bundleItems?: CartItem["bundleItems"]) => {
        if (!bundleItems || bundleItems.length === 0) return null;
        const normalized = bundleItems
          .map((bundleItem) => ({
            productId: bundleItem.productId,
            quantity: bundleItem.quantity,
            variant_id: bundleItem.variant_id ?? null,
            variant_size: bundleItem.variant_size ?? null
          }))
          .sort((a, b) => {
            if (a.productId !== b.productId) return a.productId.localeCompare(b.productId);
            if ((a.variant_id ?? "") !== (b.variant_id ?? "")) return (a.variant_id ?? "").localeCompare(b.variant_id ?? "");
            return (a.variant_size ?? "").localeCompare(b.variant_size ?? "");
          });
        return JSON.stringify(normalized);
      };

      const productType = options?.productType || product.productType || "regular";
      const preparedBundleItems = (options?.bundleItems || [])
        .map((bundleItem) => ({
          productId: bundleItem.productId,
          quantity: bundleItem.quantity,
          variant_id: bundleItem.variantId ?? bundleItem.variant_id ?? null,
          variant_size: bundleItem.variantSize ?? bundleItem.variant_size ?? null,
          variant_price: bundleItem.variantPrice ?? bundleItem.variant_price ?? null,
          product: bundleItem.product
        }))
        .filter((bundleItem) => bundleItem.quantity > 0);
      const bundleSignature = normalizeBundleSignature(preparedBundleItems);

      const existingIndex = items.findIndex(item => {
        if (item.productId !== productId) return false;
        const isBundle = (item.productType ?? productType) === "bundle" || !!item.bundleItems?.length;
        if (isBundle) {
          return (item.bundle_signature ?? null) === bundleSignature;
        }
        return (
          (item.variant_id ?? null) === (options?.variantId ?? null) &&
          (item.variant_size ?? null) === (options?.variantSize ?? null)
        );
      });
      
      let newItems: CartItem[];

      if (existingIndex >= 0) {
        // Update existing item quantity
        newItems = [...items];
        newItems[existingIndex].quantity += quantity;
        if (options?.variantPrice !== undefined) newItems[existingIndex].variant_price = options.variantPrice;
        if (options?.variantSize !== undefined) newItems[existingIndex].variant_size = options.variantSize;
        if (options?.variantId !== undefined) newItems[existingIndex].variant_id = options.variantId;
        if (bundleSignature) {
          newItems[existingIndex].bundle_signature = bundleSignature;
          newItems[existingIndex].bundleItems = preparedBundleItems;
          newItems[existingIndex].productType = productType;
        }
      } else {
        // Add new item
        const newItem: CartItem = {
          _id: `local-${Date.now()}-${Math.random()}`,
          productId: productId,
          quantity,
          variant_id: options?.variantId ?? null,
          variant_size: options?.variantSize ?? null,
          variant_price: options?.variantPrice ?? null,
          productType,
          bundle_signature: bundleSignature,
          bundleItems: preparedBundleItems.length > 0 ? preparedBundleItems : undefined,
          product: {
            _id: product._id || productId,
            name: product.name,
            price: product.price,
            discount: product.discount || null,
            discount_amount: product.discount_amount || null,
            discount_type: product.discount_type || null,
            image_url: product.image_url || product.images?.[0]?.url || product.images?.[0] || null,
            image_urls: product.image_urls || product.images?.map((img: any) => img.url || img) || [product.image_url].filter(Boolean),
            images: product.images || null
          }
        };
        newItems = [...items, newItem];
      }

      // Update localStorage immediately (instant UX)
      setItemsAndBroadcast(newItems);
      
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove from cart - uses localStorage only (instant, no API calls)
  const removeFromCart = async (itemId: string) => {
    const newItems = items.filter(item => item._id !== itemId);
    
    // Update localStorage immediately (instant UX)
    setItemsAndBroadcast(newItems);
    
    toast({
      title: "Removed",
      description: "Item removed from cart"
    });
  };

  // Update quantity - uses localStorage only (instant, no API calls)
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    const newItems = items.map(item =>
      item._id === itemId ? { ...item, quantity } : item
    );
    
    // Update localStorage immediately (instant UX)
    setItemsAndBroadcast(newItems);
  };

  // Clear cart - uses localStorage only (instant, no API calls)
  const clearCart = async () => {
    // Clear localStorage immediately (instant UX)
    setItemsAndBroadcast([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      const base = item.variant_price ?? item.product.price;
      const { finalPrice } = computeDiscountedPrice(item.product, base);
      return total + finalPrice * item.quantity;
    }, 0);
  };

  return {
    items,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
  };
};
