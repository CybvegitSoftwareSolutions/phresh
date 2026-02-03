import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, CreditCard, Truck, MapPin, Phone, Mail, User, Building2, Droplet } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiService } from "@/services/api";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { computeDiscountedPrice } from "@/utils/pricing";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AuthSheet } from "@/components/AuthSheet";
import { cn } from "@/lib/utils";

// live key : pk_live_51SsNe2DBPVs6GDkm064tuvJs7kDMYG0G1Lr4BpbA2DACJricwZ6N89Pkvw8z0o6bBqB6cia30CPNIeKNtLSqBGM800j0D0TG1K
// test key : pk_test_51SsNe2DBPVs6GDkmnLZ2Q9tOqumPhuAeHd7CGsf9eJ55pSV0fJwwxmlm3KWnVopcaCux0FiBY7mLY7b72sUgxeuJ00ZTkcq36O
// Initialize Stripe - Replace with your publishable key
const stripePromise = loadStripe('pk_live_51SsNe2DBPVs6GDkm064tuvJs7kDMYG0G1Lr4BpbA2DACJricwZ6N89Pkvw8z0o6bBqB6cia30CPNIeKNtLSqBGM800j0D0TG1K');

interface ShippingSettings {
  _id: string;
  cod_enabled: boolean;
  delivery_charges: number;
  free_delivery_threshold: number;
  delivery_time: string;
  applicable_cities: string[];
}

interface PaymentSettings {
  _id: string;
  cod_enabled: boolean;
  mobile_payment_enabled: boolean;
  instructions: string;
  contact_email: string;
  contact_whatsapp: string;
  account_title: string;
  account_number: string;
  iban: string;
  bank_name: string;
}

// Stripe Payment Wrapper Component
const StripePaymentWrapper = ({
  orderId,
  orderNumber,
  amount,
  email,
  onPaymentSuccess,
}: {
  orderId: string;
  orderNumber: string;
  amount: number;
  email: string;
  onPaymentSuccess: (orderNumber: string) => void;
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [displayAmount, setDisplayAmount] = useState<number>(amount);
  const { toast } = useToast();

  useEffect(() => {
    const createIntent = async () => {
      try {
        const response = await apiService.createPaymentIntent({
          orderId: orderId,
          orderNumber,
          email,
          amount: Number(amount.toFixed(2)),
          currency: 'gbp'
        });

        if (response.success && response.data?.clientSecret) {
          setClientSecret(response.data.clientSecret);
          const payable =
            Number(response.data?.totalWithFees ?? response.data?.amount ?? amount);
          if (Number.isFinite(payable)) {
            setDisplayAmount(payable);
          }
        } else {
          throw new Error(response.message || 'Failed to create payment intent');
        }
      } catch (error: any) {
        toast({
          title: "Payment Error",
          description: error.message || "Failed to initialize payment",
          variant: "destructive"
        });
      }
    };

    createIntent();
  }, [orderId, toast, amount]);

  if (!clientSecret) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Initializing payment...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripePaymentForm
        amount={amount}
        displayAmount={displayAmount}
        orderId={orderId}
        orderNumber={orderNumber}
        onPaymentSuccess={onPaymentSuccess}
      />
    </Elements>
  );
};

// Stripe Payment Form Component
const StripePaymentForm = ({ amount, displayAmount, orderId, orderNumber, onPaymentSuccess }: { amount: number; displayAmount: number; orderId: string; orderNumber: string; onPaymentSuccess: (orderNumber: string) => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePaymentSubmit = async () => {

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation/${orderNumber}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed",
          variant: "destructive"
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Clear cart immediately on successful payment
        onPaymentSuccess(orderNumber);
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred during payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <div className="space-y-4">
          <PaymentElement />
          <Button
            type="button"
            disabled={!stripe || isProcessing}
            className="w-full bg-green-800 text-white hover:bg-green-900"
            onClick={handlePaymentSubmit}
          >
            {isProcessing ? "Processing..." : `Pay £${displayAmount.toFixed(2)}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const CheckoutPage = () => {
  const [loading, setLoading] = useState(false);
  const [bypassEmptyCartRedirect, setBypassEmptyCartRedirect] = useState(false);
  const { items, clearCart, getTotal } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [stripeOrderId, setStripeOrderId] = useState<string | null>(null);
  const [stripeOrderNumber, setStripeOrderNumber] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  // Saved addresses
  type SavedAddress = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    is_default: boolean;
  };
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [originalAddress, setOriginalAddress] = useState<SavedAddress | null>(null);

  const [formData, setFormData] = useState({
    // Contact
    email: user?.email || "",
    newsletter: false,

    // Delivery/Shipping Address
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",

    // Billing Address
    sameAsBilling: true,
    billingFirstName: "",
    billingLastName: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingPostalCode: "",

    // Payment
    paymentMethod: "cod",

    // Additional
    notes: "",
    saveInfo: false
  });

  // Prefill email from user profile when authenticated
  useEffect(() => {
    if (user?.email && formData.email !== user.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  useEffect(() => {
    // Wait for auth to be ready first
    if (authLoading) return;

    // Cart is now loaded synchronously from localStorage (no DB sync needed)
    // Redirect to cart if empty (unless bypassing for "Buy It Now" flow)
    if (items.length === 0 && !bypassEmptyCartRedirect) {
      navigate("/cart");
      return;
    }

    fetchShippingSettings();
    fetchPaymentSettings();
  }, [authLoading, items, navigate, bypassEmptyCartRedirect]);

  // Load saved addresses for logged-in user
  useEffect(() => {
    const loadAddresses = async () => {
      if (!user) {
        setSavedAddresses([]);
        setSelectedAddressId('new');
        return;
      }
      setAddressesLoading(true);
      try {
        const response = await apiService.getAddresses();
        console.log('Addresses API response:', response); // Debug log
        if (response.success && response.data) {
          // Handle both array and object with data property
          const addressesArray = Array.isArray(response.data)
            ? response.data
            : (response.data.addresses || response.data.data || []);

          const list = addressesArray.map((addr: any) => ({
            id: addr._id || addr.id,
            first_name: addr.firstName || addr.first_name,
            last_name: addr.lastName || addr.last_name,
            email: addr.email,
            phone: addr.phone,
            address: addr.street || addr.address,
            city: addr.city,
            state: addr.state,
            postal_code: addr.zipCode || addr.postal_code,
            is_default: addr.is_default || false
          }));

          console.log('Mapped addresses:', list); // Debug log
          setSavedAddresses(list);

          // If a default address exists, preselect and apply it
          const defaultAddr = list.find(a => a.is_default) || list[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            applySavedAddress(defaultAddr);
          } else {
            setSelectedAddressId('new');
          }
        } else {
          console.log('No addresses found or API error:', response);
          setSavedAddresses([]);
          setSelectedAddressId('new');
        }
      } catch (e) {
        console.error('Failed to load saved addresses', e);
        setSavedAddresses([]);
        setSelectedAddressId('new');
      } finally {
        setAddressesLoading(false);
      }
    };
    loadAddresses();
  }, [user?._id, user]);

  const applySavedAddress = (addr: SavedAddress) => {
    setFormData(prev => ({
      ...prev,
      email: addr.email || prev.email,
      firstName: addr.first_name || prev.firstName,
      lastName: addr.last_name || prev.lastName,
      address: addr.address || prev.address,
      city: addr.city || prev.city,
      state: addr.state || prev.state,
      postalCode: addr.postal_code || prev.postalCode,
      phone: addr.phone || prev.phone,
    }));
    setOriginalAddress(addr);
  };

  // Detect if current form differs from the originally loaded saved address
  const hasAddressChanges = (() => {
    if (!user) return false;
    if (!originalAddress) return selectedAddressId === 'new' ? true : false;
    return (
      (formData.email || '') !== (originalAddress.email || '') ||
      (formData.firstName || '') !== (originalAddress.first_name || '') ||
      (formData.lastName || '') !== (originalAddress.last_name || '') ||
      (formData.address || '') !== (originalAddress.address || '') ||
      (formData.city || '') !== (originalAddress.city || '') ||
      (formData.state || '') !== (originalAddress.state || '') ||
      (formData.postalCode || '') !== (originalAddress.postal_code || '') ||
      (formData.phone || '') !== (originalAddress.phone || '')
    );
  })();

  const fetchShippingSettings = async () => {
    try {
      const response = await apiService.getShippingSettings();
      if (response.success && response.data) {
        setShippingSettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching shipping settings:', error);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const response = await apiService.getPaymentSettings();
      if (response.success && response.data) {
        setPaymentSettings({
          _id: response.data._id,
          cod_enabled: Boolean(response.data.cod_enabled),
          mobile_payment_enabled: Boolean(response.data.mobile_payment_enabled),
          instructions: response.data.instructions,
          contact_email: response.data.contact_email,
          contact_whatsapp: response.data.contact_whatsapp,
          account_title: response.data.account_title,
          account_number: response.data.account_number,
          iban: response.data.iban,
          bank_name: response.data.bank_name,
        });
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const formatCurrency = (value: number) => Math.round(value).toLocaleString('en-IN');

  const total = getTotal();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const threshold = shippingSettings?.free_delivery_threshold ?? null;
  const isFreeShipping =
    typeof threshold === 'number' && !Number.isNaN(threshold) && threshold > 0 && total >= threshold;
  const shippingCharge = isFreeShipping
    ? 0
    : (shippingSettings?.delivery_charges || 200);
  const finalTotal = Math.max(0, total + shippingCharge - (couponApplied ? couponDiscount : 0));

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      if (field === 'paymentMethod' && paymentSettings) {
        if (value === 'cod' && !paymentSettings.cod_enabled) return prev;
        if (value === 'stripe' && !paymentSettings.mobile_payment_enabled) return prev;
      }
      return { ...prev, [field]: value };
    });
  };

  useEffect(() => {
    if (!paymentSettings) return;

    setFormData((prev) => {
      let paymentMethod = prev.paymentMethod;
      if (paymentSettings.cod_enabled && !paymentSettings.mobile_payment_enabled) {
        paymentMethod = 'cod';
      } else if (!paymentSettings.cod_enabled && paymentSettings.mobile_payment_enabled) {
        paymentMethod = 'stripe';
      } else if (!paymentSettings.cod_enabled && !paymentSettings.mobile_payment_enabled) {
        paymentMethod = 'cod';
      }
      return { ...prev, paymentMethod };
    });
  }, [paymentSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email is always present (required for order history matching)
    if (!formData.email || !formData.email.trim()) {
      toast({
        title: "Email Required",
        description: "Please provide your email address.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.city) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (First name, Last name, City, Phone).",
        variant: "destructive"
      });
      return;
    }

    // Validate state if user wants to save address
    if (user && formData.saveInfo && !formData.state) {
      toast({
        title: "State Required",
        description: "Please provide a state/province to save your address.",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Optionally save or update address for logged-in users when requested
      if (user && formData.saveInfo) {
        if (selectedAddressId === 'new') {
          // Insert new address
          const addressData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            street: formData.address,
            city: formData.city,
            state: formData.state || formData.city || "N/A", // Provide default if empty
            zipCode: formData.postalCode,
            country: "Pakistan",
            is_default: savedAddresses.length === 0
          };
          const response = await apiService.addAddress(addressData);
          if (response.success && response.data) {
            const newAddr = {
              id: response.data._id,
              first_name: response.data.firstName,
              last_name: response.data.lastName,
              email: response.data.email,
              phone: response.data.phone,
              address: response.data.street,
              city: response.data.city,
              state: response.data.state,
              postal_code: response.data.zipCode,
              is_default: response.data.is_default
            };
            setSavedAddresses(prev => [newAddr, ...prev]);
            setSelectedAddressId(newAddr.id);
            setOriginalAddress(newAddr);
            setFormData(prev => ({ ...prev, saveInfo: false }));
          }
        } else if (originalAddress && hasAddressChanges) {
          // Update existing address
          const updateData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            street: formData.address,
            city: formData.city,
            state: formData.state || formData.city || "N/A", // Provide default if empty
            zipCode: formData.postalCode,
          };
          const response = await apiService.updateAddress(selectedAddressId, updateData);
          if (response.success && response.data) {
            // Update local caches
            const updatedSnapshot: SavedAddress = {
              id: selectedAddressId,
              is_default: originalAddress.is_default,
              first_name: formData.firstName,
              last_name: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              postal_code: formData.postalCode,
            };
            setSavedAddresses(prev => prev.map(a => a.id === selectedAddressId ? updatedSnapshot : a));
            setOriginalAddress(updatedSnapshot);
            setFormData(prev => ({ ...prev, saveInfo: false }));
          }
        }
      }

      // Create order using backend API
      // Cart data is read directly from localStorage (no cart API calls needed)
      // Backend will validate all cart items, prices, and inventory
      // Always include email (backend uses it for order history based on email matching)

      // Map frontend payment method values to backend expected values
      const paymentMethodMap: Record<string, string> = {
        'cod': 'cash_on_delivery',
        'stripe': 'stripe'
      };
      const backendPaymentMethod = paymentMethodMap[formData.paymentMethod] || formData.paymentMethod;

      // Build order payload matching backend requirements exactly
      const orderData: any = {
        // Email: Always include for both guest and authenticated orders
        email: formData.email,
        // REQUIRED: Order items array
        items: items.map(item => {
          // Get product ID - use productId or fallback to product._id
          const productId = item.productId || item.product._id;

          if (!productId) {
            console.error('Missing product ID for item:', item);
            throw new Error(`Product ID is missing for item: ${item.product.name}`);
          }

          // Build item object
          const itemObj: any = {
            product: productId, // REQUIRED: MongoDB ObjectId
            quantity: item.quantity  // REQUIRED: min 1, integer
          };

          // OPTIONAL: Only include variantId if it exists
          if (item.variant_id) {
            itemObj.variantId = item.variant_id;
          }

          if (item.productType === "bundle" || (item.bundleItems && item.bundleItems.length > 0)) {
            itemObj.bundleItems = (item.bundleItems || []).map(bundleItem => ({
              product: bundleItem.productId,
              quantity: bundleItem.quantity,
              ...(bundleItem.variant_id ? { variantId: bundleItem.variant_id } : {})
            }));
          }

          return itemObj;
        }),
        // REQUIRED: Shipping address object
        shippingAddress: {
          name: `${formData.firstName} ${formData.lastName}`, // REQUIRED: 2-100 characters
          phone: formData.phone, // REQUIRED: valid phone format
          street: formData.address, // REQUIRED: 5-200 characters
          city: formData.city, // REQUIRED: 2-50 characters
          state: formData.state || formData.city || "N/A", // REQUIRED: 2-50 characters (use city or default if empty)
          zipCode: formData.postalCode || "00000", // REQUIRED: 3-10 characters (use default if empty)
          country: "Pakistan", // OPTIONAL: default "Pakistan"
          // OPTIONAL: Only include instructions if notes exist
          ...(formData.notes ? { instructions: formData.notes } : {})
        },
        // REQUIRED: Payment method (cash_on_delivery, stripe, bank_transfer)
        paymentMethod: backendPaymentMethod
      };

      // Debug: Log the order payload to verify structure
      console.log('Order payload being sent:', JSON.stringify(orderData, null, 2));

      // OPTIONAL: Only include notes if they exist
      if (formData.notes && formData.notes.trim()) {
        orderData.notes = formData.notes.trim();
      }

      if (couponApplied && couponCode.trim()) {
        orderData.couponCode = couponCode.trim();
      }

      // For Stripe payments, create order first, then handle payment
      if (backendPaymentMethod === 'stripe') {
        const orderResponse = await apiService.createOrder(orderData);

        console.log('Order response:', orderResponse);

        if (!orderResponse || !orderResponse.success) {
          let errorMessage = orderResponse?.message || orderResponse?.error || "Failed to create order";
          if (orderResponse?.errors && Array.isArray(orderResponse.errors)) {
            const errorDetails = orderResponse.errors.map((err: any) =>
              `${err.field}: ${err.message}`
            ).join(", ");
            errorMessage = `${errorMessage}. ${errorDetails}`;
          }
          throw new Error(errorMessage);
        }

        if (!orderResponse.data) {
          throw new Error("Order was created but no order data was returned. Please contact support.");
        }

        const orderId = orderResponse.data._id;
        const orderNumber = orderResponse.data.orderNumber;
        setStripeOrderId(orderId);
        setStripeOrderNumber(orderNumber);

        // Don't redirect yet - wait for Stripe payment to complete
        // The StripePaymentForm component will handle the payment flow
        setLoading(false);
        return;
      }

      // For COD and other payment methods, proceed with normal flow
      const orderResponse = await apiService.createOrder(orderData);

      console.log('Order response:', orderResponse);

      if (!orderResponse || !orderResponse.success) {
        let errorMessage = orderResponse?.message || orderResponse?.error || "Failed to create order";
        if (orderResponse?.errors && Array.isArray(orderResponse.errors)) {
          const errorDetails = orderResponse.errors.map((err: any) =>
            `${err.field}: ${err.message}`
          ).join(", ");
          errorMessage = `${errorMessage}. ${errorDetails}`;
        }
        throw new Error(errorMessage);
      }

      if (!orderResponse.data) {
        throw new Error("Order was created but no order data was returned. Please contact support.");
      }

      const orderNumber = orderResponse.data.orderNumber;
      const orderId = orderResponse.data._id;

      // For COD orders, clear cart immediately after successful order creation
      setBypassEmptyCartRedirect(true);
      clearCart();

      // Send confirmation email
      try {
        const siteUrl = (import.meta.env.VITE_SITE_URL || window.location.origin);
        const confirmationUrl = orderNumber ? `${siteUrl}/order-confirmation/${orderNumber}` : undefined;
        console.log('Order created successfully, email should be sent by backend');
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }

      // Save email to local storage for guest order history (if guest checkout)
      if (!user && formData.email) {
        localStorage.setItem('guest_email', formData.email);
      }

      // Redirect to thank you page
      if (orderNumber) {
        navigate(`/order-confirmation/${orderNumber}`, { replace: true });
      } else {
        console.error('Order number missing; not navigating to confirmation');
        toast({
          title: "Order Created",
          description: "Your order has been created but there was an issue with the confirmation. Please contact support.",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Order error:', error);
      const errorMessage = error?.message || error?.error || "There was an error processing your order. Please try again.";
      toast({
        title: "Order Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      toast({
        title: "Coupon required",
        description: "Please enter a coupon code to validate.",
        variant: "destructive"
      });
      return;
    }
    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const response = await apiService.validateCoupon({
        code,
        subtotal: Number(total.toFixed(2))
      });
      if (!response.success) {
        throw new Error(response.message || response.error || "Coupon validation failed");
      }

      const data = (response.data as any)?.data ?? response.data ?? {};
      const isValid = data?.isValid ?? data?.valid ?? true;
      if (!isValid) {
        throw new Error(data?.message || "Coupon is not valid");
      }

      const discountValue =
        Number(data?.discountAmount ?? data?.discount ?? data?.amount ?? data?.value ?? 0) || 0;
      setCouponDiscount(discountValue);
      setCouponApplied(true);
      setCouponMessage(data?.message || "Coupon applied successfully.");
      toast({
        title: "Coupon applied",
        description: data?.message || "Discount applied to your order."
      });
    } catch (error: any) {
      setCouponApplied(false);
      setCouponDiscount(0);
      setCouponMessage(error?.message || "Coupon validation failed.");
      toast({
        title: "Invalid coupon",
        description: error?.message || "Please check the coupon code.",
        variant: "destructive"
      });
    } finally {
      setCouponLoading(false);
    }
  };


  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-2 text-gray-900">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">
              Add some items to your cart before checkout.
            </p>
            <Button onClick={() => navigate("/products")} className="bg-green-800 text-white hover:bg-green-900">
              Continue Shopping
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Forms */}
              <div className="lg:col-span-2 space-y-6">

                {/* Contact Section */}
                <Card className="shadow-md border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="newsletter"
                        checked={formData.newsletter}
                        onCheckedChange={(checked) => handleInputChange('newsletter', checked as boolean)}
                      />
                      <Label htmlFor="newsletter" className="text-sm">
                        Email me with news and offers
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Section */}
                <Card className="shadow-md border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Delivery
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {user && (
                      <div>
                        <Label>Saved addresses</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          <Select
                            value={selectedAddressId}
                            onValueChange={(val) => {
                              setSelectedAddressId(val);
                              if (val === 'new') {
                                setOriginalAddress(null);
                                // Clear form data when selecting new address
                                setFormData(prev => ({
                                  ...prev,
                                  firstName: "",
                                  lastName: "",
                                  address: "",
                                  city: "",
                                  state: "",
                                  postalCode: "",
                                  phone: ""
                                }));
                                return;
                              }
                              const addr = savedAddresses.find(a => a.id === val);
                              if (addr) applySavedAddress(addr);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={addressesLoading ? 'Loading addresses...' : savedAddresses.length === 0 ? 'No saved addresses' : 'Choose an address'} />
                            </SelectTrigger>
                            <SelectContent>
                              {savedAddresses.length > 0 ? (
                                savedAddresses.map(a => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {`${a.first_name} ${a.last_name} — ${a.address}${a.city ? `, ${a.city}` : ''}`}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="new" disabled>
                                  No saved addresses
                                </SelectItem>
                              )}
                              <SelectItem value="new">Enter new address…</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="text-xs text-muted-foreground self-center">
                            Manage saved addresses in your Profile.
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="country">Country/Region</Label>
                      <Select defaultValue="pakistan">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pakistan">Pakistan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="House number and street name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="e.g., Sindh, Punjab, KPK"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="postalCode">Postal code (optional)</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                    </div>

                    {user && (selectedAddressId === 'new' || hasAddressChanges) && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="saveInfo"
                            checked={formData.saveInfo}
                            onCheckedChange={(checked) => handleInputChange('saveInfo', checked as boolean)}
                          />
                          <Label htmlFor="saveInfo" className="text-sm">
                            Save this information for next time
                          </Label>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Shipping Method */}
                <Card className="shadow-md border-gray-200">
                  <CardHeader>
                    <CardTitle>Shipping method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Standard</span>
                        {isFreeShipping ? (
                          <span className="font-semibold text-green-600">Free</span>
                        ) : (
                          <span className="font-semibold">£{formatCurrency(shippingCharge)}</span>
                        )}
                      </div>
                      {!isFreeShipping && typeof threshold === 'number' && threshold > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Free shipping for orders over £{formatCurrency(threshold)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Section */}
                <Card className="shadow-md border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">All transactions are secure and encrypted.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {paymentSettings ? (
                      <RadioGroup
                        value={formData.paymentMethod}
                        onValueChange={(value) => handleInputChange('paymentMethod', value)}
                      >
                        <div className="space-y-3">
                          {paymentSettings.cod_enabled && (
                            <div className="flex items-center space-x-2 p-3 border rounded-lg">
                              <RadioGroupItem value="cod" id="cod" />
                              <Label htmlFor="cod">Cash on Delivery (COD)</Label>
                            </div>
                          )}

                          {paymentSettings.mobile_payment_enabled && (
                            <div className="flex items-center space-x-2 p-3 border rounded-lg">
                              <RadioGroupItem value="stripe" id="stripe" />
                              <Label htmlFor="stripe">Online Payment (Stripe)</Label>
                            </div>
                          )}

                          {!paymentSettings.cod_enabled && !paymentSettings.mobile_payment_enabled && (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                              No payment methods are currently available. Please contact support to complete your order.
                            </div>
                          )}
                        </div>
                      </RadioGroup>
                    ) : (
                      <p className="text-sm text-muted-foreground">Loading payment options…</p>
                    )}

                    {paymentSettings?.mobile_payment_enabled && formData.paymentMethod === 'stripe' && stripeOrderId && stripeOrderNumber && (
                      <StripePaymentWrapper
                        orderId={stripeOrderId}
                        orderNumber={stripeOrderNumber}
                        amount={finalTotal}
                        email={formData.email}
                        onPaymentSuccess={(orderNumber) => {
                          setBypassEmptyCartRedirect(true);
                          clearCart();
                          navigate(`/order-confirmation/${orderNumber}`, { replace: true });
                        }}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Billing Address */}
                <Card className="shadow-md border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Billing address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sameAsBilling"
                        checked={formData.sameAsBilling}
                        onCheckedChange={(checked) => handleInputChange('sameAsBilling', checked as boolean)}
                      />
                      <Label htmlFor="sameAsBilling">Same as shipping address</Label>
                    </div>

                    {!formData.sameAsBilling && (
                      <div className="space-y-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="billingFirstName">First name</Label>
                            <Input
                              id="billingFirstName"
                              value={formData.billingFirstName}
                              onChange={(e) => handleInputChange('billingFirstName', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="billingLastName">Last name</Label>
                            <Input
                              id="billingLastName"
                              value={formData.billingLastName}
                              onChange={(e) => handleInputChange('billingLastName', e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="billingAddress">Address</Label>
                          <Input
                            id="billingAddress"
                            value={formData.billingAddress}
                            onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="billingCity">City</Label>
                            <Input
                              id="billingCity"
                              value={formData.billingCity}
                              onChange={(e) => handleInputChange('billingCity', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="billingPostalCode">Postal code</Label>
                            <Input
                              id="billingPostalCode"
                              value={formData.billingPostalCode}
                              onChange={(e) => handleInputChange('billingPostalCode', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Order Summary */}
              <div>
                <Card className="sticky top-24 shadow-lg border-gray-200">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {items.map((item) => {
                        const basePrice = item.variant_price ?? item.product.price;
                        const pricing = computeDiscountedPrice(item.product, basePrice);
                        const lineTotal = pricing.finalPrice * item.quantity;

                        // Get primary image
                        const primaryImage = (item.product as any).image_urls?.[0]
                          || item.product.image_url
                          || (item.product as any).images?.[0]?.url
                          || (item.product as any).images?.[0];
                        const hasImage = !!primaryImage;

                        return (
                          <div key={item._id} className="flex items-start space-x-3 pb-3 border-b last:border-b-0">
                            <div className="relative">
                              {hasImage ? (
                                <img
                                  src={primaryImage}
                                  alt={item.product.name}
                                  className="w-12 h-12 object-cover rounded border"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded border bg-green-100 flex items-center justify-center">
                                  <Droplet className="h-6 w-6 text-green-600" />
                                </div>
                              )}
                              <div className="absolute -top-2 -right-2 bg-green-800 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                                {item.quantity}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                              {(item.productType === "bundle" || item.bundleItems?.length) && (
                                <p className="text-xs text-emerald-700">Bundle</p>
                              )}
                              {item.variant_size && (
                                <p className="text-xs text-gray-500">{item.variant_size}</p>
                              )}
                              {item.bundleItems && item.bundleItems.length > 0 && (
                                <div className="mt-1 space-y-1 text-[11px] text-gray-500">
                                  {item.bundleItems.map((bundleItem, index) => (
                                    <div key={`${bundleItem.productId}-${index}`}>
                                      {bundleItem.product?.name || "Item"}{bundleItem.variant_size ? ` (${bundleItem.variant_size})` : ""} × {bundleItem.quantity}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">£{formatCurrency(lineTotal)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="coupon" className="text-sm">Coupon code</Label>
                      <div className="flex gap-2">
                        <Input
                          id="coupon"
                          value={couponCode}
                          onChange={(event) => {
                            const next = event.target.value;
                            setCouponCode(next);
                            if (couponApplied) {
                              setCouponApplied(false);
                              setCouponDiscount(0);
                              setCouponMessage(null);
                            }
                          }}
                          placeholder="Enter coupon"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleValidateCoupon}
                          disabled={couponLoading}
                        >
                          {couponLoading ? "Checking..." : "Validate"}
                        </Button>
                      </div>
                      {couponMessage && (
                        <p className={cn("text-xs", couponApplied ? "text-green-700" : "text-red-600")}>
                          {couponMessage}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>£{formatCurrency(total)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping</span>
                        {isFreeShipping ? (
                          <span className="text-green-600 font-semibold">Free</span>
                        ) : (
                          <span>£{formatCurrency(shippingCharge)}</span>
                        )}
                      </div>
                      {couponApplied && couponDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-700">
                          <span>Coupon discount</span>
                          <span>-£{formatCurrency(couponDiscount)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>£{formatCurrency(finalTotal)}</span>
                      </div>
                    </div>

                    {!stripeOrderId && (
                      <Button
                        type="submit"
                        className="w-full bg-green-800 text-white hover:bg-green-900 font-semibold"
                        size="lg"
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Complete order"}
                      </Button>
                    )}
                    {stripeOrderId && formData.paymentMethod === 'stripe' && (
                      <p className="text-sm text-muted-foreground text-center">
                        Please complete payment above to finish your order.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Footer with bg-green.png background */}
      <Footer />

      {/* Auth Sheet */}
      <AuthSheet open={authSheetOpen} onOpenChange={setAuthSheetOpen} defaultMode={authMode} />
    </div>
  );
};
