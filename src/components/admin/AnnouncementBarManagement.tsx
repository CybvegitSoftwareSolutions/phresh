import { useEffect, useMemo, useState } from "react";
import { Megaphone, Pencil, Plus, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Announcement = {
  _id: string;
  title: string;
  message: string;
  type?: string;
  priority?: string;
  isActive?: boolean;
  targetAudience?: string;
  targetUsers?: string[];
  isDismissible?: boolean;
  showOnHomepage?: boolean;
  showInHeader?: boolean;
  createdBy?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  views?: number;
  clicks?: number;
  startDate?: string;
  createdAt?: string;
  updatedAt?: string;
  bgColor?: string;
  fontSize?: number;
  linkUrl?: string | null;
  textColor?: string;
};

const DEFAULT_FORM = {
  title: "",
  message: "",
  type: "info",
  priority: "medium",
  isActive: true,
  targetAudience: "all",
  isDismissible: true,
  showOnHomepage: true,
  showInHeader: false,
  startDate: "",
  bgColor: "#111827",
  textColor: "#ffffff",
  fontSize: 14,
  linkUrl: "",
};

export const AnnouncementBarManagement = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState(DEFAULT_FORM);

  useEffect(() => {
    void fetchAnnouncements(true);
  }, []);

  const fetchAnnouncements = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      const response = await apiService.getAdminAnnouncements({ page: 1, limit: 50 });
      const data = response?.data;
      let list: Announcement[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data?.data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data?.data?.data && Array.isArray(data.data.data)) {
        list = data.data.data;
      } else if (data?.announcements && Array.isArray(data.announcements)) {
        list = data.announcements;
      }
      setAnnouncements(list);
    } catch (error) {
      console.error("Failed to load announcements", error);
      toast({
        title: "Error",
        description: "Could not load announcements.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
      if (showLoader) setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        priority: formData.priority,
        isActive: formData.isActive,
        targetAudience: formData.targetAudience,
        targetUsers: [],
        isDismissible: formData.isDismissible,
        showOnHomepage: formData.showOnHomepage,
        showInHeader: formData.showInHeader,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        bgColor: formData.bgColor || "#111827",
        textColor: formData.textColor || "#ffffff",
        fontSize: Number.isFinite(formData.fontSize) ? Math.round(formData.fontSize) : 14,
        linkUrl: formData.linkUrl.trim() || null,
      };

      const response =
        sheetMode === "edit" && editingAnnouncement
          ? await apiService.updateAnnouncement(editingAnnouncement._id, payload)
          : await apiService.createAnnouncement(payload);
      if (!response.success) {
        const errorMessage = response.message || response.error || "Failed to create announcement";
        throw new Error(errorMessage);
      }

      toast({
        title: sheetMode === "edit" ? "Updated" : "Created",
        description: sheetMode === "edit" ? "Announcement updated successfully." : "Announcement created successfully.",
      });

      setSheetOpen(false);
      setFormData(DEFAULT_FORM);
      setEditingAnnouncement(null);
      setSheetMode("create");
      await fetchAnnouncements();
    } catch (error) {
      console.error("Failed to create announcement", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not create announcement.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "Not set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleString();
  };

  const emptyState = useMemo(() => !loading && announcements.length === 0, [loading, announcements.length]);

  const openCreateSheet = () => {
    setSheetMode("create");
    setEditingAnnouncement(null);
    setFormData(DEFAULT_FORM);
    setSheetOpen(true);
  };

  const openEditSheet = (announcement: Announcement) => {
    setSheetMode("edit");
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title || "",
      message: announcement.message || "",
      type: announcement.type || "info",
      priority: announcement.priority || "medium",
      isActive: announcement.isActive ?? true,
      targetAudience: announcement.targetAudience || "all",
      isDismissible: announcement.isDismissible ?? true,
      showOnHomepage: announcement.showOnHomepage ?? true,
      showInHeader: announcement.showInHeader ?? false,
      startDate: announcement.startDate ? new Date(announcement.startDate).toISOString().slice(0, 16) : "",
      bgColor: announcement.bgColor || "#111827",
      textColor: announcement.textColor || "#ffffff",
      fontSize: announcement.fontSize ?? 14,
      linkUrl: announcement.linkUrl || "",
    });
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Announcement Bar</h2>
            <p className="text-muted-foreground">Manage announcements shown on the storefront and header.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchAnnouncements()} disabled={refreshing}>
            <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Button onClick={openCreateSheet} className="gradient-luxury">
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={`skeleton-${idx}`} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-1/2 rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-10 w-full rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : emptyState ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No announcements yet. Create the first one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {announcements.map((announcement) => (
            <Card key={announcement._id} className="flex h-full flex-col border">
              <CardHeader className="space-y-2 border-b">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{announcement.title || "Untitled announcement"}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">{announcement.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditSheet(announcement)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Badge variant={announcement.isActive ? "default" : "secondary"}>
                      {announcement.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">{announcement.type || "info"}</Badge>
                  <Badge variant="outline">{announcement.priority || "medium"}</Badge>
                  {announcement.showOnHomepage && <Badge variant="outline">Homepage</Badge>}
                  {announcement.showInHeader && <Badge variant="outline">Header</Badge>}
                  {announcement.isDismissible && <Badge variant="outline">Dismissible</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4 pt-4">
                <div className="grid gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Views</span>
                    <span className="font-medium text-foreground">{announcement.views ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Clicks</span>
                    <span className="font-medium text-foreground">{announcement.clicks ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Start date</span>
                    <span className="font-medium text-foreground">{formatDate(announcement.startDate)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex h-5 w-5 rounded-full border" style={{ backgroundColor: announcement.bgColor || "#111827" }} />
                  <span>{announcement.bgColor || "#111827"}</span>
                  <span className="inline-flex h-5 w-5 rounded-full border" style={{ backgroundColor: announcement.textColor || "#ffffff" }} />
                  <span>{announcement.textColor || "#ffffff"}</span>
                </div>

                <div className="rounded-md border px-3 py-2 text-xs" style={{ backgroundColor: announcement.bgColor || "#111827", color: announcement.textColor || "#ffffff", fontSize: `${announcement.fontSize || 14}px` }}>
                  {announcement.message || "Announcement preview"}
                </div>

                <div className="text-xs text-muted-foreground">
                  Created by {announcement.createdBy?.name || "Admin"} · {formatDate(announcement.createdAt)}
                </div>

                {announcement.linkUrl && (
                  <a className="text-xs text-primary underline" href={announcement.linkUrl} target="_blank" rel="noreferrer">
                    {announcement.linkUrl}
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{sheetMode === "edit" ? "Edit Announcement" : "Create Announcement"}</SheetTitle>
            <SheetDescription>Configure the announcement text, visibility, and styling.</SheetDescription>
          </SheetHeader>
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                placeholder="Free Shipping"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea
                id="announcement-message"
                value={formData.message}
                onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                placeholder="Free shipping on orders over Rs. 1000"
                rows={3}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Target audience</Label>
                <Select value={formData.targetAudience} onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="guests">Guests</SelectItem>
                    <SelectItem value="users">Logged in users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="announcement-start">Start date (optional)</Label>
                <Input
                  id="announcement-start"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(event) => setFormData({ ...formData, startDate: event.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Background color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={formData.bgColor}
                    onChange={(event) => setFormData({ ...formData, bgColor: event.target.value })}
                    className="h-10 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={formData.bgColor}
                    onChange={(event) => setFormData({ ...formData, bgColor: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Text color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={formData.textColor}
                    onChange={(event) => setFormData({ ...formData, textColor: event.target.value })}
                    className="h-10 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={formData.textColor}
                    onChange={(event) => setFormData({ ...formData, textColor: event.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="announcement-font-size">Font size</Label>
                <Input
                  id="announcement-font-size"
                  type="number"
                  min={10}
                  max={48}
                  value={formData.fontSize}
                  onChange={(event) => setFormData({ ...formData, fontSize: Number(event.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcement-link">Link URL (optional)</Label>
                <Input
                  id="announcement-link"
                  value={formData.linkUrl}
                  onChange={(event) => setFormData({ ...formData, linkUrl: event.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Show the announcement immediately.</p>
                </div>
                <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Dismissible</p>
                  <p className="text-xs text-muted-foreground">Allow users to close it.</p>
                </div>
                <Switch checked={formData.isDismissible} onCheckedChange={(checked) => setFormData({ ...formData, isDismissible: checked })} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Show on homepage</p>
                  <p className="text-xs text-muted-foreground">Visible on the storefront.</p>
                </div>
                <Switch checked={formData.showOnHomepage} onCheckedChange={(checked) => setFormData({ ...formData, showOnHomepage: checked })} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Show in header</p>
                  <p className="text-xs text-muted-foreground">Pinned to the header.</p>
                </div>
                <Switch checked={formData.showInHeader} onCheckedChange={(checked) => setFormData({ ...formData, showInHeader: checked })} />
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <div
                className="rounded-md px-3 py-2 text-center"
                style={{
                  backgroundColor: formData.bgColor || "#111827",
                  color: formData.textColor || "#ffffff",
                  fontSize: `${formData.fontSize || 14}px`,
                }}
              >
                {formData.message || "Announcement preview"}
              </div>
            </div>

            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gradient-luxury" disabled={saving}>
                {saving ? "Saving..." : sheetMode === "edit" ? "Update announcement" : "Create announcement"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};
