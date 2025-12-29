import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Package,
  FolderOpen,
  ImageIcon,
  ShoppingCart,
  Star,
  Megaphone,
  LogOut,
  User,
  Settings,
  PlusCircle,
  Trash2,
  LayoutDashboard,
  Home,
  Mail,
  Building2,
  MessageSquare,
  CreditCard
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";


const menuItems = [
  {
    title: "Dashboard",
    url: "/admin-dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Orders",
    url: "/admin-dashboard/orders",
    icon: ShoppingCart
  },
  {
    title: "Products",
    url: "/admin-dashboard/products",
    icon: Package
  },
  {
    title: "Categories",
    url: "/admin-dashboard/categories",
    icon: FolderOpen
  },
  {
    title: "Homepage Categories",
    url: "/admin-dashboard/homepage-categories",
    icon: Home
  },
  {
    title: "Carousel",
    url: "/admin-dashboard/carousel",
    icon: ImageIcon
  },
  {
    title: "Featured Products",
    url: "/admin-dashboard/featured",
    icon: Star
  },
  {
    title: "Announcement Bar",
    url: "/admin-dashboard/announcement",
    icon: Megaphone
  },
  {
    title: "Shipping Settings",
    url: "/admin-dashboard/shipping",
    icon: Settings
  },
  {
    title: "Payment Options",
    url: "/admin-dashboard/payment-options",
    icon: CreditCard
  },
  {
    title: "Reviews",
    url: "/admin-dashboard/reviews",
    icon: MessageSquare
  },
  {
    title: "Blogs",
    url: "/admin-dashboard/blogs",
    icon: FolderOpen
  },
  {
    title: "Corporate Orders",
    url: "/admin-dashboard/corporate-orders",
    icon: Building2
  },
  {
    title: "Contact Queries",
    url: "/admin-dashboard/contact-queries",
    icon: Mail
  },

];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin-dashboard") {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (active: boolean) =>
    `w-full justify-start ${active
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
      : "hover:bg-muted/50"
    }`;

  const handleSignOut = async () => {
    await signOut();
    // signOut already handles redirect for admin pages
  };

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.split('@')[0].substring(0, 2).toUpperCase();
    }
    return "AD";
  };

  return (
    <Sidebar className={`${isCollapsed ? "w-14" : "w-64"} transition-all duration-300`} collapsible="icon">
      <SidebarContent className="gradient-subtle border-r">
        {/* Logo Section */}
        <div className={`p-4 border-b ${isCollapsed ? "px-2" : ""}`}>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full gradient-luxury flex items-center justify-center text-white font-bold text-sm">
              SA
            </div>
            {!isCollapsed && (
              <div>
                <h3 className="font-semibold text-sm">Admin Panel</h3>
                <p className="text-xs text-muted-foreground">Phresh</p>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className={`p-4 border-b ${isCollapsed ? "px-2" : ""}`}>
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"}`}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="gradient-luxury text-white text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavCls(isActive(item.url))}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout Section */}
        <div className="mt-auto p-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={`${isCollapsed ? "w-8 h-8 p-0" : "w-full justify-start"} text-destructive hover:bg-destructive/10`}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className={`h-4 w-4 ${isCollapsed ? "" : "mr-3"}`} />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
