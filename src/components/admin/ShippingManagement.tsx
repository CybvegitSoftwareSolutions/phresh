import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Save } from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface ShippingSettings {
  _id: string;
  cod_enabled: boolean;
  delivery_charges: number;
  free_delivery_threshold: number;
  delivery_time: string;
  applicable_cities: string[];
}

export const ShippingManagement = () => {
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    cod_enabled: true,
    delivery_charges: "200.00",
    free_delivery_threshold: "2000.00",
    delivery_time: "3-5 business days",
    applicable_cities: "Karachi,Lahore,Islamabad"
  });

  useEffect(() => {
    fetchShippingSettings();
  }, []);

  const fetchShippingSettings = async () => {
    try {
      const response = await apiService.getShippingSettings();
      if (response.success && response.data) {
        setSettings(response.data);
        setFormData({
          cod_enabled: response.data.cod_enabled,
          delivery_charges: response.data.delivery_charges.toString(),
          free_delivery_threshold: response.data.free_delivery_threshold.toString(),
          delivery_time: response.data.delivery_time,
          applicable_cities: response.data.applicable_cities.join(',')
        });
      }
    } catch (error) {
      console.error('Error fetching shipping settings:', error);
      toast({
        title: "Error",
        description: "Failed to load shipping settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        cod_enabled: formData.cod_enabled,
        delivery_charges: parseFloat(formData.delivery_charges),
        free_delivery_threshold: parseFloat(formData.free_delivery_threshold),
        delivery_time: formData.delivery_time,
        applicable_cities: formData.applicable_cities.split(',').map(city => city.trim()).filter(city => city)
      };

      const response = await apiService.updateShippingSettings(updateData);
      if (!response.success) {
        throw new Error(response.message || "Failed to update shipping settings");
      }

      toast({
        title: "Success",
        description: "Shipping settings updated successfully"
      });

      // Refresh settings
      await fetchShippingSettings();
    } catch (error) {
      console.error('Error saving shipping settings:', error);
      toast({
        title: "Error",
        description: "Failed to save shipping settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Truck className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Shipping Management</h2>
          <p className="text-muted-foreground">Manage shipping charges and delivery settings</p>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Shipping Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="standard">Delivery Charges (Rs)</Label>
              <Input
                id="standard"
                type="number"
                step="0.01"
                min="0"
                value={formData.delivery_charges}
                onChange={(e) => setFormData({ ...formData, delivery_charges: e.target.value })}
                placeholder="200.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_time">Delivery Time</Label>
              <Input
                id="delivery_time"
                value={formData.delivery_time}
                onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                placeholder="3-5 business days"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Free Delivery Threshold (Rs)</Label>
              <Input
                id="threshold"
                type="number"
                step="0.01"
                min="0"
                value={formData.free_delivery_threshold}
                onChange={(e) => setFormData({ ...formData, free_delivery_threshold: e.target.value })}
                placeholder="2000.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cities">Applicable Cities (comma-separated)</Label>
            <Input
              id="cities"
              value={formData.applicable_cities}
              onChange={(e) => setFormData({ ...formData, applicable_cities: e.target.value })}
              placeholder="Karachi, Lahore, Islamabad"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="cod_enabled"
              checked={formData.cod_enabled}
              onChange={(e) => setFormData({ ...formData, cod_enabled: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="cod_enabled">Enable Cash on Delivery</Label>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="gradient-luxury"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft bg-muted/50">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Current Settings Preview</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Standard shipping: Rs {formData.standard_shipping_charge}</p>
            <p>• Express shipping: Rs {formData.express_shipping_charge}</p>
            <p>• Free shipping for orders above: Rs {formData.free_shipping_threshold}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};