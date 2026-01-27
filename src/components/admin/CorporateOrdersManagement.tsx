import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building2, CheckCircle, Calendar, Users, MapPin, Phone, Mail, User, MessageSquare, Send } from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

type CorporateOrder = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  purpose: string;
  address: string;
  number_of_people: number;
  notes?: Array<{
    _id?: string;
    message: string;
    isInternal: boolean;
    createdAt?: string;
    createdBy?: string;
  }>;
  status?: 'pending' | 'approved' | 'rejected' | 'resolved';
  createdAt: string;
  updatedAt: string;
};

export const CorporateOrdersManagement = () => {
  const [orders, setOrders] = useState<CorporateOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CorporateOrder | null>(null);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
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
        
        // Map API response to our type (new simplified structure)
        const mappedOrders: CorporateOrder[] = ordersData.map((order: any) => ({
          _id: order._id || order.id,
          name: order.name || order.contactPerson?.name || 'Unknown',
          email: order.email || order.contactPerson?.email || '',
          phone: order.phone || order.contactPerson?.phone || '',
          purpose: order.purpose || order.orderDetails?.eventType || '',
          address: order.address || order.deliveryAddress?.street || '',
          number_of_people: order.number_of_people || order.orderDetails?.estimatedGuests || 0,
          notes: order.notes || [],
          status: order.status || 'pending',
          createdAt: order.createdAt || order.created_at || new Date().toISOString(),
          updatedAt: order.updatedAt || order.updated_at || order.createdAt || new Date().toISOString()
        }));
        
        setOrders(mappedOrders);
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


  const handleAddNote = async () => {
    if (!selected || !newNote.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a note message',
        variant: 'destructive'
      });
      return;
    }

    setAddingNote(true);
    try {
      const response = await apiService.addCorporateOrderNote(selected._id, {
        message: newNote.trim(),
        isInternal: true
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Note added successfully'
        });
        setNewNote("");
        // Reload orders to get updated notes
        load();
        // Update selected order with new note
        if (selected) {
          const updatedNotes = selected.notes || [];
          updatedNotes.push({
            message: newNote.trim(),
            isInternal: true,
            createdAt: new Date().toISOString()
          });
          setSelected({ ...selected, notes: updatedNotes });
        }
      } else {
        throw new Error(response.message || 'Failed to add note');
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to add note',
        variant: 'destructive'
      });
    } finally {
      setAddingNote(false);
    }
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
                      {order.name}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {order.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {order.phone}
                      </span>
                      {order.number_of_people > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {order.number_of_people} people
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(order.status || 'pending')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.purpose && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Purpose:</strong> {order.purpose}
                    </div>
                  )}
                  {order.address && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span>{order.address}</span>
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
              {/* Contact Person */}
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
                    <p>{selected.name}</p>
                  </div>
                  <div>
                    <strong className="text-sm text-muted-foreground">Email:</strong>
                    <p className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selected.email}
                    </p>
                  </div>
                  <div>
                    <strong className="text-sm text-muted-foreground">Phone:</strong>
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selected.phone}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{selected.address || 'N/A'}</p>
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
                <CardContent className="space-y-2">
                  {selected.purpose && (
                    <div>
                      <strong className="text-sm text-muted-foreground">Purpose:</strong>
                      <p>{selected.purpose}</p>
                    </div>
                  )}
                  {selected.number_of_people > 0 && (
                    <div>
                      <strong className="text-sm text-muted-foreground">Number of People:</strong>
                      <p className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {selected.number_of_people}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Existing Notes */}
                  {selected.notes && selected.notes.length > 0 ? (
                    <div className="space-y-3">
                      {selected.notes.map((note, index) => (
                        <div key={note._id || index} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {note.isInternal && (
                                <Badge variant="outline" className="text-xs">Internal</Badge>
                              )}
                              {note.createdAt && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(note.createdAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm">{note.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No notes yet</p>
                  )}

                  <Separator />

                  {/* Add Note Form */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="note-message">Add Note</Label>
                      <Textarea
                        id="note-message"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Enter your note here..."
                        rows={3}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={handleAddNote}
                      disabled={addingNote || !newNote.trim()}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {addingNote ? 'Adding...' : 'Add Note'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

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
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
