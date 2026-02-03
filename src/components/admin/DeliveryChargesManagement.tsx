import { useEffect, useState } from "react";
import { Plus, RefreshCcw, Truck, Pencil } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ShippingSettings = {
  _id?: string;
  cod_enabled?: boolean;
  delivery_charges?: number;
  free_delivery_threshold?: number;
  delivery_time?: string;
  applicable_cities?: string[];
};

const DEFAULT_FORM = {
  delivery_charges: "",
  free_delivery_threshold: "",
  delivery_time: "",
};

export const DeliveryChargesManagement = () => {
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const { toast } = useToast();

  useEffect(() => {
    void fetchSettings(true);
  }, []);

  const fetchSettings = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      const response = await apiService.getShippingSettings();
      if (response.success && response.data) {
        setSettings(response.data as ShippingSettings);
      }
    } catch (error) {
      console.error("Failed to load shipping settings", error);
      toast({
        title: "Error",
        description: "Could not load delivery charges.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
      if (showLoader) setLoading(false);
    }
  };

  const openSheet = () => {
    setFormData({
      delivery_charges: settings?.delivery_charges?.toString() ?? "",
      free_delivery_threshold: settings?.free_delivery_threshold?.toString() ?? "",
      delivery_time: settings?.delivery_time ?? "",
    });
    setSheetOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const deliveryCharges = Number(formData.delivery_charges);
    const freeThreshold = Number(formData.free_delivery_threshold);

    if (!Number.isFinite(deliveryCharges) || deliveryCharges < 0) {
      toast({
        title: "Invalid charges",
        description: "Delivery charges must be a valid number.",
        variant: "destructive",
      });
      return;
    }

    if (!Number.isFinite(freeThreshold) || freeThreshold < 0) {
      toast({
        title: "Invalid threshold",
        description: "Free delivery threshold must be a valid number.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        cod_enabled: settings?.cod_enabled ?? true,
        delivery_charges: deliveryCharges,
        free_delivery_threshold: freeThreshold,
        delivery_time: formData.delivery_time || settings?.delivery_time || "",
        applicable_cities: settings?.applicable_cities ?? [],
      };
      const response = await apiService.updateShippingSettings(payload);
      if (!response.success) {
        throw new Error(response.message || response.error || "Failed to update delivery charges");
      }
      toast({
        title: "Updated",
        description: "Delivery charges updated successfully.",
      });
      setSheetOpen(false);
      await fetchSettings();
    } catch (error) {
      console.error("Failed to update delivery charges", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update delivery charges.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <RefreshCcw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Delivery Charges</h2>
            <p className="text-muted-foreground">Configure delivery pricing and thresholds.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchSettings()} disabled={refreshing}>
            <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Button onClick={openSheet} className="gradient-luxury">
            <Plus className="mr-2 h-4 w-4" />
            New Delivery Charges
          </Button>
        </div>
      </div>

      <Card className="border-muted/60 shadow-soft">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Current Settings</CardTitle>
            <CardDescription>Active delivery charges and thresholds.</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={openSheet} title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivery Charges</p>
            <p className="text-lg font-semibold">{settings?.delivery_charges ?? 0}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Free Delivery Threshold</p>
            <p className="text-lg font-semibold">{settings?.free_delivery_threshold ?? 0}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivery Time</p>
            <p className="text-lg font-semibold">{settings?.delivery_time || "Not set"}</p>
          </div>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Delivery Charges</SheetTitle>
            <SheetDescription>Add or update delivery pricing.</SheetDescription>
          </SheetHeader>

          <form className="space-y-4 py-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="delivery_charges">Delivery Charges</Label>
              <Input
                id="delivery_charges"
                type="number"
                value={formData.delivery_charges}
                onChange={(event) => setFormData((prev) => ({ ...prev, delivery_charges: event.target.value }))}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="free_delivery_threshold">Free Delivery Threshold</Label>
              <Input
                id="free_delivery_threshold"
                type="number"
                value={formData.free_delivery_threshold}
                onChange={(event) => setFormData((prev) => ({ ...prev, free_delivery_threshold: event.target.value }))}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_time">Delivery Time</Label>
              <Input
                id="delivery_time"
                value={formData.delivery_time}
                onChange={(event) => setFormData((prev) => ({ ...prev, delivery_time: event.target.value }))}
                placeholder="2-4 business days"
              />
            </div>

            <SheetFooter>
              <Button type="submit" className="gradient-luxury" disabled={saving}>
                {saving ? "Saving..." : "Save Charges"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};
