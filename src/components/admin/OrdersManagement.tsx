import { useState, useEffect, useMemo } from "react";
import { apiService } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { Loader2, Search, Eye, Package, Truck, CheckCircle, XCircle, Clock, Download, CreditCard, MapPin, ChevronDown, Trash2 } from "lucide-react";

interface OrderItem {
  _id: string;
  quantity: number;
  price_at_time: number;
  total?: number;
  variant?: {
    variantId?: string;
    name?: string;
    price?: number;
  } | null;
  bundleItems?: Array<{
    _id?: string;
    product?: any;
    quantity: number;
    price?: number;
    total?: number;
    variant?: {
      variantId?: string;
      name?: string;
      price?: number;
    } | null;
  }>;
  product: {
    _id: string;
    name: string;
    price: number;
    image_url?: string;
    images?: Array<{ url: string }>;
  };
}

interface Order {
  _id: string;
  id?: string;
  orderNumber: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: string;
  tracking_number?: string;
  notes?: string;
  createdAt: string;
  order_items: OrderItem[];
  paymentMethod?: string;
  paymentStatus?: string;
  subtotal?: number;
  shippingCost?: number;
  tax?: number;
  discount?: number;
  stripeFees?: number;
  totalWithFees?: number;
  currency?: string;
  stripePaymentIntentId?: string;
}

type GroupedOrders = {
  pending: Order[];
  completed: Order[];
  cancelled: Order[];
};

export function OrdersManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrders | null>(null);
  const [activeTab, setActiveTab] = useState<keyof GroupedOrders>("pending");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exporting, setExporting] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllOrders({ page: 1, limit: 20, grouped: true });
      console.log('Orders response:', response);
      if (response.success && response.data) {
        const rawData = response.data?.data ?? response.data;
        const isGrouped =
          rawData &&
          typeof rawData === "object" &&
          !Array.isArray(rawData) &&
          ("pending" in rawData || "completed" in rawData || "cancelled" in rawData);

        const normalizeOrder = (order: any) => {
          // Extract customer data from shippingAddress or user object
          const shippingAddress = order.shippingAddress || {};
          const user = order.user || {};
          
          // Debug: Log the raw order to see structure
          console.log('Transforming order:', order.orderNumber, { shippingAddress, user, guestEmail: order.guestEmail });
          
          // Get customer name - priority: shippingAddress.name > user.name > fallback
          const customer_name = shippingAddress?.name || user?.name || order.customer_name || order.customerName || 'Unknown';
          
          // Get customer email - priority: user.email > guestEmail > shippingAddress.email > fallback
          const customer_email = user?.email || order.guestEmail || shippingAddress?.email || order.customer_email || order.customerEmail || '';
          
          // Get customer phone - priority: shippingAddress.phone > user.phone > fallback
          const customer_phone = shippingAddress?.phone || user?.phone || order.customer_phone || order.customerPhone || '';
          
          // Build customer address from shippingAddress
          const addressParts = [];
          if (shippingAddress?.street) addressParts.push(shippingAddress.street);
          if (shippingAddress?.city) addressParts.push(shippingAddress.city);
          if (shippingAddress?.state) addressParts.push(shippingAddress.state);
          if (shippingAddress?.zipCode) addressParts.push(shippingAddress.zipCode);
          if (shippingAddress?.country) addressParts.push(shippingAddress.country);
          const customer_address = addressParts.length > 0 
            ? addressParts.join(', ') 
            : (order.customer_address || order.customerAddress || '');
          
          // Get order status - backend uses orderStatus
          const status = order.orderStatus || order.status || 'pending';
          
          // Map order items - backend uses items array
          const order_items = (order.items || order.order_items || order.orderItems || []).map((item: any) => {
            // Get price at time of order - backend provides item.price for the order price
            const priceAtTime = item.price || item.price_at_time || item.unitPrice || item.total / (item.quantity || 1) || 0;
            
            return {
              _id: item._id || item.id || `item-${Date.now()}`,
              quantity: item.quantity || 1,
              price_at_time: Number(priceAtTime) || 0, // Ensure it's a number
              total: Number(item.total) || Number(priceAtTime) * (Number(item.quantity) || 1),
              variant: item.variant
                ? {
                    variantId: item.variant.variantId || item.variant._id,
                    name: item.variant.name,
                    price: item.variant.price
                  }
                : null,
              bundleItems: (item.bundleItems || item.bundle_items || []).map((bundleItem: any) => ({
                _id: bundleItem._id || bundleItem.id,
                product: bundleItem.product,
                quantity: bundleItem.quantity || 0,
                price: bundleItem.price,
                total: bundleItem.total,
                variant: bundleItem.variant
                  ? {
                      variantId: bundleItem.variant.variantId || bundleItem.variant._id,
                      name: bundleItem.variant.name,
                      price: bundleItem.variant.price
                    }
                  : null
              })),
              product: {
                _id: item.product?._id || item.productId || item.product?.id || '',
                name: item.product?.name || item.productName || 'Unknown Product',
                price: item.product?.price || item.price || priceAtTime || 0,
                image_url: item.product?.images?.[0]?.url || item.product?.image_url || '',
                images: item.product?.images || []
              }
            };
          });
          
          return {
            _id: order._id || order.id,
            id: order._id || order.id,
            orderNumber: order.orderNumber || order.order_number || order.order_id || 'N/A',
            customer_name,
            customer_email,
            customer_phone,
            customer_address,
            total_amount: order.total || order.total_amount || order.totalAmount || 0,
            status: status.toLowerCase(), // Normalize to lowercase
            tracking_number: order.tracking_number || order.trackingNumber || order.tracking || undefined,
            notes: order.notes || order.note || undefined,
            createdAt: order.createdAt || order.created_at || order.date || new Date().toISOString(),
            order_items,
            paymentMethod: order.paymentMethod || order.payment_method || '',
            paymentStatus: order.paymentStatus || order.payment_status || '',
            subtotal: order.subtotal,
            shippingCost: order.shippingCost,
            tax: order.tax,
            discount: order.discount,
            stripeFees: order.stripeFees,
            totalWithFees: order.totalWithFees,
            currency: order.paymentDetails?.currency || order.currency || 'GBP',
            stripePaymentIntentId: order.stripePaymentIntentId || order.paymentDetails?.stripePaymentIntentId || ''
          };
        };

        if (isGrouped) {
          const pending = (rawData.pending || []).map(normalizeOrder);
          const completed = (rawData.completed || []).map(normalizeOrder);
          const cancelled = (rawData.cancelled || []).map(normalizeOrder);
          const combined = [...pending, ...completed, ...cancelled];
          console.log('Transformed grouped orders:', { pending, completed, cancelled });
          setGroupedOrders({ pending, completed, cancelled });
          setOrders(combined);
        } else {
          // Handle different possible data structures
          const ordersData = rawData?.orders || rawData?.data || rawData;
          const ordersList = Array.isArray(ordersData)
            ? ordersData
            : Array.isArray(ordersData?.data)
              ? ordersData.data
              : [];
          const transformedOrders = ordersList.map(normalizeOrder);
          console.log('Transformed orders:', transformedOrders);
          setGroupedOrders(null);
          setOrders(transformedOrders);
        }
      } else {
        throw new Error(response.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, trackingNumber?: string, notes?: string) => {
    setUpdateLoading(true);
    try {
      // Normalize status to lowercase to match backend expectations
      // Valid statuses: pending, confirmed, processing, preparing, ready, out_for_delivery, delivered, cancelled
      const normalizedStatus = status.toLowerCase().trim();
      
      // Validate status before sending
      const validStatuses = ['pending', 'confirmed', 'processing', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
      if (!validStatuses.includes(normalizedStatus)) {
        throw new Error(`Invalid order status: ${normalizedStatus}. Valid statuses are: ${validStatuses.join(', ')}`);
      }
      
      console.log('Updating order status:', { orderId, status: normalizedStatus, notes });
      const response = await apiService.updateOrderStatus(orderId, normalizedStatus, notes);
      if (!response.success) {
        // Show detailed error message if available
        let errorMessage = response.message || "Failed to update order status";
        if (response.errors && Array.isArray(response.errors)) {
          const errorDetails = response.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
          errorMessage = `${errorMessage}. ${errorDetails}`;
        }
        throw new Error(errorMessage);
      }

      // Send status update email via backend API
      const ord = orders.find((o) => o._id === orderId);
      if (ord) {
        try {
          // Note: Email sending will be handled by your backend when the order status is updated
          console.log('Order status updated successfully, email should be sent by backend');
        } catch (emailErr) {
          console.error('Status email failed:', emailErr);
        }
      }

      toast({
        title: "Order Updated",
        description: "Order status updated successfully and customer notified"
      });

      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm("Delete this order? This cannot be undone.")) return;
    setDeleteLoading(true);
    try {
      const response = await apiService.deleteOrderAdmin(orderId);
      if (!response.success) {
        throw new Error(response.message || "Failed to delete order");
      }
      toast({
        title: "Order Deleted",
        description: "The order was removed successfully.",
      });
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(null);
      }
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete order",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) {
      return (
        <Badge className="bg-gray-500 text-white">
          <Clock className="h-3 w-3 mr-1" />
          Unknown
        </Badge>
      );
    }

    const statusConfig = {
      pending: { color: "bg-yellow-500", icon: Clock },
      confirmed: { color: "bg-blue-400", icon: CheckCircle },
      processing: { color: "bg-blue-500", icon: Package },
      preparing: { color: "bg-indigo-500", icon: Package },
      ready: { color: "bg-purple-500", icon: Package },
      out_for_delivery: { color: "bg-purple-500", icon: Truck },
      delivered: { color: "bg-green-500", icon: CheckCircle },
      cancelled: { color: "bg-red-500", icon: XCircle }
    };

    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <Badge className={`${config?.color || 'bg-gray-500'} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentBadge = (status?: string) => {
    if (!status) {
      return <Badge variant="outline">Payment: Unknown</Badge>;
    }
    const normalized = status.toLowerCase();
    if (['paid', 'succeeded'].includes(normalized)) {
      return <Badge className="bg-emerald-500 text-white">Payment: Paid</Badge>;
    }
    if (['failed', 'canceled', 'requires_payment_method'].includes(normalized)) {
      return <Badge className="bg-red-500 text-white">Payment: Failed</Badge>;
    }
    return <Badge className="bg-yellow-500 text-white">Payment: Pending</Badge>;
  };

  const getPaymentMethodLabel = (method?: string) => {
    if (!method) return "Unknown";
    const normalized = method.toLowerCase();
    if (normalized === "cash_on_delivery" || normalized === "cod") return "COD";
    if (normalized === "stripe" || normalized === "online" || normalized === "card") return "Online";
    return method.replace(/_/g, " ");
  };

  const isOnlinePayment = (method?: string) => {
    if (!method) return false;
    const normalized = method.toLowerCase();
    return normalized === "stripe" || normalized === "online" || normalized === "card";
  };

  const formatStatusLabel = (value?: string) => {
    if (!value) return "Unknown";
    return value
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatCurrency = (value: number, currency = "GBP") => {
    const amount = Number(value) || 0;
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const calculateTotals = (order: Order) => {
    const itemsTotal = order.subtotal ?? order.order_items.reduce((sum, item) => sum + Number(item.price_at_time) * item.quantity, 0);
    const shipping = order.shippingCost ?? Math.max(Number(order.total_amount) - itemsTotal, 0);
    return { itemsTotal, shipping };
  };

  const activeOrders = useMemo(() => {
    if (groupedOrders) {
      return groupedOrders[activeTab] || [];
    }
    return orders;
  }, [groupedOrders, activeTab, orders]);

  const tabCounts = useMemo(() => {
    if (groupedOrders) {
      return {
        pending: groupedOrders.pending.length,
        completed: groupedOrders.completed.length,
        cancelled: groupedOrders.cancelled.length,
      };
    }
    return { pending: orders.length, completed: 0, cancelled: 0 };
  }, [groupedOrders, orders.length]);

  const filteredOrders = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);

    return activeOrders.filter(order => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (!from && !to) return true;
      const created = new Date(order.createdAt);
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
  }, [activeOrders, searchTerm, fromDate, toDate]);

  const handleDownloadReport = (exportOrders: Order[]) => {
    if (exportOrders.length === 0) return;

    try {
      setExporting(true);
      const summary = exportOrders.map(order => {
        const { itemsTotal, shipping } = calculateTotals(order);
        return {
          "Order Number": order.orderNumber,
          "Customer Name": order.customer_name,
          "Customer Email": order.customer_email,
          "Customer Phone": order.customer_phone,
          "Customer Address": order.customer_address,
          Status: order.status,
          "Payment Method": order.paymentMethod || "",
          "Payment Status": order.paymentStatus || "",
          "Created At": new Date(order.createdAt).toLocaleString(),
          "Items Count": order.order_items.length,
          "Items Subtotal": itemsTotal,
          "Shipping Charge": shipping,
          Tax: order.tax ?? 0,
          Discount: order.discount ?? 0,
          "Total Amount": Number(order.total_amount),
          "Stripe Fees": order.stripeFees ?? 0,
          "Total With Fees": order.totalWithFees ?? "",
          "Stripe Intent": order.stripePaymentIntentId || "",
          Currency: order.currency || "",
          "Tracking Number": order.tracking_number || "",
          Notes: order.notes || "",
        };
      });

      const items = exportOrders.flatMap(order =>
        order.order_items.map(item => ({
          "Order Number": order.orderNumber,
          Product: item.product.name,
          Variant: item.variant?.name || "",
          "Variant ID": item.variant?.variantId || "",
          Quantity: item.quantity,
          "Unit Price": Number(item.price_at_time),
          "Line Total": Number(item.price_at_time) * item.quantity,
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary), "Orders");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(items), "Order Items");
      const filename = `orders-${fromDate || 'all'}-${toDate || 'all'}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast({ title: "Report Ready", description: "Orders exported to Excel." });
    } catch (error: any) {
      console.error('Excel export failed', error);
      toast({ title: "Export failed", description: error?.message || 'Could not create Excel file', variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const tabs: Array<{ key: keyof GroupedOrders; label: string }> = [
    { key: "pending", label: "Pending" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground">Manage and track customer orders</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="fromDate" className="text-xs uppercase tracking-wide text-muted-foreground">From</Label>
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-48"
            />
          </div>
          <div>
            <Label htmlFor="toDate" className="text-xs uppercase tracking-wide text-muted-foreground">To</Label>
            <Input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-48"
            />
          </div>
          {(fromDate || toDate) && (
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(""); setToDate(""); }}>
              Clear Dates
            </Button>
          )}
        </div>
        <Button
          onClick={() => handleDownloadReport(filteredOrders)}
          disabled={exporting || filteredOrders.length === 0}
          className="shadow-soft"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {exporting ? "Generating…" : "Download Excel"}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search orders by order number, customer name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            type="button"
            size="sm"
            variant={activeTab === tab.key ? "default" : "outline"}
            onClick={() => setActiveTab(tab.key)}
            className={cn(activeTab === tab.key ? "" : "bg-white")}
          >
            {tab.label}
            <Badge variant="secondary" className="ml-2">
              {tabCounts[tab.key]}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order._id} className="shadow-soft border-muted/60">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                  <CardDescription>
                    {order.customer_name} • {order.customer_email || "Guest"}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{getPaymentMethodLabel(order.paymentMethod)}</Badge>
                  {isOnlinePayment(order.paymentMethod) && getPaymentBadge(order.paymentStatus)}
                  <Badge variant="outline">Order: {formatStatusLabel(order.status)}</Badge>
                  <Dialog open={selectedOrder?._id === order._id} onOpenChange={(open) => setSelectedOrder(open ? order : null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Order #{order.orderNumber}</DialogTitle>
                        <DialogDescription>
                          Manage order status and details
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedOrder && (
                        <OrderManagementDialog
                          order={selectedOrder}
                          onUpdate={updateOrderStatus}
                          loading={updateLoading}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteOrder(order._id)}
                    disabled={deleteLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(order.total_amount, order.currency)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Items</p>
                  <p className="text-lg font-semibold">{order.order_items.length}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Payment</p>
                  <p className="text-sm font-medium">{getPaymentMethodLabel(order.paymentMethod)}</p>
                  <p className="text-xs text-muted-foreground">
                    {isOnlinePayment(order.paymentMethod) ? formatStatusLabel(order.paymentStatus) : "Not required"}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Shipping</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(order.shippingCost ?? 0, order.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.tracking_number ? "Tracked" : "No tracking"}</p>
                </div>
              </div>

              <Button
                variant="ghost"
                className="w-full justify-center gap-2 text-sm"
                onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
              >
                {expandedOrderId === order._id ? "Hide details" : "View details"}
                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedOrderId === order._id && "rotate-180")} />
              </Button>
            </CardHeader>
            {expandedOrderId === order._id && (
              <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Shipping Details
                  </div>
                  <p className="text-sm">{order.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{order.customer_phone || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{order.customer_address || "N/A"}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Payment Summary
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Payment Method</span>
                      <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Status</span>
                      <span>{isOnlinePayment(order.paymentMethod) ? formatStatusLabel(order.paymentStatus) : "Not required"}</span>
                    </div>
                    {isOnlinePayment(order.paymentMethod) && order.stripePaymentIntentId && (
                      <div className="flex justify-between">
                        <span>Stripe Intent</span>
                        <span className="font-mono text-xs">{order.stripePaymentIntentId}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatCurrency(order.subtotal ?? 0, order.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{formatCurrency(order.shippingCost ?? 0, order.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatCurrency(order.tax ?? 0, order.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span>{formatCurrency(order.discount ?? 0, order.currency)}</span>
                    </div>
                    {isOnlinePayment(order.paymentMethod) && order.stripeFees !== undefined && (
                      <div className="flex justify-between">
                        <span>Stripe Fees</span>
                        <span>{formatCurrency(order.stripeFees ?? 0, order.currency)}</span>
                      </div>
                    )}
                    {isOnlinePayment(order.paymentMethod) && order.totalWithFees !== undefined && (
                      <div className="flex justify-between font-semibold text-foreground">
                        <span>Total with Fees</span>
                        <span>{formatCurrency(order.totalWithFees ?? order.total_amount, order.currency)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">Items</h4>
                  <span className="text-xs text-muted-foreground">{order.order_items.length} item(s)</span>
                </div>
                <div className="space-y-3">
                  {order.order_items.map((item) => {
                    const image =
                      item.product.image_url || item.product.images?.[0]?.url || "/placeholder.svg";
                    return (
                      <div key={item._id} className="flex items-start gap-3 border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="h-12 w-12 rounded border overflow-hidden bg-muted">
                          <img src={image} alt={item.product.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.product.name || "Unknown Product"}</p>
                          {item.variant?.name && (
                            <p className="text-xs text-muted-foreground">Variant: {item.variant.name}</p>
                          )}
                          {item.variant?.variantId && (
                            <p className="text-[11px] text-muted-foreground">Variant ID: {item.variant.variantId}</p>
                          )}
                          {item.bundleItems && item.bundleItems.length > 0 && (
                            <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                              {item.bundleItems.map((bundleItem) => {
                                const bundleProduct =
                                  typeof bundleItem.product === "object" && bundleItem.product !== null
                                    ? bundleItem.product
                                    : null;
                                const bundleName =
                                  bundleProduct?.name ||
                                  bundleProduct?._id ||
                                  (typeof bundleItem.product === "string" ? bundleItem.product : "Bundle item");
                                const bundleImage =
                                  bundleProduct?.images?.[0]?.url ||
                                  bundleProduct?.image_url ||
                                  "/placeholder.svg";
                                return (
                                  <div
                                    key={bundleItem._id || `${bundleName}-${bundleItem.quantity}`}
                                    className="flex items-center gap-2"
                                  >
                                    <div className="h-8 w-8 rounded border overflow-hidden bg-muted">
                                      <img
                                        src={bundleImage}
                                        alt={bundleName}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <span>
                                      {bundleName}
                                      {bundleItem.variant?.name ? ` (${bundleItem.variant.name})` : ""}
                                      {" - "}Qty: {bundleItem.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <p>Qty: {item.quantity}</p>
                          <p className="text-muted-foreground">
                            {formatCurrency(item.price_at_time, order.currency)}
                          </p>
                          <p className="font-semibold">
                            {formatCurrency(item.total ?? item.price_at_time * item.quantity, order.currency)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {order.tracking_number && (
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tracking Number</p>
                  <p className="font-mono">{order.tracking_number}</p>
                </div>
              )}

              {order.notes && (
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No orders found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search criteria" : "Orders will appear here once customers start placing them"}
          </p>
        </div>
      )}
    </div>
  );
}

function OrderManagementDialog({ 
  order, 
  onUpdate, 
  loading 
}: { 
  order: Order; 
  onUpdate: (id: string, status: string, trackingNumber?: string, notes?: string) => void;
  loading: boolean;
}) {
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [notes, setNotes] = useState(order.notes || "");
  const currency = order.currency || "GBP";

  const getPaymentMethodLabel = (method?: string) => {
    if (!method) return "Unknown";
    const normalized = method.toLowerCase();
    if (normalized === "cash_on_delivery" || normalized === "cod") return "COD";
    if (normalized === "stripe" || normalized === "online" || normalized === "card") return "Online";
    return method.replace(/_/g, " ");
  };

  const isOnlinePayment = (method?: string) => {
    if (!method) return false;
    const normalized = method.toLowerCase();
    return normalized === "stripe" || normalized === "online" || normalized === "card";
  };

  const formatStatusLabel = (value?: string) => {
    if (!value) return "Unknown";
    return value
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatCurrencyLocal = (value: number) => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value) || 0);
    } catch {
      return `${currency} ${Number(value || 0).toFixed(2)}`;
    }
  };

  const handleSubmit = () => {
    onUpdate(order.id || order._id, status, trackingNumber, notes);
  };

  return (
    <div className="space-y-4">
      {/* Order Details */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
        <div>
          <p className="text-sm font-medium">Customer</p>
          <p>{order.customer_name}</p>
          <p className="text-sm text-muted-foreground">{order.customer_email}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Phone</p>
          <p>{order.customer_phone}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Payment Method</p>
          <p>{getPaymentMethodLabel(order.paymentMethod)}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Payment Status</p>
          <p>{isOnlinePayment(order.paymentMethod) ? formatStatusLabel(order.paymentStatus) : "Not required"}</p>
        </div>
        {isOnlinePayment(order.paymentMethod) && order.stripePaymentIntentId && (
          <div className="col-span-2">
            <p className="text-sm font-medium">Stripe Intent</p>
            <p className="font-mono text-sm">{order.stripePaymentIntentId}</p>
          </div>
        )}
        <div className="col-span-2">
          <p className="text-sm font-medium">Address</p>
          <p>{order.customer_address}</p>
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h4 className="font-medium mb-2">Order Items</h4>
        <div className="space-y-2">
          {order.order_items.map((item) => (
            <div key={item._id} className="flex justify-between items-center p-2 bg-muted rounded">
              <div>
                <p className="font-medium">{item.product.name}</p>
                {item.variant?.name && (
                  <p className="text-xs text-muted-foreground">Variant: {item.variant.name}</p>
                )}
                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                {item.bundleItems && item.bundleItems.length > 0 && (
                  <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                    {item.bundleItems.map((bundleItem) => {
                      const bundleProduct =
                        typeof bundleItem.product === "object" && bundleItem.product !== null
                          ? bundleItem.product
                          : null;
                      const bundleName =
                        bundleProduct?.name ||
                        bundleProduct?._id ||
                        (typeof bundleItem.product === "string" ? bundleItem.product : "Bundle item");
                      const bundleImage =
                        bundleProduct?.images?.[0]?.url ||
                        bundleProduct?.image_url ||
                        "/placeholder.svg";
                      return (
                        <div
                          key={bundleItem._id || `${bundleName}-${bundleItem.quantity}`}
                          className="flex items-center gap-2"
                        >
                          <div className="h-8 w-8 rounded border overflow-hidden bg-muted">
                            <img src={bundleImage} alt={bundleName} className="h-full w-full object-cover" />
                          </div>
                          <span>
                            {bundleName}
                            {bundleItem.variant?.name ? ` (${bundleItem.variant.name})` : ""}
                            {" - "}Qty: {bundleItem.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrencyLocal((Number(item.price_at_time) || 0) * (Number(item.quantity) || 0))}</p>
                <p className="text-xs text-muted-foreground">Unit: {formatCurrencyLocal(Number(item.price_at_time) || 0)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t pt-3 space-y-1 text-sm">
          {(() => {
            const itemsTotal = order.order_items.reduce((sum, item) => {
              const price = Number(item.price_at_time) || 0;
              const qty = Number(item.quantity) || 0;
              return sum + (price * qty);
            }, 0);
            const shipping = order.shippingCost ?? Math.max(Number(order.total_amount) - itemsTotal, 0);
            return (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>Items Subtotal</span>
                  <span>{formatCurrencyLocal(itemsTotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Charge</span>
                  <span>{formatCurrencyLocal(shipping)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrencyLocal(Number(order.total_amount))}</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Update Form */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="status">Order Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tracking">Tracking Number (Optional)</Label>
          <Input
            id="tracking"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number"
          />
        </div>

        <div>
          <Label htmlFor="notes">Internal Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes about this order"
            rows={3}
          />
        </div>
      </div>

      <DialogFooter>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Update Order
        </Button>
      </DialogFooter>
    </div>
  );
}
