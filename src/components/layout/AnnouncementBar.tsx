import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { cn } from "@/lib/utils";

interface AnnouncementSettings {
  _id: string;
  title: string;
  message: string;
  link_url?: string;
  text_color: string;
  bg_color: string;
  font_size: string;
  is_active: boolean;
  show_on_homepage: boolean;
  show_in_header: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_BACKGROUND = '#111827';
const DEFAULT_TEXT = '#ffffff';
const DEFAULT_FONT_SIZE = 16;

export const AnnouncementBar = () => {
  const [settings, setSettings] = useState<AnnouncementSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Use active announcements endpoint to get all active announcements
        // Then filter for those that should show in header
        const response = await apiService.getActiveAnnouncements();
        console.log('Announcement response:', response);
        
        // Handle different response structures
        let announcementsData = [];
        if (Array.isArray(response.data)) {
          announcementsData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          announcementsData = response.data.data;
        } else if (response.data && typeof response.data === 'object') {
          // Single announcement object
          announcementsData = [response.data];
        }
        
        console.log('Announcements data:', announcementsData);
        
        if (response.success && announcementsData.length > 0) {
          // Map backend camelCase to frontend snake_case
          const mappedAnnouncements = announcementsData.map((ann: any) => ({
            _id: ann._id,
            title: ann.title || '',
            message: ann.message || '',
            // Handle both camelCase and snake_case
            is_active: ann.isActive !== undefined ? ann.isActive : ann.is_active,
            show_in_header: ann.showInHeader !== undefined ? ann.showInHeader : ann.show_in_header,
            show_on_homepage: ann.showOnHomepage !== undefined ? ann.showOnHomepage : ann.show_on_homepage,
            bg_color: ann.bgColor || ann.bg_color || DEFAULT_BACKGROUND,
            text_color: ann.textColor || ann.text_color || DEFAULT_TEXT,
            font_size: ann.fontSize ? `${ann.fontSize}px` : (ann.font_size || `${DEFAULT_FONT_SIZE}px`),
            link_url: ann.linkUrl || ann.link_url || undefined,
            createdAt: ann.createdAt || '',
            updatedAt: ann.updatedAt || '',
          }));

          console.log('Mapped announcements:', mappedAnnouncements);
          
          // Get the first active announcement that should show in header
          const activeAnnouncement = mappedAnnouncements.find(
            ann => ann.is_active === true && ann.show_in_header === true
          );
          
          console.log('Active announcement found:', activeAnnouncement);
          
          if (activeAnnouncement) {
            setSettings(activeAnnouncement);
          }
        }
      } catch (err) {
        console.error('Failed to load announcement settings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  if (loading) {
    return null;
  }

  // Check if announcement should be displayed
  if (!settings || !settings.is_active || !settings.message?.trim()) {
    console.log('Announcement not displayed:', { 
      hasSettings: !!settings, 
      isActive: settings?.is_active, 
      hasMessage: !!settings?.message?.trim() 
    });
    return null;
  }

  const backgroundColor = settings.bg_color || DEFAULT_BACKGROUND;
  const textColor = settings.text_color || DEFAULT_TEXT;
  const fontSize = typeof settings.font_size === 'string' 
    ? settings.font_size 
    : `${settings.font_size || DEFAULT_FONT_SIZE}px`;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ backgroundColor, color: textColor, fontSize }}
      className="w-full text-sm"
    >
      <div className="container py-2">
        <div className="text-center">
          {settings.link_url ? (
            <a
              href={settings.link_url}
              className="hover:underline font-medium"
              style={{ color: textColor }}
            >
              {settings.message}
            </a>
          ) : (
            <span className="font-medium">
              {settings.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
