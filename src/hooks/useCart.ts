import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { useAuth } from "./useAuth";
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
  const { user } = useAuth();
  const CART_EVENT = "cart-items-updated";

  const setItemsAndBroadcast = (updatedItems: CartItem[]) => {
    setItems(updatedItems);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent<CartItem[]>(CART_EVENT, { detail: updatedItems }));
    }
  };

  // Load cart items from localStorage or database
  useEffect(() => {
    if (user) {
      loadCartFromDatabase();
    } else {
      loadCartFromStorage();
    }
  }, [user]);

  useEffect(() => {
    const handleCartUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<CartItem[]>;
      if (customEvent.detail) {
        setItems(customEvent.detail);
      } else if (!user) {
        loadCartFromStorage();
      } else {
        loadCartFromDatabase();
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
  }, [user]);

  const loadCartFromStorage = () => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try {
        const parsedCart = JSON.parse(stored);
        setItemsAndBroadcast(parsedCart);
      } catch (error) {
        console.error("Error parsing cart from storage:", error);
      }
    }
  };

  const loadCartFromDatabase = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await apiService.getCart();
      if (response.success && response.data?.items) {
        // Ensure productId is set for all items (backend might return product._id instead)
        // Also ensure image data is properly preserved
        const mappedItems = response.data.items.map((item: any) => ({
          ...item,
          productId: item.productId || item.product?._id,
          product: {
            ...item.product,
            image_url: item.product?.image_url || item.product?.images?.[0]?.url || item.product?.images?.[0] || null,
            image_urls: item.product?.image_urls || item.product?.images?.map((img: any) => img.url || img) || [item.product?.image_url].filter(Boolean),
            images: item.product?.images || null
          }
        }));
        setItemsAndBroadcast(mappedItems);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (
    productId: string,
    quantity: number = 1,
    options?: { variantSize?: string; variantPrice?: number }
  ) => {
    if (user) {
      await addToCartDatabase(productId, quantity, options);
    } else {
      await addToCartStorage(productId, quantity, options);
    }
  };

  const addToCartStorage = async (productId: string, quantity: number, options?: { variantSize?: string; variantPrice?: number }) => {
    // First get product details from backend
    try {
      const response = await apiService.getProduct(productId);
      if (!response.success || !response.data) {
        toast({
          title: "Error",
          description: "Product not found",
          variant: "destructive"
        });
        return;
      }

      const product = response.data;
      const existingIndex = items.findIndex(item => item.productId === productId);
      let newItems: CartItem[];

      if (existingIndex >= 0) {
        newItems = [...items];
        newItems[existingIndex].quantity += quantity;
        // Update variant if provided (single-variant per product in cart)
        if (options?.variantPrice !== undefined) newItems[existingIndex].variant_price = options.variantPrice;
        if (options?.variantSize !== undefined) newItems[existingIndex].variant_size = options.variantSize;
      } else {
        const newItem: CartItem = {
          _id: `temp-${Date.now()}`,
          productId: productId,
          quantity,
          variant_size: options?.variantSize ?? null,
          variant_price: options?.variantPrice ?? null,
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            discount: product.discount,
            discount_amount: product.discount_amount,
            discount_type: product.discount_type,
            image_url: product.image_url || product.images?.[0]?.url || product.images?.[0] || null,
            image_urls: product.image_urls || product.images?.map((img: any) => img.url || img) || [product.image_url].filter(Boolean),
            images: product.images || null
          }
        };
        newItems = [...items, newItem];
      }

      setItemsAndBroadcast(newItems);
      localStorage.setItem("cart", JSON.stringify(newItems));
      
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
    }
  };

  const addToCartDatabase = async (productId: string, quantity: number, options?: { variantSize?: string; variantPrice?: number }) => {
    try {
      const response = await apiService.addToCart({
        productId,
        quantity,
        variant_size: options?.variantSize,
        variant_price: options?.variantPrice
      });

      if (response.success) {
        await loadCartFromDatabase();
        
        toast({
          title: "Added to cart",
          description: "Product has been added to your cart."
        });
      } else {
        throw new Error(response.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive"
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (user) {
      try {
        const response = await apiService.removeFromCart(itemId);
        if (response.success) {
          await loadCartFromDatabase();
        } else {
          throw new Error(response.message || "Failed to remove from cart");
        }
      } catch (error) {
        console.error("Error removing from cart:", error);
        toast({
          title: "Error",
          description: "Failed to remove item from cart",
          variant: "destructive"
        });
      }
    } else {
      const newItems = items.filter(item => item._id !== itemId);
      setItemsAndBroadcast(newItems);
      localStorage.setItem("cart", JSON.stringify(newItems));
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    if (user) {
      try {
        const response = await apiService.updateCartItem(itemId, quantity);
        if (response.success) {
          await loadCartFromDatabase();
        } else {
          throw new Error(response.message || "Failed to update quantity");
        }
      } catch (error) {
        console.error("Error updating quantity:", error);
        toast({
          title: "Error",
          description: "Failed to update quantity",
          variant: "destructive"
        });
      }
    } else {
      const newItems = items.map(item =>
        item._id === itemId ? { ...item, quantity } : item
      );
      setItemsAndBroadcast(newItems);
      localStorage.setItem("cart", JSON.stringify(newItems));
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        const response = await apiService.clearCart();
        if (response.success) {
          setItemsAndBroadcast([]);
        } else {
          throw new Error(response.message || "Failed to clear cart");
        }
      } catch (error) {
        console.error("Error clearing cart:", error);
        toast({
          title: "Error",
          description: "Failed to clear cart",
          variant: "destructive"
        });
      }
    } else {
      setItemsAndBroadcast([]);
      localStorage.removeItem("cart");
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