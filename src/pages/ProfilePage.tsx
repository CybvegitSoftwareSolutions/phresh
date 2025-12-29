import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { User, Package, MapPin, CreditCard, Phone, Mail, Calendar, X, Plus, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  total_amount: number;
  createdAt: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  tracking_number: string | null;
  order_items: {
    _id: string;
    quantity: number;
    price_at_time: number;
    product: {
      _id: string;
      name: string;
      image_url: string | null;
    };
  }[];
}

interface Profile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface Address {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  floor?: string;
  apartment?: string;
  is_default: boolean;
}

interface AddressFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  floor?: string;
  apartment?: string;
  is_default: boolean;
}

export const ProfilePage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    address: ""
  });

  const addressForm = useForm<AddressFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      street: "",
      apartment: "",
      floor: "",
      city: "",
      state: "",
      zipCode: "",
      is_default: false
    }
  });

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      if (user) {
        // Authenticated user: load full profile
        // Get userId from user state or localStorage
        const userId = user._id || localStorage.getItem('user_id');
        // Load user profile
        const profileResponse = await apiService.getProfile(userId || undefined);
        if (profileResponse.success && profileResponse.data) {
          const profileData = profileResponse.data;
          setProfile(profileData);
          setProfileForm({
            full_name: profileData.name || "",
            phone: profileData.phone || "",
            address: profileData.address ? 
              `${profileData.address.street}, ${profileData.address.city}, ${profileData.address.state}, ${profileData.address.zipCode}, ${profileData.address.country}` 
              : ""
          });
        }

        // Load user addresses
        const addressResponse = await apiService.getAddresses();
        if (addressResponse.success && addressResponse.data) {
          setAddresses(addressResponse.data);
        }

        // Load user orders via authenticated endpoint
        const ordersResponse = await apiService.getUserOrders();
        if (ordersResponse.success && ordersResponse.data) {
          // Handle nested response structure: response.data.data or response.data.orders or response.data
          const ordersData = ordersResponse.data.data || ordersResponse.data.orders || (Array.isArray(ordersResponse.data) ? ordersResponse.data : []);
          const mappedOrders = (Array.isArray(ordersData) ? ordersData : []).map((order: any) => ({
            _id: order._id,
            orderNumber: order.orderNumber || order.order_number,
            status: order.orderStatus || order.status || 'pending',
            total_amount: order.total || order.total_amount || 0,
            createdAt: order.createdAt || order.created_at,
            customer_name: order.shippingAddress?.name || order.customer_name || '',
            customer_email: order.guestEmail || order.shippingAddress?.email || order.customer_email || '',
            customer_phone: order.shippingAddress?.phone || order.customer_phone || '',
            customer_address: order.shippingAddress ? 
              `${order.shippingAddress.street || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''}, ${order.shippingAddress.zipCode || ''}, ${order.shippingAddress.country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '')
              : order.customer_address || '',
            tracking_number: order.tracking_number || order.trackingNumber || null,
            order_items: order.items || order.order_items || []
          }));
          setOrders(mappedOrders);
        }
      } else {
        // Guest user: load orders by email from localStorage
        const guestEmail = localStorage.getItem('guest_email');
        if (guestEmail) {
          const ordersResponse = await apiService.getOrdersByEmail(guestEmail);
          if (ordersResponse.success && ordersResponse.data) {
            // Handle nested response structure: response.data.data or response.data.orders or response.data
            const ordersData = ordersResponse.data.data || ordersResponse.data.orders || (Array.isArray(ordersResponse.data) ? ordersResponse.data : []);
            const mappedOrders = (Array.isArray(ordersData) ? ordersData : []).map((order: any) => ({
              _id: order._id,
              orderNumber: order.orderNumber || order.order_number,
              status: order.orderStatus || order.status || 'pending',
              total_amount: order.total || order.total_amount || 0,
              createdAt: order.createdAt || order.created_at,
              customer_name: order.shippingAddress?.name || order.customer_name || '',
              customer_email: order.guestEmail || order.shippingAddress?.email || order.customer_email || '',
              customer_phone: order.shippingAddress?.phone || order.customer_phone || '',
              customer_address: order.shippingAddress ? 
                `${order.shippingAddress.street || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''}, ${order.shippingAddress.zipCode || ''}, ${order.shippingAddress.country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '')
                : order.customer_address || '',
              tracking_number: order.tracking_number || order.trackingNumber || null,
              order_items: order.items || order.order_items || []
            }));
            setOrders(mappedOrders);
          }
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setProfileLoading(true);
    try {
      const updateData = {
        name: profileForm.full_name,
        phone: profileForm.phone,
        address: profileForm.address ? {
          street: profileForm.address.split(',')[0]?.trim() || '',
          city: profileForm.address.split(',')[1]?.trim() || '',
          state: profileForm.address.split(',')[2]?.trim() || '',
          zipCode: profileForm.address.split(',')[3]?.trim() || '',
          country: profileForm.address.split(',')[4]?.trim() || 'Pakistan'
        } : undefined
      };

      const response = await apiService.updateProfile(updateData);
      if (!response.success) {
        throw new Error(response.message || "Failed to update profile");
      }

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      
      setEditingProfile(false);
      loadUserData();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const response = await apiService.cancelOrder(orderId, { reason: "User requested cancellation" });
      if (!response.success) {
        throw new Error(response.message || "Failed to cancel order");
      }

      toast({
        title: "Success",
        description: "Order cancelled successfully"
      });

      loadUserData();
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive"
      });
    }
  };

  const canCancelOrder = (status: string) => {
    const nonCancellableStatuses = ["shipped", "dispatched", "delivered", "cancelled"];
    return !nonCancellableStatuses.includes(status.toLowerCase());
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "dispatched":
        return "bg-indigo-100 text-indigo-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    addressForm.reset({
      firstName: profile?.name?.split(' ')[0] || "",
      lastName: profile?.name?.split(' ').slice(1).join(' ') || "",
      email: user?.email || "",
      phone: profile?.phone || "",
      street: "",
      apartment: "",
      floor: "",
      city: "",
      state: "",
      zipCode: "",
      is_default: addresses.length === 0
    });
    setAddressDialogOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    addressForm.reset(address);
    setAddressDialogOpen(true);
  };

  const onSubmitAddress = async (data: AddressFormData) => {
    setAddressLoading(true);
    try {
      // Ensure state is not empty - use city or default if empty
      const addressData = {
        ...data,
        state: data.state || data.city || "N/A"
      };

      if (editingAddress) {
        const response = await apiService.updateAddress(editingAddress._id, addressData);
        if (!response.success) {
          throw new Error(response.message || "Failed to update address");
        }
        
        toast({
          title: "Success",
          description: "Address updated successfully"
        });
      } else {
        const response = await apiService.addAddress(addressData);
        if (!response.success) {
          throw new Error(response.message || "Failed to add address");
        }
        
        toast({
          title: "Success",
          description: "Address added successfully"
        });
      }
      
      setAddressDialogOpen(false);
      loadUserData();
    } catch (error) {
      console.error("Error saving address:", error);
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive"
      });
    } finally {
      setAddressLoading(false);
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      const response = await apiService.deleteAddress(addressId);
      if (!response.success) {
        throw new Error(response.message || "Failed to delete address");
      }

      toast({
        title: "Success",
        description: "Address deleted successfully"
      });

      loadUserData();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle">
        <Header />
        <div className="container py-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <Header />
      
      <div className="container py-8">
        <div className="gradient-luxury p-8 text-center shadow-luxury rounded-lg mb-8">
          <User className="h-16 w-16 mx-auto mb-4 text-primary-foreground" />
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            My Profile
          </h1>
          <p className="text-primary-foreground/90">
            Manage your account and view your orders
          </p>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className={user ? "grid w-full grid-cols-3" : "grid w-full grid-cols-1"}>
            <TabsTrigger value="orders">
              <Package className="h-4 w-4 mr-2" />
              My Orders
            </TabsTrigger>
            {user && (
              <>
                <TabsTrigger value="profile">
                  <User className="h-4 w-4 mr-2" />
                  Profile Info
                </TabsTrigger>
                <TabsTrigger value="addresses">
                  <MapPin className="h-4 w-4 mr-2" />
                  Addresses
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No orders found</p>
                    <Button asChild className="mt-4">
                      <Link to="/products">Start Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <Card key={order._id} className="border-l-4 border-l-primary">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-lg">Order #{order.orderNumber}</h3>
                              <p className="text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                              {order.tracking_number && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Tracking: {order.tracking_number}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="font-semibold mb-2">Shipping Address</h4>
                              <p className="text-sm text-muted-foreground">
                                {order.customer_name}<br />
                                {order.customer_address}<br />
                                <Phone className="h-3 w-3 inline mr-1" />
                                {order.customer_phone}<br />
                                <Mail className="h-3 w-3 inline mr-1" />
                                {order.customer_email}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Order Items</h4>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {(order.order_items || []).map((item: any) => {
                                  const itemPrice = item.price_at_time || item.price || 0;
                                  const productImage = item.product?.images?.[0]?.url || item.product?.image_url || "/api/placeholder/50/50";
                                  return (
                                    <div key={item._id} className="flex items-center space-x-3">
                                      <img
                                        src={productImage}
                                        alt={item.product?.name || 'Product'}
                                        className="w-12 h-12 object-cover rounded"
                                      />
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{item.product?.name || 'Product'}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Qty: {item.quantity} × Rs {Math.round(Number(itemPrice)).toLocaleString('en-IN')}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <div>
                              <p className="text-lg font-bold">
                                Total: Rs {Math.round(Number(order.total_amount) || 0).toLocaleString('en-IN')}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              {order.order_items?.[0]?.product && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link to={`/products/${order.order_items[0].product._id || order.order_items[0].product.id || ''}`}>
                                    Reorder
                                  </Link>
                                </Button>
                              )}
                              {canCancelOrder(order.status) && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <X className="h-4 w-4 mr-1" />
                                      Cancel Order
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to cancel this order? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>No, Keep Order</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => cancelOrder(order._id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Yes, Cancel Order
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {user && (
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Profile Information
                    <Button
                      variant="outline"
                      onClick={() => setEditingProfile(!editingProfile)}
                    >
                      {editingProfile ? "Cancel" : "Edit"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : editingProfile ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          full_name: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          phone: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          address: e.target.value
                        }))}
                        rows={3}
                      />
                    </div>
                    <Button 
                      onClick={updateProfile} 
                      disabled={profileLoading}
                      className="w-full"
                    >
                      {profileLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-base">{user?.email || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                      <p className="text-base">{profile?.name || profileForm.full_name || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="text-base">{profile?.phone || profileForm.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                      <p className="text-base">
                        {profile?.address ? 
                          (typeof profile.address === 'object' ? 
                            `${profile.address.street || ''}, ${profile.address.city || ''}, ${profile.address.state || ''}, ${profile.address.zipCode || ''}, ${profile.address.country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '')
                            : profile.address
                          ) 
                          : profileForm.address || "Not provided"
                        }
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {user && (
          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Saved Addresses
                  <Button onClick={handleAddAddress}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No saved addresses</p>
                      <p className="text-sm">Add your first address to get started</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {addresses.map((address) => (
                        <Card key={address.id} className={`border-l-4 ${address.is_default ? 'border-l-primary' : 'border-l-muted'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">
                                    {address.firstName} {address.lastName}
                                  </h4>
                                  {address.is_default && (
                                    <Badge variant="secondary">Default</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>{address.street}</p>
                                  {address.apartment && <p>Apartment: {address.apartment}</p>}
                                  {address.floor && <p>Floor: {address.floor}</p>}
                                  <p>{address.city}, {address.state} {address.zipCode}</p>
                                  <p>
                                    <Phone className="h-3 w-3 inline mr-1" />
                                    {address.phone}
                                  </p>
                                  <p>
                                    <Mail className="h-3 w-3 inline mr-1" />
                                    {address.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditAddress(address)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Address</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this address? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteAddress(address._id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {orders.length > 0 && (
                    <div className="mt-8">
                      <h4 className="font-semibold mb-3">Previously Used Addresses (Order History)</h4>
                      <div className="space-y-3">
                        {Array.from(new Set(orders.map(order => 
                          `${order.customer_name}|${order.customer_address}|${order.customer_phone}|${order.customer_email}`
                        ))).map((addressKey, index) => {
                          const [name, address, phone, email] = addressKey.split('|');
                          return (
                            <Card key={index} className="border-dashed opacity-75">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h5 className="font-medium">{name}</h5>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      <p>{address}</p>
                                      <p>
                                        <Phone className="h-3 w-3 inline mr-1" />
                                        {phone}
                                      </p>
                                      <p>
                                        <Mail className="h-3 w-3 inline mr-1" />
                                        {email}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="outline">Order History</Badge>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address Form Dialog */}
            <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingAddress ? "Edit Address" : "Add New Address"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...addressForm}>
                  <form onSubmit={addressForm.handleSubmit(onSubmitAddress)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addressForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={addressForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addressForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addressForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addressForm.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="apartment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apartment (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={addressForm.control}
                      name="floor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Floor (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addressForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={addressForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addressForm.control}
                      name="is_default"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Set as default address</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddressDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addressLoading}>
                        {addressLoading ? "Saving..." : editingAddress ? "Update" : "Add"} Address
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};
