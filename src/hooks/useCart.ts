import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { computeDiscountedPrice } from "@/utils/pricing";

export interface CartItem {
  _id: string;
  productId: string;
  quantity: number;
  variant_size?: string | null;
  variant_price?: number | null;
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
    options?: { variantSize?: string; variantPrice?: number }
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
      const existingIndex = items.findIndex(item => 
        item.productId === productId && 
        item.variant_size === (options?.variantSize ?? null)
      );
      
      let newItems: CartItem[];

      if (existingIndex >= 0) {
        // Update existing item quantity
        newItems = [...items];
        newItems[existingIndex].quantity += quantity;
        if (options?.variantPrice !== undefined) newItems[existingIndex].variant_price = options.variantPrice;
        if (options?.variantSize !== undefined) newItems[existingIndex].variant_size = options.variantSize;
      } else {
        // Add new item
        const newItem: CartItem = {
          _id: `local-${Date.now()}-${Math.random()}`,
          productId: productId,
          quantity,
          variant_size: options?.variantSize ?? null,
          variant_price: options?.variantPrice ?? null,
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