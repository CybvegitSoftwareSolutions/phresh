import { useEffect, useMemo, useState } from "react";
import { BadgePercent, Plus, RefreshCcw, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Coupon = {
  _id: string;
  code: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  appliesTo?: "subtotal" | "total";
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const DEFAULT_FORM = {
  code: "",
  name: "",
  type: "percentage" as "percentage" | "fixed",
  value: "",
  minOrderAmount: "",
  maxDiscount: "",
  appliesTo: "subtotal" as "subtotal" | "total",
  isActive: true,
};

export const CouponsManagement = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const { toast } = useToast();

  useEffect(() => {
    void fetchCoupons(true);
  }, []);

  const fetchCoupons = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      const response = await apiService.getCoupons({ page: 1, limit: 50 });
      const data = response?.data;
      let list: Coupon[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data?.data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data?.data?.data && Array.isArray(data.data.data)) {
        list = data.data.data;
      } else if (data?.coupons && Array.isArray(data.coupons)) {
        list = data.coupons;
      }
      setCoupons(list);
    } catch (error) {
      console.error("Failed to load coupons", error);
      toast({
        title: "Error",
        description: "Could not load coupons.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
      if (showLoader) setLoading(false);
    }
  };

  const openCreateSheet = () => {
    setSheetMode("create");
    setEditingCoupon(null);
    setFormData(DEFAULT_FORM);
    setSheetOpen(true);
  };

  const openEditSheet = (coupon: Coupon) => {
    setSheetMode("edit");
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      name: coupon.name || "",
      type: coupon.type || "percentage",
      value: coupon.value?.toString() || "",
      minOrderAmount: coupon.minOrderAmount?.toString() || "",
      maxDiscount: coupon.maxDiscount?.toString() || "",
      appliesTo: coupon.appliesTo || "subtotal",
      isActive: coupon.isActive ?? true,
    });
    setSheetOpen(true);
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const formatValue = (coupon: Coupon) => {
    if (coupon.type === "percentage") return `${coupon.value}%`;
    return `${coupon.value}`;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = formData.code.trim().toUpperCase();
    const name = formData.name.trim();
    const value = Number(formData.value);

    if (!code || !name || !Number.isFinite(value)) {
      toast({
        title: "Missing details",
        description: "Code, name, and value are required.",
        variant: "destructive",
      });
      return;
    }

    const payload: {
      code?: string;
      name: string;
      type: "percentage" | "fixed";
      value: number;
      minOrderAmount?: number;
      maxDiscount?: number;
      appliesTo?: "subtotal" | "total";
      isActive?: boolean;
    } = {
      name,
      type: formData.type,
      value,
      appliesTo: formData.appliesTo,
      isActive: formData.isActive,
    };

    if (sheetMode === "create") {
      payload.code = code;
    }

    if (formData.minOrderAmount) {
      const minOrderAmount = Number(formData.minOrderAmount);
      if (Number.isFinite(minOrderAmount)) payload.minOrderAmount = minOrderAmount;
    }

    if (formData.type === "percentage" && formData.maxDiscount) {
      const maxDiscount = Number(formData.maxDiscount);
      if (Number.isFinite(maxDiscount)) payload.maxDiscount = maxDiscount;
    }

    try {
      setSaving(true);
      const response =
        sheetMode === "edit" && editingCoupon
          ? await apiService.updateCoupon(editingCoupon._id, payload)
          : await apiService.createCoupon(payload as any);
      if (!response.success) {
        throw new Error(response.message || response.error || "Failed to save coupon");
      }

      toast({
        title: sheetMode === "edit" ? "Coupon updated" : "Coupon created",
        description: sheetMode === "edit" ? "Coupon updated successfully." : "Your new coupon is now available.",
      });

      setSheetOpen(false);
      setEditingCoupon(null);
      setSheetMode("create");
      setFormData(DEFAULT_FORM);
      await fetchCoupons();
    } catch (error) {
      console.error("Failed to create coupon", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not save coupon.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    const confirmed = window.confirm("Delete this coupon? This action cannot be undone.");
    if (!confirmed) return;
    try {
      const response = await apiService.deleteCoupon(couponId);
      if (!response.success) {
        throw new Error(response.message || response.error || "Failed to delete coupon");
      }
      toast({
        title: "Coupon deleted",
        description: "The coupon has been removed.",
      });
      await fetchCoupons();
    } catch (error) {
      console.error("Failed to delete coupon", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not delete coupon.",
        variant: "destructive",
      });
    }
  };

  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((coupon) => coupon.isActive).length;
    const percentage = coupons.filter((coupon) => coupon.type === "percentage").length;
    const fixed = coupons.filter((coupon) => coupon.type === "fixed").length;
    return { total, active, percentage, fixed };
  }, [coupons]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCcw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BadgePercent className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Coupons</h2>
            <p className="text-muted-foreground">Create and manage discount codes.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchCoupons()} disabled={refreshing}>
            <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Button onClick={openCreateSheet} className="gradient-luxury">
            <Plus className="mr-2 h-4 w-4" />
            New Coupon
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-muted/60">
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-muted/60">
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-muted/60">
          <CardHeader className="pb-2">
            <CardDescription>Percentage</CardDescription>
            <CardTitle className="text-2xl">{stats.percentage}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-muted/60">
          <CardHeader className="pb-2">
            <CardDescription>Fixed</CardDescription>
            <CardTitle className="text-2xl">{stats.fixed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {coupons.length === 0 ? (
        <Card className="border-muted/60">
          <CardHeader>
            <CardTitle>No coupons yet</CardTitle>
            <CardDescription>Create a coupon to get started.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coupons.map((coupon) => (
            <Card key={coupon._id} className="border-muted/60 shadow-soft">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{coupon.code}</CardTitle>
                    <CardDescription>{coupon.name}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={coupon.isActive ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="outline" size="icon" onClick={() => openEditSheet(coupon)} title="Edit coupon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDeleteCoupon(coupon._id)} title="Delete coupon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">
                    {coupon.type}
                  </Badge>
                  {coupon.appliesTo && (
                    <Badge variant="outline">Applies to {coupon.appliesTo}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Value</p>
                    <p className="font-semibold">{formatValue(coupon)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Min Order</p>
                    <p className="font-semibold">{coupon.minOrderAmount ?? "—"}</p>
                  </div>
                  {coupon.type === "percentage" && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Max Discount</p>
                      <p className="font-semibold">{coupon.maxDiscount ?? "—"}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
                    <p className="font-semibold">{formatDate(coupon.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{sheetMode === "edit" ? "Edit Coupon" : "Create Coupon"}</SheetTitle>
            <SheetDescription>
              {sheetMode === "edit" ? "Update the coupon details." : "Set up a percentage or fixed amount discount."}
            </SheetDescription>
          </SheetHeader>

          <form className="space-y-4 py-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(event) => setFormData((prev) => ({ ...prev, code: event.target.value }))}
                  placeholder="PHRESH10"
                  disabled={sheetMode === "edit"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="10% off"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as "percentage" | "fixed" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(event) => setFormData((prev) => ({ ...prev, value: event.target.value }))}
                  placeholder={formData.type === "percentage" ? "10" : "200"}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minOrderAmount">Minimum Order Amount</Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(event) => setFormData((prev) => ({ ...prev, minOrderAmount: event.target.value }))}
                  placeholder="200"
                />
              </div>
              {formData.type === "percentage" ? (
                <div className="space-y-2">
                  <Label htmlFor="maxDiscount">Max Discount</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(event) => setFormData((prev) => ({ ...prev, maxDiscount: event.target.value }))}
                    placeholder="150"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Max Discount</Label>
                  <Input disabled placeholder="Not required for fixed coupons" />
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Applies To</Label>
                <Select
                  value={formData.appliesTo}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, appliesTo: value as "subtotal" | "total" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subtotal">Subtotal</SelectItem>
                    <SelectItem value="total">Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Toggle coupon visibility.</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                />
              </div>
            </div>

            <SheetFooter>
              <Button type="submit" className="gradient-luxury" disabled={saving}>
                {saving ? "Saving..." : sheetMode === "edit" ? "Update Coupon" : "Create Coupon"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};
