import { useState, useEffect, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Truck, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { apiService } from "@/services/api";
import { useCart } from "@/hooks/useCart";

interface Order {
  _id: string;
  orderNumber: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: string;
  createdAt: string;
  notes?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  // Backend fields
  subtotal?: number;
  shippingCost?: number;
  total?: number;
}

interface OrderItem {
  _id: string;
  quantity: number;
  price: number; // Backend uses 'price' not 'price_at_time'
  price_at_time?: number; // For backward compatibility
  variant?: {
    name: string;
    price: number;
  } | null;
  variant_size?: string | null;
  product: {
    _id: string;
    name: string;
    image_url?: string;
    images?: Array<{
      url: string;
      alt?: string;
      isPrimary?: boolean;
    }>;
  };
}

interface ShippingSettings {
  delivery_charges: number;
  free_delivery_threshold: number | null;
}

export const OrderConfirmationPage = () => {
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentStatusLoading, setPaymentStatusLoading] = useState(false);
  const { clearCart } = useCart();
  const clearCartRef = useRef(clearCart);
  const paymentStatusRef = useRef(paymentStatus);

  useEffect(() => {
    clearCartRef.current = clearCart;
  }, [clearCart]);

  useEffect(() => {
    paymentStatusRef.current = paymentStatus;
  }, [paymentStatus]);

  const searchParamsString = searchParams.toString();

  useEffect(() => {
    if (!orderNumber) return;
    // Check if this is a Stripe redirect with successful payment
    const paymentIntent = searchParams.get('payment_intent');
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');

    // If payment was successful via redirect, clear the cart
    if (paymentIntent && paymentIntentClientSecret) {
      // Payment was successful (Stripe redirected back)
      clearCartRef.current();
    }

    fetchOrderDetails();
    fetchShippingSettings();
  }, [orderNumber, searchParamsString]);

  const fetchOrderDetails = async () => {
    try {
      const token = searchParams.get('token');

      let response;
      if (token) {
        // Guest flow: fetch via public token
        response = await apiService.getOrderByPublicToken(orderNumber!, token);
      } else {
        // Authenticated flow: fetch by order number
        response = await apiService.getOrderByNumber(orderNumber!);
      }

      if (!response.success || !response.data) {
        throw new Error('Order not found');
      }

      const orderData = response.data;

      // Map backend response structure to frontend format
      const shippingAddress = orderData.shippingAddress || {};
      const customerEmail = orderData.guestEmail || orderData.shippingAddress?.email || '';
      
      // Build customer address string
      const addressParts = [
        shippingAddress.street,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.zipCode,
        shippingAddress.country
      ].filter(Boolean);
      const customerAddress = addressParts.join(', ');

      setOrder({
        _id: orderData._id,
        orderNumber: orderData.orderNumber,
        customer_name: shippingAddress.name || '',
        customer_email: customerEmail,
        customer_phone: shippingAddress.phone || '',
        customer_address: customerAddress,
        total_amount: orderData.total || orderData.total_amount || 0,
        status: orderData.orderStatus || orderData.status || 'pending',
        createdAt: orderData.createdAt,
        notes: orderData.notes || '',
        paymentMethod: orderData.paymentMethod || orderData.payment_method || orderData.paymentType || '',
        paymentStatus: orderData.paymentStatus || orderData.payment_status || '',
        // Store backend fields for calculations
        subtotal: orderData.subtotal,
        shippingCost: orderData.shippingCost,
        total: orderData.total
      });

      // Map items from backend structure
      const mappedItems = (orderData.items || []).map((item: any) => ({
        _id: item._id,
        quantity: item.quantity,
        price: item.price || item.total || 0,
        price_at_time: item.price || item.total || 0, // For backward compatibility
        variant: item.variant,
        variant_size: item.variant?.name || null,
        product: {
          _id: item.product?._id || '',
          name: item.product?.name || '',
          image_url: item.product?.images?.[0]?.url || item.product?.image_url || '',
          images: item.product?.images || []
        }
      }));

      setOrderItems(mappedItems);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizePaymentStatus = (status?: string | null) => {
    if (!status) return null;
    return status.toLowerCase();
  };

  useEffect(() => {
    if (!orderNumber || !order) return;
    const normalizedMethod = order.paymentMethod ? order.paymentMethod.toLowerCase() : '';
    if (normalizedMethod && normalizedMethod !== 'stripe') return;

    const terminalStatuses = new Set([
      'succeeded',
      'paid',
      'failed',
      'canceled',
      'requires_payment_method'
    ]);
    const currentStatus = normalizePaymentStatus(paymentStatusRef.current || order.paymentStatus);
    if (currentStatus && terminalStatuses.has(currentStatus)) {
      setPaymentStatus(currentStatus);
      setPaymentStatusLoading(false);
      return;
    }

    let isActive = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const pendingStatuses = new Set([
      'processing',
      'requires_action',
      'requires_confirmation',
      'requires_capture',
      'pending'
    ]);
    const maxAttempts = 5;

    const checkPaymentStatus = async (attempt: number) => {
      if (attempt === 0) {
        setPaymentStatusLoading(true);
      }

      const response = await apiService.getPaymentStatus({ orderNumber });
      if (!isActive) return;

      if (response.success) {
        const rawStatus =
          (response.data as any)?.status ||
          (response.data as any)?.paymentStatus ||
          (response.data as any)?.payment_intent_status ||
          (response.data as any)?.paymentIntent?.status ||
          paymentStatusRef.current ||
          null;
        const normalized = normalizePaymentStatus(rawStatus);
        if (normalized) {
          setPaymentStatus(normalized);
        }

        if (normalized && pendingStatuses.has(normalized) && attempt < maxAttempts) {
          retryTimer = setTimeout(() => checkPaymentStatus(attempt + 1), 3000);
          return;
        }
      }

      setPaymentStatusLoading(false);
    };

    checkPaymentStatus(0);

    return () => {
      isActive = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [orderNumber, order?._id, order?.paymentMethod, order?.paymentStatus]);

  const fetchShippingSettings = async () => {
    try {
      const response = await apiService.getShippingSettings();
      if (response.success && response.data) {
        setShippingSettings({
          delivery_charges: response.data.delivery_charges,
          free_delivery_threshold: response.data.free_delivery_threshold,
        });
      }
    } catch (error) {
      console.error('Failed to load shipping settings', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle">
        <Header />
        <div className="container py-16 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen gradient-subtle">
        <Header />
        <div className="container py-16 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Order not found</h1>
          <p className="text-muted-foreground mb-6">
            The order you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Use backend values if available, otherwise calculate from items
  const finalSubtotal = order?.subtotal !== undefined 
    ? order.subtotal 
    : orderItems.reduce((sum, item) => {
        const price = item.price_at_time || item.price || 0;
        return sum + (Number(price) * item.quantity);
      }, 0);
  
  const shipping = order?.shippingCost !== undefined 
    ? order.shippingCost 
    : Math.max((order?.total_amount || order?.total || 0) - finalSubtotal, 0);

  // Use backend shipping cost if available, otherwise keep calculated value
  const displayShipping = order?.shippingCost !== undefined ? order.shippingCost : shipping;

  const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

  const formatCurrency = (value: number | string) => {
    const amount = Number(value) || 0;
    return `£${Math.round(amount).toLocaleString('en-IN')}`;
  };

  const normalizedPaymentStatus = normalizePaymentStatus(paymentStatus);
  const normalizedPaymentMethod = order.paymentMethod ? order.paymentMethod.toLowerCase() : '';
  const isStripePayment = !normalizedPaymentMethod || normalizedPaymentMethod === 'stripe';
  const paymentStatusMeta = (() => {
    if (!isStripePayment) {
      return { label: 'Not required', variant: 'outline' as const };
    }
    if (paymentStatusLoading) {
      return { label: 'Checking...', variant: 'outline' as const };
    }
    if (!normalizedPaymentStatus) {
      return { label: 'Unavailable', variant: 'outline' as const };
    }
    if (['succeeded', 'paid'].includes(normalizedPaymentStatus)) {
      return { label: 'Paid', variant: 'secondary' as const };
    }
    if (['failed', 'canceled', 'requires_payment_method'].includes(normalizedPaymentStatus)) {
      return { label: 'Failed', variant: 'outline' as const };
    }
    if (normalizedPaymentStatus === 'requires_action') {
      return { label: 'Action required', variant: 'outline' as const };
    }
    return { label: 'Pending', variant: 'outline' as const };
  })();

  const paymentStatusNote = (() => {
    if (!isStripePayment) return null;
    if (paymentStatusLoading) return 'Checking payment status...';
    if (!normalizedPaymentStatus) return 'Payment status is not available yet.';
    if (normalizedPaymentStatus === 'requires_action') {
      return 'Payment needs additional authentication. Please retry from checkout.';
    }
    if (['failed', 'canceled', 'requires_payment_method'].includes(normalizedPaymentStatus)) {
      return 'Payment did not complete. You can retry from checkout.';
    }
    if (['processing', 'requires_confirmation', 'requires_capture', 'pending'].includes(normalizedPaymentStatus)) {
      return 'Payment is processing. This may take a minute.';
    }
    return null;
  })();

  const handleDownloadPdf = () => {
    if (!order) return;

    // Build a simple, printable receipt HTML and open the browser's Print to PDF
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const itemsRows = orderItems.map((it) => {
      const itemPrice = it.price_at_time || it.price || 0;
      return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${it.product.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${it.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(itemPrice)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(Number(itemPrice) * it.quantity)}</td>
      </tr>
    `;
    }).join("");

    const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Order Receipt - ${order.orderNumber}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Inter, Helvetica, Arial, sans-serif; color: #111827; margin: 24px; }
      .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px; }
      .brand { font-size: 18px; font-weight: 700; }
      .muted { color:#6b7280; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      h2 { font-size: 16px; margin: 16px 0 8px; }
      table { width:100%; border-collapse: collapse; }
      .totals td { padding: 6px 8px; }
      .totals .label { text-align:right; color:#374151; }
      .totals .value { text-align:right; font-weight:600; }
      @media print {
        @page { size: auto; margin: 12mm; }
        .no-print { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="brand">PHRESH</div>
        <div class="muted">Order Receipt</div>
      </div>
      <div style="text-align:right">
        <div><strong>Order #:</strong> ${order.orderNumber}</div>
        <div class="muted">${orderDate}</div>
      </div>
    </div>

    <h2>Customer</h2>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap: 12px;">
      <div>
        <div><strong>Name:</strong> ${order.customer_name || '-'}</div>
        <div><strong>Email:</strong> ${order.customer_email || '-'}</div>
        <div><strong>Phone:</strong> ${order.customer_phone || '-'}</div>
      </div>
      <div>
        <div><strong>Address:</strong></div>
        <div class="muted">${order.customer_address || '-'}</div>
      </div>
    </div>

    <h2 style="margin-top:16px">Items</h2>
    <table>
      <thead>
        <tr>
          <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">Product</th>
          <th style="text-align:center; padding:8px; border-bottom:1px solid #e5e7eb;">Qty</th>
          <th style="text-align:right; padding:8px; border-bottom:1px solid #e5e7eb;">Price</th>
          <th style="text-align:right; padding:8px; border-bottom:1px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <table style="width:100%; margin-top: 12px;">
      <tbody class="totals">
        <tr>
          <td class="label">Subtotal</td>
          <td class="value">${formatCurrency(finalSubtotal)}</td>
        </tr>
        <tr>
          <td class="label">Shipping</td>
          <td class="value">${formatCurrency(displayShipping)}</td>
        </tr>
        <tr>
          <td class="label" style="font-weight:700">Grand Total</td>
          <td class="value" style="font-weight:700">${formatCurrency(order.total_amount || order.total || 0)}</td>
        </tr>
      </tbody>
    </table>

    <p class="muted" style="margin-top:16px">Thank you for your purchase!</p>

    <div class="no-print" style="margin-top:24px">
      <button onclick="window.print()" style="padding:8px 12px; border: 1px solid #e5e7eb; border-radius:8px; background:#111827; color:white;">Print / Save as PDF</button>
    </div>
  </body>
  </html>`;

    const w = window.open("", "_blank");
    if (!w) {
      // Popup blocked; fallback to blob URL
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Order_${order.orderNumber}.html`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Auto print once the new document is ready
    w.onload = () => {
      try {
        w.focus();
        w.print();
      } catch { }
    };
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <Header />

      <div className="container py-8 max-w-4xl">
        {/* Success Header */
        }
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Thank you for your order!</h1>
          <p className="text-lg text-muted-foreground">
            Your order has been confirmed and will be delivered soon.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button onClick={handleDownloadPdf} className="">Download PDF Receipt</Button>
            {/* <Button variant="outline" asChild>
              <a href={`/order-confirmation/${order.orderNumber}`} target="_blank" rel="noopener noreferrer">Open Receipt in New Tab</a>
            </Button> */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order Summary */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Order Number</p>
                    <p className="text-muted-foreground">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="font-medium">Order Date</p>
                    <p className="text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Status</p>
                    <Badge variant="secondary" className="capitalize">
                      {order.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">Payment Status</p>
                    <div className="flex flex-col gap-1">
                      <Badge variant={paymentStatusMeta.variant} className="w-fit">
                        {paymentStatusMeta.label}
                      </Badge>
                      {paymentStatusNote ? (
                        <span className="text-xs text-muted-foreground">{paymentStatusNote}</span>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Total Amount</p>
                    <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Items Ordered</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderItems.length > 0 ? (
                  orderItems.map((item) => {
                    const itemPrice = item.price_at_time || item.price || 0;
                    const primaryImage = item.product.images?.find((img: any) => img.isPrimary)?.url 
                      || item.product.images?.[0]?.url 
                      || item.product.image_url 
                      || "/api/placeholder/80/80";
                    
                    const unitPrice = Number(itemPrice);
                    const itemTotal = unitPrice * item.quantity;
                    
                    return (
                      <div key={item._id} className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                        <img
                          src={primaryImage}
                          alt={item.product.name}
                          className="h-16 w-16 rounded border object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium leading-snug mb-1">{item.product.name}</h4>
                          {item.variant?.name || item.variant_size ? (
                            <p className="text-xs text-muted-foreground mb-2">
                              Size: {item.variant?.name || item.variant_size}
                            </p>
                          ) : null}
                          <div className="flex items-center justify-between mt-2">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">
                                Unit Price: <span className="font-medium text-foreground">{formatCurrency(unitPrice)}</span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Quantity: <span className="font-medium text-foreground">{item.quantity}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground mb-1">Total</p>
                              <p className="font-semibold text-lg text-emerald-600">
                                {formatCurrency(itemTotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-sm">No items found</p>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(finalSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    {displayShipping > 0 ? (
                      <span>{formatCurrency(displayShipping)}</span>
                    ) : (
                      <span className="font-medium text-emerald-600">Free</span>
                    )}
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(order.total_amount || order.total || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_phone}</span>
                </div>
                {order.customer_address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{order.customer_address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Delivery Information */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Estimated Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      {estimatedDelivery.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>We’ll email you the tracking information once your order has shipped.</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  If you have any questions about your order, feel free to contact us.
                </p>

                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-muted-foreground">info@phreshmcr.com</p>
                  </div>
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-muted-foreground">03020025727</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Continue Shopping */}
            <div className="space-y-3">
              <Button asChild className="w-full gradient-luxury">
                <Link to="/products">Continue Shopping</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/">Return to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
