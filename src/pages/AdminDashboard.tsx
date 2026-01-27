import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Package, DollarSign, ShoppingCart, Edit2, Send, Download } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface Order {
  _id: string;
  orderNumber: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: string;
  tracking_number: string;
  notes: string;
  createdAt: string;
  order_items: Array<{
    product: {
      name: string;
      price: number;
    };
    quantity: number;
    price_at_time: number;
  }>;
}

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatus, setOrderStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    console.log('AdminDashboard: useEffect triggered, user:', user);
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    console.log('AdminDashboard: checkAdminAccess called, user:', user);
    
    if (!user) {
      console.log('AdminDashboard: No user found, redirecting to auth');
      navigate('/auth');
      return;
    }

    console.log('AdminDashboard: Checking admin status for user:', user.email, 'role:', user.role);

    if (user.role !== 'admin') {
      console.log('AdminDashboard: User is not admin, redirecting home');
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    console.log('AdminDashboard: User is admin, setting isAdmin to true');
    setIsAdmin(true);
    setLoading(false);
  };

  const fetchOrders = async () => {
    try {
      const response = await apiService.getAllOrders();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch orders");
      }

      const ordersData = response.data.orders || response.data;
      setOrders(ordersData);

      // Calculate stats
      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum: number, order: Order) => sum + Number(order.total_amount), 0) || 0;
      const pendingOrders = ordersData?.filter((order: Order) => order.status === 'pending').length || 0;

      setStats({
        totalOrders,
        totalRevenue,
        pendingOrders
      });

    } catch (error: any) {
      toast({
        title: "Error Loading Orders",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredOrders = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (from) {
      from.setHours(0, 0, 0, 0);
    }
    if (to) {
      to.setHours(23, 59, 59, 999);
    }

    if (!from && !to) return orders;

    return orders.filter(order => {
      const created = new Date(order.createdAt);
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
  }, [orders, fromDate, toDate]);

  const calculateOrderTotals = (order: Order) => {
    const itemsTotal = order.order_items?.reduce((sum, item) => {
      return sum + Number(item.price_at_time) * item.quantity;
    }, 0) || 0;

    const shippingCharge = Math.max(Number(order.total_amount) - itemsTotal, 0);
    return { itemsTotal, shippingCharge };
  };

  const handleDownloadReport = (ordersToExport: Order[]) => {
    if (ordersToExport.length === 0) return;

    try {
      setExporting(true);

      const summaryRows = ordersToExport.map((order) => {
        const { itemsTotal, shippingCharge } = calculateOrderTotals(order);
        return {
          "Order Number": order.orderNumber,
          "Customer Name": order.customer_name,
          "Customer Email": order.customer_email,
          "Customer Phone": order.customer_phone,
          Status: order.status,
          "Created At": new Date(order.createdAt).toLocaleString(),
          "Items Count": order.order_items?.length || 0,
          "Items Subtotal": itemsTotal,
          "Shipping Charge": shippingCharge,
          "Total Amount": Number(order.total_amount),
          "Tracking Number": order.tracking_number || "",
          Notes: order.notes || "",
        };
      });

      const itemRows: Record<string, any>[] = [];
      ordersToExport.forEach((order) => {
        order.order_items?.forEach((item) => {
          itemRows.push({
            "Order Number": order.orderNumber,
            Product: item.product?.name || "",
            Quantity: item.quantity,
            "Unit Price": Number(item.price_at_time),
            "Line Total": Number(item.price_at_time) * item.quantity,
          });
        });
      });

      const workbook = XLSX.utils.book_new();
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      const itemsSheet = XLSX.utils.json_to_sheet(itemRows);

      XLSX.utils.book_append_sheet(workbook, summarySheet, "Orders");
      XLSX.utils.book_append_sheet(workbook, itemsSheet, "Order Items");

      const filename = `orders-report-${fromDate || 'all'}-${toDate || 'all'}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast({ title: "Report Ready", description: "Excel report downloaded successfully." });
    } catch (error: any) {
      console.error('Excel export failed', error);
      toast({ title: "Export failed", description: error?.message || 'Could not create Excel file', variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder) return;

    setUpdating(true);
    
    try {
      // Update order in database
      const response = await apiService.updateOrderStatus(selectedOrder._id, {
        orderStatus: orderStatus,
        trackingNumber: trackingNumber || null,
        notes: notes || null
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to update order");
      }

      // Email notification will be handled by backend
      console.log('Order updated successfully, email should be sent by backend');

      toast({
        title: "Order Updated",
        description: `Order ${selectedOrder.orderNumber} has been updated and customer notified.`
      });

      // Refresh orders and close dialog
      fetchOrders();
      setSelectedOrder(null);
      
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      dispatched: "default",
      delivered: "default",
      cancelled: "destructive"
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your Phresh store</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">£{stats.totalRevenue.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
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
                      Clear Filters
                    </Button>
                  )}
                </div>
                <Button
                  onClick={() => handleDownloadReport(filteredOrders)}
                  disabled={exporting || filteredOrders.length === 0}
                  className="shadow-soft"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Generating…' : 'Download Excel'}
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Order Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredOrders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No orders found for the selected range.
                      </div>
                    ) : (
                      filteredOrders.map((order) => {
                        const { shippingCharge } = calculateOrderTotals(order);
                        return (
                          <div key={order._id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <p className="font-semibold">{order.orderNumber}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {order.customer_name} • {order.customer_email}
                                  </p>
                                </div>
                                {getStatusBadge(order.status)}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">£{Number(order.total_amount).toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-sm text-muted-foreground">
                                {order.order_items?.length || 0} item(s) • Phone: {order.customer_phone} • Shipping: {shippingCharge > 0 ? `£${shippingCharge.toFixed(2)}` : 'Free'}
                              </div>

                              <Dialog onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setOrderStatus(order.status);
                                      setTrackingNumber(order.tracking_number || "");
                                      setNotes(order.notes || "");
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Manage
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Manage Order {selectedOrder?.order_number}</DialogTitle>
                                  </DialogHeader>

                                  {selectedOrder && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label>Customer</Label>
                                          <p className="text-sm">{selectedOrder.customer_name}</p>
                                          <p className="text-sm text-muted-foreground">{selectedOrder.customer_email}</p>
                                          <p className="text-sm text-muted-foreground">{selectedOrder.customer_phone}</p>
                                        </div>
                                        <div>
                                          <Label>Total Amount</Label>
                                          <p className="text-lg font-semibold">£{Number(selectedOrder.total_amount).toFixed(2)}</p>
                                        </div>
                                      </div>

                                      {selectedOrder.customer_address && (
                                        <div>
                                          <Label>Address</Label>
                                          <p className="text-sm">{selectedOrder.customer_address}</p>
                                        </div>
                                      )}

                                      <div>
                                        <Label>Items</Label>
                                        <div className="space-y-2">
                                          {selectedOrder.order_items?.map((item, index) => (
                                            <div key={index} className="flex justify-between text-sm">
                                              <span>{item.product.name} x {item.quantity}</span>
                                              <span>£{(item.price_at_time * item.quantity).toFixed(2)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {selectedOrder && selectedOrder._id === order._id && (() => {
                                        const totals = calculateOrderTotals(selectedOrder);
                                        return (
                                          <div className="border-t pt-3 space-y-1 text-sm">
                                            <div className="flex justify-between text-muted-foreground">
                                              <span>Items Subtotal</span>
                                              <span>£{totals.itemsTotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                              <span>Shipping</span>
                                              <span>£{totals.shippingCharge.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold">
                                              <span>Total</span>
                                              <span>£{Number(selectedOrder.total_amount).toFixed(2)}</span>
                                            </div>
                                          </div>
                                        );
                                      })()}

                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor="status">Order Status</Label>
                                          <Select value={orderStatus} onValueChange={setOrderStatus}>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pending">Pending</SelectItem>
                                              <SelectItem value="dispatched">Dispatched</SelectItem>
                                              <SelectItem value="delivered">Delivered</SelectItem>
                                              <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div>
                                          <Label htmlFor="tracking">Tracking Number</Label>
                                          <Input
                                            id="tracking"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="Optional tracking number"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <Label htmlFor="notes">Notes for Customer</Label>
                                        <Textarea
                                          id="notes"
                                          value={notes}
                                          onChange={(e) => setNotes(e.target.value)}
                                          placeholder="Additional information for the customer"
                                          rows={3}
                                        />
                                      </div>

                                      <div className="flex justify-end space-x-2">
                                        <Button
                                          variant="outline"
                                          onClick={() => setSelectedOrder(null)}
                                        >
                                          Cancel
                                        </Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button disabled={updating}>
                                              <Send className="h-4 w-4 mr-2" />
                                              {updating ? "Updating..." : "Update & Notify"}
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Update Order Status</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This will update the order status and send an email notification to the customer. Are you sure?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={updateOrderStatus}>
                                                Update & Send Email
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
