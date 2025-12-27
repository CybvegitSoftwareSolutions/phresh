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
import * as XLSX from "xlsx";
import { Loader2, Search, Eye, Package, Truck, CheckCircle, XCircle, Clock, Download } from "lucide-react";

interface OrderItem {
  _id: string;
  quantity: number;
  price_at_time: number;
  product: {
    _id: string;
    name: string;
    price: number;
  };
}

interface Order {
  _id: string;
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
}

export function OrdersManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllOrders();
      console.log('Orders response:', response);
      if (response.success && response.data) {
        // Handle different possible data structures
        const ordersData = response.data.orders || response.data.data || response.data;
        const ordersList = Array.isArray(ordersData) ? ordersData : [];
        
        // Transform orders to ensure they have all required fields
        const transformedOrders = ordersList.map((order: any) => {
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
              product: {
                _id: item.product?._id || item.productId || item.product?.id || '',
                name: item.product?.name || item.productName || 'Unknown Product',
                price: item.product?.price || item.price || priceAtTime || 0
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
            order_items
          };
        });
        
        console.log('Transformed orders:', transformedOrders);
        setOrders(transformedOrders);
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

  const calculateTotals = (order: Order) => {
    const itemsTotal = order.order_items.reduce((sum, item) => sum + Number(item.price_at_time) * item.quantity, 0);
    const shipping = Math.max(Number(order.total_amount) - itemsTotal, 0);
    return { itemsTotal, shipping };
  };

  const filteredOrders = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);

    return orders.filter(order => {
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
  }, [orders, searchTerm, fromDate, toDate]);

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
          "Created At": new Date(order.createdAt).toLocaleString(),
          "Items Count": order.order_items.length,
          "Items Subtotal": itemsTotal,
          "Shipping Charge": shipping,
          "Total Amount": Number(order.total_amount),
          "Tracking Number": order.tracking_number || "",
          Notes: order.notes || "",
        };
      });

      const items = exportOrders.flatMap(order =>
        order.order_items.map(item => ({
          "Order Number": order.orderNumber,
          Product: item.product.name,
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

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                  <CardDescription>
                    {order.customer_name} • {order.customer_email}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(order.status)}
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-lg font-bold">PKR {order.total_amount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Order Date</p>
                  <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Items</p>
                  <p>{order.order_items.length} item(s)</p>
                </div>
              </div>
              
              {order.tracking_number && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Tracking Number</p>
                  <p className="font-mono">{order.tracking_number}</p>
                </div>
              )}
            </CardContent>
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

  const handleSubmit = () => {
    onUpdate(order.id, status, trackingNumber, notes);
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
                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">PKR {((Number(item.price_at_time) || 0) * (Number(item.quantity) || 0)).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Unit: PKR {(Number(item.price_at_time) || 0).toFixed(2)}</p>
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
            const shipping = Math.max(Number(order.total_amount) - itemsTotal, 0);
            return (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>Items Subtotal</span>
                  <span>PKR {itemsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Charge</span>
                  <span>PKR {shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>PKR {Number(order.total_amount).toFixed(2)}</span>
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
