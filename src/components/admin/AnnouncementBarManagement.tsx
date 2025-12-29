import { useEffect, useState } from "react";
import { Megaphone, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AnnouncementSettings = {
  _id: string;
  message: string;
  is_active: boolean;
  bg_color: string;
  text_color: string;
  font_size: number;
  link_url?: string;
  show_in_header: boolean;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_FONT_SIZE = 16;

const DEFAULTS: AnnouncementSettings = {
  _id: "",
  message: "",
  is_active: false,
  bg_color: "#111827",
  text_color: "#ffffff",
  font_size: DEFAULT_FONT_SIZE,
  link_url: "",
  show_in_header: true,
  createdAt: "",
  updatedAt: "",
};

type FormState = {
  message: string;
  is_active: boolean;
  bg_color: string;
  text_color: string;
  font_size: number;
  link_url: string;
  show_in_header: boolean;
};

export const AnnouncementBarManagement = () => {
  const [settings, setSettings] = useState<AnnouncementSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormState>({
    message: DEFAULTS.message,
    is_active: DEFAULTS.is_active,
    bg_color: DEFAULTS.bg_color,
    text_color: DEFAULTS.text_color,
    font_size: DEFAULT_FONT_SIZE,
    link_url: DEFAULTS.link_url,
    show_in_header: DEFAULTS.show_in_header,
  });

  useEffect(() => {
    fetchSettings(true);
  }, []);

  const fetchSettings = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const response = await apiService.getHomepageAnnouncements();
      if (response.success && response.data && response.data.length > 0) {
        const record = response.data[0]; // Get the first announcement
        setSettings(record);
        setFormData({
          message: record.message ?? '',
          is_active: Boolean(record.is_active),
          bg_color: record.bg_color || DEFAULTS.bg_color,
          text_color: record.text_color || DEFAULTS.text_color,
          font_size: record.font_size ?? DEFAULT_FONT_SIZE,
          link_url: record.link_url || '',
          show_in_header: Boolean(record.show_in_header),
        });
      } else {
        setSettings(null);
        setFormData({
          message: DEFAULTS.message,
          is_active: DEFAULTS.is_active,
          bg_color: DEFAULTS.bg_color,
          text_color: DEFAULTS.text_color,
          font_size: DEFAULT_FONT_SIZE,
          link_url: DEFAULTS.link_url,
          show_in_header: DEFAULTS.show_in_header,
        });
      }
    } catch (err) {
      console.error('Failed to load announcement settings', err);
      toast({
        title: "Error",
        description: "Could not load announcement settings.",
        variant: "destructive",
      });
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sanitizedFontSize = Number.isFinite(formData.font_size)
        ? Math.min(Math.max(Math.round(formData.font_size), 10), 48)
        : DEFAULT_FONT_SIZE;

      const payload = {
        message: formData.message.trim(),
        is_active: formData.is_active,
        bg_color: formData.bg_color || DEFAULTS.bg_color,
        text_color: formData.text_color || DEFAULTS.text_color,
        font_size: sanitizedFontSize,
        link_url: formData.link_url.trim() || null,
        show_in_header: formData.show_in_header,
      };

      let response;
      if (settings && settings._id) {
        response = await apiService.updateAnnouncement(settings._id, payload);
      } else {
        response = await apiService.createAnnouncement(payload);
      }

      if (!response.success) {
        const errorMessage = response.message || response.error || "Failed to save announcement";
        throw new Error(errorMessage);
      }

      toast({
        title: "Saved",
        description: "Announcement bar settings updated successfully.",
      });

      await fetchSettings();
    } catch (err) {
      console.error('Failed to save announcement settings', err);
      const errorMessage = err instanceof Error ? err.message : "Could not save announcement settings.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 rounded bg-muted"></div>
          <div className="h-40 rounded bg-muted"></div>
        </div>
      </div>
    );
  }

  const previewStyle = {
    backgroundColor: formData.bg_color || DEFAULTS.bg_color,
    color: formData.text_color || DEFAULTS.text_color,
    fontSize: `${formData.font_size || DEFAULT_FONT_SIZE}px`,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Announcement Bar</h2>
          <p className="text-muted-foreground">Control the site-wide announcement banner and its styling.</p>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
            <div>
              <h3 className="font-semibold">Announcement status</h3>
              <p className="text-sm text-muted-foreground">Toggle the announcement bar visibility across the site.</p>
            </div>
            <Switch
              id="announcement-enabled"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcement-message">Message</Label>
            <Textarea
              id="announcement-message"
              value={formData.message}
              onChange={(event) => setFormData({ ...formData, message: event.target.value })}
              placeholder="Share special offers, shipping updates, or store announcements."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Background color</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={formData.bg_color}
                  onChange={(event) => setFormData({ ...formData, bg_color: event.target.value })}
                  className="h-10 w-16 cursor-pointer p-1"
                  aria-label="Announcement background color"
                />
                <Input
                  value={formData.bg_color}
                  onChange={(event) => setFormData({ ...formData, bg_color: event.target.value })}
                  placeholder="#111827"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Text color</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={formData.text_color}
                  onChange={(event) => setFormData({ ...formData, text_color: event.target.value })}
                  className="h-10 w-16 cursor-pointer p-1"
                  aria-label="Announcement text color"
                />
                <Input
                  value={formData.text_color}
                  onChange={(event) => setFormData({ ...formData, text_color: event.target.value })}
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcement-font-size">Font size (px)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="announcement-font-size"
                type="number"
                min={10}
                max={48}
                value={formData.font_size}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setFormData({ ...formData, font_size: Number.isFinite(next) ? next : formData.font_size });
                }}
                className="w-24"
              />
              <input
                type="range"
                min={10}
                max={48}
                value={formData.font_size}
                onChange={(event) => setFormData({ ...formData, font_size: Number(event.target.value) })}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">Preview: {formData.font_size || DEFAULT_FONT_SIZE}px</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link-url">Link URL (optional)</Label>
            <Input
              id="link-url"
              value={formData.link_url}
              onChange={(event) => setFormData({ ...formData, link_url: event.target.value })}
              placeholder="https://example.com"
            />
                    </div>

          <div className="space-y-2">
            <Label htmlFor="show-in-header">Show in header</Label>
            <Switch
              id="show-in-header"
              checked={formData.show_in_header}
              onCheckedChange={(checked) => setFormData({ ...formData, show_in_header: checked })}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gradient-luxury">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg p-4" style={previewStyle}>
            <span className="block text-center font-medium">
                {formData.message || 'Your announcement will appear here.'}
              </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            The preview uses the selected colors and animation. On the storefront, it appears above the main header on every page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
