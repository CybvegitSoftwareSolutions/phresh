import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { computeDiscountedPrice } from "@/utils/pricing";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AuthSheet } from "@/components/AuthSheet";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

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
      
      {/* Cart Content Section - white background */}
      <section className="py-16 bg-white min-h-screen">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600">
              {itemCount > 0 ? `${itemCount} item${itemCount > 1 ? 's' : ''} in your cart` : 'Your cart is empty'}
            </p>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2 text-gray-900">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Discover our fresh juices and add them to your cart.
              </p>
              <Button asChild size="lg" className="bg-green-800 text-white hover:bg-green-900">
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => {
                // Get primary image - handle both image_url and image_urls array
                const primaryImage = (item.product as any).image_urls?.[0] 
                  || item.product.image_url 
                  || (item.product as any).images?.[0]?.url 
                  || (item.product as any).images?.[0]
                  || "/api/placeholder/300/300";
                
                return (
                  <Card key={item._id} className="shadow-md border-gray-200">
                    <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
                        <img
                          src={primaryImage}
                          alt={item.product.name}
                          className="h-32 w-32 rounded-lg object-cover sm:h-28 sm:w-28"
                        />

                        <div className="flex-1 space-y-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            <Link 
                              to={`/products/${item.productId}`}
                              className="hover:text-green-800 transition-colors"
                            >
                              {item.product.name}
                            </Link>
                          </h3>
                          {item.variant_size && (
                            <div className="mt-1">
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">{item.variant_size}</Badge>
                            </div>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {(() => {
                              const base = item.variant_price ?? item.product.price;
                              const pricing = computeDiscountedPrice(item.product, base);
                              if (pricing.hasDiscount) {
                                const badgeText =
                                  pricing.discountType === "amount" ? "Sale" : pricing.discountLabel;
                                return (
                                  <>
                                    <span className="font-bold text-lg text-gray-900">Rs {formatCurrency(pricing.finalPrice)}</span>
                                    <span className="text-sm text-gray-500 line-through">
                                      Rs {formatCurrency(pricing.basePrice)}
                                    </span>
                                    {badgeText && (
                                      <Badge className="text-xs bg-green-800 text-white">
                                        {badgeText}
                                      </Badge>
                                    )}
                                  </>
                                );
                              }
                              return <span className="font-bold text-lg text-gray-900">Rs {formatCurrency(pricing.basePrice)}</span>;
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full border-gray-300 hover:bg-green-50"
                            onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value) || 1)}
                            className="h-10 w-16 text-center border-gray-300"
                            min="1"
                          />

                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full border-gray-300 hover:bg-green-50"
                            onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              </div>

              {/* Order Summary */}
              <div>
                <Card className="sticky top-24 shadow-lg border-gray-200">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-xl text-gray-900">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal ({itemCount} items)</span>
                        <span className="font-semibold">Rs {formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Shipping</span>
                        {isFreeShipping ? (
                          <span className="text-green-800 font-semibold">Free</span>
                        ) : (
                          <span className="font-semibold">Rs {formatCurrency(shippingCharge)}</span>
                        )}
                      </div>
                      <div className="border-t border-gray-300 pt-3 mt-3">
                        <div className="flex justify-between font-bold text-lg text-gray-900">
                          <span>Total</span>
                          <span>Rs {formatCurrency(finalTotal)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-green-800 text-white hover:bg-green-900 font-semibold" 
                      size="lg"
                      onClick={() => navigate("/checkout")}
                    >
                      Proceed to Checkout
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-gray-300 hover:bg-gray-50"
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
      </section>

      {/* Footer with bg.png background */}
      <Footer />

      {/* Auth Sheet */}
      <AuthSheet open={authSheetOpen} onOpenChange={setAuthSheetOpen} defaultMode={authMode} />
    </div>
  );
};
