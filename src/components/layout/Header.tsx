import { ShoppingCart, User, Settings, Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useEffect, useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { AuthSheet } from "@/components/AuthSheet";

type NavItem = {
  label: string;
  to: string;
  icon?: LucideIcon;
};

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { items } = useCart();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = useMemo<NavItem[]>(() => {
    const base = [
      { label: "Home", to: "/" },
      { label: "Shop", to: "/products" },
      { label: "Corporate Order", to: "/corporate-order" },
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
      <header className="relative z-50 w-full">
        <div className="container pt-3 pb-2 px-4 md:px-8">
          <div className="flex items-center justify-between gap-4 md:gap-6">
            {/* Left: Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img
                  src="/phresh_logo.jpeg"
                  alt="Phresh - Fresh Juices"
                  className="h-12 w-auto drop-shadow-sm md:h-[90px]"
                  loading="eager"
                  decoding="async"
                />
              </Link>
            </div>

            {/* Center: Navigation Menu (Desktop) */}
            <nav className="hidden md:flex flex-1 justify-center">
              <div className="flex items-center gap-4 lg:gap-6 overflow-hidden whitespace-nowrap">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);

                  return (
                    <Link 
                      key={item.to} 
                      to={item.to} 
                      className={`shrink-0 relative text-sm font-medium text-white font-inter transition-all duration-300 hover:text-green-200 focus-visible:outline-none focus-visible:text-green-200 pb-1 ${
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

            {/* Right: Cart and Auth */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Menu Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="md:hidden text-white hover:bg-white/10 border-white/30" variant="outline" size="icon" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-2">
                    <Link to="/" className="block py-2 text-sm">
                      Home
                    </Link>
                    <Link to="/products" className="block py-2 text-sm">
                      Shop
                    </Link>
                    <Link to="/corporate-order" className="block py-2 text-sm">
                      Corporate Order
                    </Link>
                    <Link to="/contact" className="block py-2 text-sm">
                      Contact Us
                    </Link>
                    {user && isAdmin && (
                      <Link to="/admin-dashboard" className="block py-2 text-sm">
                        Admin
                      </Link>
                    )}
                    <div className="mt-3 border-t pt-3">
                      {user ? (
                        <div className="space-y-2">
                          <div className="px-2 py-1 text-sm text-white font-medium">
                            {user.name || user.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="w-full text-white" onClick={() => navigate('/profile')}>
                              Profile
                            </Button>
                            <Button variant="outline" size="sm" className="w-full text-white border-white/30" onClick={() => signOut()}>
                              Sign Out
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full transition-colors hover:bg-primary hover:text-white"
                            onClick={() => {
                              setAuthMode("signin");
                              setAuthSheetOpen(true);
                            }}
                          >
                            Sign In
                          </Button>
                          <Button 
                            size="sm" 
                            className="w-full bg-primary text-white" 
                            onClick={() => {
                              setAuthMode("signup");
                              setAuthSheetOpen(true);
                            }}
                          >
                            Sign Up
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

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

              {/* Auth Buttons */}
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white font-inter transition-colors hover:text-green-200 hover:bg-white/10 flex items-center gap-2"
                    onClick={() => navigate("/profile")}
                  >
                    <User className="h-4 w-4" />
                    <span>{user.name || user.email}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/30 bg-white/10 text-white transition-colors hover:bg-white/20 backdrop-blur font-inter"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white font-inter transition-colors hover:text-green-200 hover:bg-white/10"
                    onClick={() => {
                      setAuthMode("signin");
                      setAuthSheetOpen(true);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    className="bg-white text-primary shadow-lg hover:bg-green-50 font-inter"
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthSheetOpen(true);
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <AuthSheet open={authSheetOpen} onOpenChange={setAuthSheetOpen} defaultMode={authMode} />
    </>
  );
};
