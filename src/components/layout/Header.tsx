import { ShoppingCart, Settings, Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useEffect, useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";

type NavItem = {
  label: string;
  to: string;
  icon?: LucideIcon;
};

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { items } = useCart();
  const [isAdmin, setIsAdmin] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = useMemo<NavItem[]>(() => {
    const base = [
      { label: "Home", to: "/" },
      { label: "Juices", to: "/products" },
      { label: "Why Phresh?", to: "/why-phresh" },
      { label: "Corporate & Events", to: "/corporate-order" },
      { label: "Contact Us", to: "/contact" },
    ];

    if (user && isAdmin) {
      base.push({ label: "Admin", to: "/admin-dashboard", icon: Settings } as NavItem);
    }

    return base;
  }, [user, isAdmin]);

  // Check admin status
  useEffect(() => {
    if (user) {
      setIsAdmin(user.role === 'admin');
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Check if a nav item is active
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <AnnouncementBar />
      <header 
        className="relative z-50 w-full"
        style={{
          backgroundImage: 'url(/bg-green.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container pt-3 pb-2 px-4 md:px-8">
          <div className="flex items-center justify-between gap-4 md:gap-6">
            {/* Left: Mobile Menu Button (Mobile) / Navigation Menu (Desktop) */}
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="md:hidden bg-white hover:bg-white/90 border-white/30" variant="outline" size="icon" aria-label="Open menu">
                    <Menu className="h-5 w-5 text-black" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-2">
                    {navItems.map((item) => (
                      <Link key={item.to} to={item.to} className="block py-2 text-sm">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Navigation Menu */}
              <nav className="hidden md:flex items-center ml-4">
                <div className="flex items-center gap-4 lg:gap-6 overflow-hidden whitespace-nowrap">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.to);

                    return (
                      <Link 
                        key={item.to} 
                        to={item.to} 
                        className={`shrink-0 relative text-sm font-medium text-white font-playfair transition-all duration-300 hover:text-green-200 focus-visible:outline-none focus-visible:text-green-200 pb-1 ${
                          active ? 'border-b-2 border-green-900' : ''
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {Icon ? <Icon className="h-4 w-4" /> : null}
                          <span>{item.label}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>

            {/* Center: Logo */}
            <div className="flex items-center flex-1 justify-center">
              <Link to="/" className="flex items-center">
                <img
                  src="/logo-white.png"
                  alt="Phresh - Fresh Juices"
                  className="h-12 w-auto drop-shadow-sm md:h-[90px]"
                  loading="eager"
                  decoding="async"
                />
              </Link>
            </div>

            {/* Right: Cart */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white transition-colors hover:text-green-200 hover:bg-white/10"
                onClick={() => navigate("/cart")}
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center p-0 text-xs font-medium bg-green-900 text-white"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
