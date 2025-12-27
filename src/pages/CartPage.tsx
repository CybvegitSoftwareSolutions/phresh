import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { useCart } from "@/hooks/useCart";
import { computeDiscountedPrice } from "@/utils/pricing";

interface ShippingSettings {
  _id: string;
  cod_enabled: boolean;
  delivery_charges: number;
  free_delivery_threshold: number;
  delivery_time: string;
  applicable_cities: string[];
}

export const CartPage = () => {
  const { items, updateQuantity, removeFromCart, getTotal } = useCart();
  const navigate = useNavigate();
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);

  const formatCurrency = (value: number) => Math.round(value).toLocaleString('en-IN');

  useEffect(() => {
    const fetchShippingSettings = async () => {
      try {
        const response = await apiService.getShippingSettings();
        if (response.success && response.data) {
          setShippingSettings(response.data);
        }
      } catch (e) {
        // Silent fail; fall back to defaults
        console.error('Failed to load shipping settings', e);
      }
    };
    fetchShippingSettings();
  }, []);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
  };

  const subtotal = getTotal();
  const threshold = shippingSettings?.free_delivery_threshold ?? null;
  const isFreeShipping = typeof threshold === 'number' && !Number.isNaN(threshold) && subtotal >= threshold;
  const shippingCharge = isFreeShipping ? 0 : (shippingSettings?.delivery_charges || 200);
  const finalTotal = subtotal + shippingCharge;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {itemCount > 0 ? `${itemCount} item${itemCount > 1 ? 's' : ''} in your cart` : 'Your cart is empty'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Discover our luxury fragrances and add them to your cart.
            </p>
            <Button asChild size="lg">
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item._id}>
                  <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
                      <img
                        src={item.product.image_url || "/api/placeholder/120/120"}
                        alt={item.product.name}
                        className="h-24 w-24 rounded-md object-cover sm:h-20 sm:w-20"
                      />

                      <div className="flex-1 space-y-2 text-sm sm:text-base">
                        <h3 className="font-semibold text-lg">
                          <Link 
                            to={`/products/${item.productId}`}
                            className="hover:text-primary transition-colors"
                          >
                            {item.product.name}
                          </Link>
                        </h3>
                        {item.variant_size && (
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-[10px]">{item.variant_size}</Badge>
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                          {(() => {
                            const base = item.variant_price ?? item.product.price;
                            const pricing = computeDiscountedPrice(item.product, base);
                            if (pricing.hasDiscount) {
                              const badgeText =
                                pricing.discountType === "amount" ? "Sale" : pricing.discountLabel;
                              return (
                                <>
                                  <span className="font-bold">Rs {formatCurrency(pricing.finalPrice)}</span>
                                  <span className="text-sm text-muted-foreground line-through">
                                    Rs {formatCurrency(pricing.basePrice)}
                                  </span>
                                  {badgeText && (
                                    <Badge variant="secondary" className="text-xs">
                                      {badgeText}
                                    </Badge>
                                  )}
                                </>
                              );
                            }
                            return <span className="font-bold">Rs {formatCurrency(pricing.basePrice)}</span>;
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value) || 1)}
                          className="h-9 w-16 text-center"
                          min="1"
                        />

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal ({itemCount} items)</span>
                      <span>Rs {formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      {isFreeShipping ? (
                        <span className="text-green-600 font-semibold">Free</span>
                      ) : (
                        <span>Rs {formatCurrency(shippingCharge)}</span>
                      )}
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>Rs {formatCurrency(finalTotal)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate("/checkout")}
                  >
                    Proceed to Checkout
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    asChild
                  >
                    <Link to="/products">Continue Shopping</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
