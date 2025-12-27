import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Building2, CheckCircle, Calendar, Users, MapPin, DollarSign, Package, Phone, Mail, User } from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

type CorporateOrder = {
  _id: string;
  companyName: string;
  contactPerson: {
    name: string;
    email: string;
    phone: string;
    position?: string;
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    instructions?: string;
  };
  orderDetails: {
    eventDate: string;
    eventType: string;
    estimatedGuests: number;
    specialRequirements?: string;
  };
  pricing: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    quoteValidUntil: string;
  };
  items: Array<{
    _id: string;
    product: string;
    quantity: number;
    price: number;
    total: number;
    notes?: string;
  }>;
  status: 'pending' | 'approved' | 'rejected' | 'resolved';
  assignedTo?: string | null;
  notes: string[];
  createdAt: string;
  updatedAt: string;
};

export const CorporateOrdersManagement = () => {
  const [orders, setOrders] = useState<CorporateOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CorporateOrder | null>(null);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllCorporateOrders();
      console.log('Corporate orders response:', response);
      if (response.success && response.data) {
        // Handle nested data structure
        let ordersData = [];
        if (response.data.data && Array.isArray(response.data.data)) {
          ordersData = response.data.data;
        } else if (Array.isArray(response.data)) {
          ordersData = response.data;
        } else if (response.data.orders && Array.isArray(response.data.orders)) {
          ordersData = response.data.orders;
        }
        
        // Map API response to our type
        const mappedOrders: CorporateOrder[] = ordersData.map((order: any) => ({
          _id: order._id || order.id,
          companyName: order.companyName || order.company_name || 'Unknown Company',
          contactPerson: {
            name: order.contactPerson?.name || order.name || 'Unknown',
            email: order.contactPerson?.email || order.email || '',
            phone: order.contactPerson?.phone || order.phone || '',
            position: order.contactPerson?.position || order.position || undefined
          },
          deliveryAddress: {
            street: order.deliveryAddress?.street || order.address?.street || '',
            city: order.deliveryAddress?.city || order.address?.city || 'TBD',
            state: order.deliveryAddress?.state || order.address?.state || 'TBD',
            zipCode: order.deliveryAddress?.zipCode || order.address?.zipCode || '00000',
            country: order.deliveryAddress?.country || order.address?.country || 'Pakistan',
            instructions: order.deliveryAddress?.instructions || order.instructions || undefined
          },
          orderDetails: {
            eventDate: order.orderDetails?.eventDate || order.eventDate || '',
            eventType: order.orderDetails?.eventType || order.eventType || '',
            estimatedGuests: order.orderDetails?.estimatedGuests || order.estimatedGuests || 0,
            specialRequirements: order.orderDetails?.specialRequirements || order.specialRequirements || ''
          },
          pricing: {
            subtotal: order.pricing?.subtotal || order.subtotal || 0,
            discount: order.pricing?.discount || order.discount || 0,
            tax: order.pricing?.tax || order.tax || 0,
            total: order.pricing?.total || order.total || 0,
            quoteValidUntil: order.pricing?.quoteValidUntil || order.quoteValidUntil || ''
          },
          items: order.items || [],
          status: order.status || 'pending',
          assignedTo: order.assignedTo || null,
          notes: order.notes || [],
          createdAt: order.createdAt || order.created_at || new Date().toISOString(),
          updatedAt: order.updatedAt || order.updated_at || order.createdAt || new Date().toISOString()
        }));
        
        setOrders(mappedOrders);
        
        // Fetch product names for items
        const productIds = new Set<string>();
        mappedOrders.forEach(order => {
          order.items.forEach(item => {
            if (item.product) productIds.add(item.product);
          });
        });
        
        if (productIds.size > 0) {
          try {
            const productsResponse = await apiService.getAllProducts();
            if (productsResponse.success && productsResponse.data) {
              const productsData = productsResponse.data.data || productsResponse.data.products || productsResponse.data;
              const products = Array.isArray(productsData) ? productsData : [];
              const namesMap: Record<string, string> = {};
              products.forEach((product: any) => {
                if (product._id) namesMap[product._id] = product.name || 'Unknown Product';
              });
              setProductNames(namesMap);
            }
          } catch (e) {
            console.warn('Failed to fetch product names:', e);
          }
        }
      } else {
        throw new Error(response.message || "Failed to fetch corporate orders");
      }
    } catch (e: any) {
      console.error('Error loading corporate orders:', e);
      toast({ 
        title: 'Failed to load corporate orders', 
        description: e.message || 'Unknown error', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: 'Pending', variant: 'outline' },
      approved: { label: 'Approved', variant: 'default' },
      rejected: { label: 'Rejected', variant: 'destructive' },
      resolved: { label: 'Resolved', variant: 'secondary' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);
  };

  const formatEventType = (eventType: string) => {
    return eventType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Corporate Orders</h1>
          <p className="text-muted-foreground mt-1">Manage corporate bulk orders and quotes</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>
      {loading ? (
        <div className="text-muted-foreground">Loading corporate orders…</div>
      ) : (
        <div className="space-y-4">
          {[...orders]
            .sort((a, b) => {
              const ar = a.status === 'resolved', br = b.status === 'resolved';
              if (ar !== br) return ar ? 1 : -1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
            .map((order) => (
              <Card 
                key={order._id} 
                className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                  order.status === 'resolved' ? 'border-green-500/60' : 'border-amber-300/60'
                }`} 
                onClick={() => { setSelected(order); setOpen(true); }}
              >
                <CardHeader className="flex items-start justify-between pb-3">
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {order.companyName}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {order.contactPerson.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {order.contactPerson.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {order.contactPerson.phone}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(order.status)}
                    {order.pricing.total > 0 && (
                      <div className="text-sm font-semibold text-primary">
                        {formatCurrency(order.pricing.total)}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    {order.orderDetails.eventDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Event: {new Date(order.orderDetails.eventDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {order.orderDetails.estimatedGuests > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{order.orderDetails.estimatedGuests} guests</span>
                      </div>
                    )}
                    {order.items.length > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  {order.deliveryAddress.street && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span>
                        {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Submitted: {new Date(order.createdAt).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          {orders.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No corporate orders yet.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Corporate Order Details
            </DialogTitle>
            <DialogDescription>
              Order ID: {selected?._id}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              {/* Company & Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <strong className="text-sm text-muted-foreground">Company Name:</strong>
                      <p className="font-semibold">{selected.companyName}</p>
                    </div>
                    <div>
                      <strong className="text-sm text-muted-foreground">Status:</strong>
                      <div className="mt-1">{getStatusBadge(selected.status)}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contact Person
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <strong className="text-sm text-muted-foreground">Name:</strong>
                      <p>{selected.contactPerson.name}</p>
                    </div>
                    {selected.contactPerson.position && (
                      <div>
                        <strong className="text-sm text-muted-foreground">Position:</strong>
                        <p>{selected.contactPerson.position}</p>
                      </div>
                    )}
                    <div>
                      <strong className="text-sm text-muted-foreground">Email:</strong>
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selected.contactPerson.email}
                      </p>
                    </div>
                    <div>
                      <strong className="text-sm text-muted-foreground">Phone:</strong>
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selected.contactPerson.phone}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="font-medium">
                      {selected.deliveryAddress.street || 'N/A'}
                    </p>
                    <p className="text-muted-foreground">
                      {selected.deliveryAddress.city}, {selected.deliveryAddress.state} {selected.deliveryAddress.zipCode}
                    </p>
                    <p className="text-muted-foreground">{selected.deliveryAddress.country}</p>
                  </div>
                  {selected.deliveryAddress.instructions && (
                    <div className="mt-3 pt-3 border-t">
                      <strong className="text-sm text-muted-foreground">Instructions:</strong>
                      <p className="text-sm">{selected.deliveryAddress.instructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Event Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selected.orderDetails.eventDate && (
                    <div>
                      <strong className="text-sm text-muted-foreground">Event Date:</strong>
                      <p>{new Date(selected.orderDetails.eventDate).toLocaleString()}</p>
                    </div>
                  )}
                  {selected.orderDetails.eventType && (
                    <div>
                      <strong className="text-sm text-muted-foreground">Event Type:</strong>
                      <p>{formatEventType(selected.orderDetails.eventType)}</p>
                    </div>
                  )}
                  {selected.orderDetails.estimatedGuests > 0 && (
                    <div>
                      <strong className="text-sm text-muted-foreground">Estimated Guests:</strong>
                      <p className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {selected.orderDetails.estimatedGuests}
                      </p>
                    </div>
                  )}
                  {selected.orderDetails.specialRequirements && (
                    <div className="md:col-span-2">
                      <strong className="text-sm text-muted-foreground">Special Requirements:</strong>
                      <p>{selected.orderDetails.specialRequirements}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Items */}
              {selected.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Order Items ({selected.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selected.items.map((item, index) => (
                        <div key={item._id || index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">
                              {productNames[item.product] || `Product ${item.product}`}
                            </p>
                            {item.notes && (
                              <p className="text-sm text-muted-foreground">{item.notes}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              Quantity: {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.total)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pricing Summary */}
              {(selected.pricing.subtotal > 0 || selected.pricing.total > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pricing Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(selected.pricing.subtotal)}</span>
                    </div>
                    {selected.pricing.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(selected.pricing.discount)}</span>
                      </div>
                    )}
                    {selected.pricing.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax:</span>
                        <span>{formatCurrency(selected.pricing.tax)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(selected.pricing.total)}</span>
                    </div>
                    {selected.pricing.quoteValidUntil && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Quote valid until: {new Date(selected.pricing.quoteValidUntil).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>Created: {new Date(selected.createdAt).toLocaleString()}</span>
                <span>Updated: {new Date(selected.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            {selected && selected.status !== 'resolved' && (
              <Button onClick={async () => {
                try {
                  const response = await apiService.updateCorporateOrderStatus(selected._id, 'resolved');
                  if (response.success) {
                    toast({
                      title: 'Success',
                      description: 'Order marked as resolved'
                    });
                    setOpen(false);
                    load();
                  }
                } catch (e: any) {
                  toast({ 
                    title: 'Update failed', 
                    description: e.message || 'Failed to update order status', 
                    variant: 'destructive' 
                  });
                }
              }}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
