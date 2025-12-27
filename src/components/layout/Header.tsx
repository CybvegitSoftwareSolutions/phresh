import { ShoppingCart, User, Search, Settings, Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { apiService } from "@/services/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";

interface SearchSuggestion {
  _id: string;
  name: string;
  image_url: string;
  price: number;
}

type NavItem = {
  label: string;
  to: string;
  icon?: LucideIcon;
};

export const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { items } = useCart();
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const navLinkClass =
    "shrink-0 relative text-sm font-medium text-gray-700 font-inter transition-all duration-300 hover:text-primary focus-visible:outline-none focus-visible:text-primary after:absolute after:left-1/2 after:-bottom-1 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 after:content-[''] hover:after:left-0 hover:after:w-full";

  const navItems = useMemo<NavItem[]>(() => {
    const base = [
      { label: "Home", to: "/" },
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

  // Debounced search for suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await apiService.searchProducts(query, { page: 1, limit: 5 });
      if (response.success && response.data) {
        const products = (response.data as any)?.products || response.data;
        setSuggestions(Array.isArray(products) ? products : []);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Debounce the search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        (desktopSearchRef.current && desktopSearchRef.current.contains(target)) ||
        (mobileSearchRef.current && mobileSearchRef.current.contains(target))
      ) {
        return;
      }
      setShowSuggestions(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSuggestions(false);
      setShowMobileSearch(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    navigate(`/products/${suggestion._id}`);
    setSearchQuery("");
    setShowSuggestions(false);
    setShowMobileSearch(false);
  };

  const handleSuggestionSearch = (suggestion: SearchSuggestion) => {
    navigate(`/search?q=${encodeURIComponent(suggestion.name)}`);
    setSearchQuery("");
    setShowSuggestions(false);
    setShowMobileSearch(false);
  };

  const baseInputClasses = "w-full pl-10 bg-white/80 border border-white/60 text-gray-800 placeholder:text-gray-500 backdrop-blur-sm shadow-[0px_6px_20px_rgba(0,0,0,0.12)]";

  const renderSearch = (
    ref: React.RefObject<HTMLDivElement>,
    wrapperClasses: string,
    inputExtraClasses = ""
  ) => (
    <div ref={ref} className={`relative ${wrapperClasses}`}>
      <form onSubmit={handleSearch}>
        <Search style={{ marginLeft: 200 }} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-500 z-10" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
          placeholder="Search fresh juices..."
          className={`${baseInputClasses} ${inputExtraClasses}`.trim()}
          style={{ width: 700, marginLeft: 200 }}
        />
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg z-50">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion._id}
              className="group cursor-pointer border-b border-gray-100 p-3 last:border-b-0 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={suggestion.image_url || "/placeholder.svg"}
                  alt={suggestion.name}
                  className="h-10 w-10 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 group-hover:text-primary">
                    {suggestion.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span>Rs</span>
                    <span className="ml-1">{suggestion.price.toFixed(2)}</span>
                  </p>
                  <div className="mt-2 flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 py-1 text-xs"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 py-1 text-xs"
                      onClick={() => handleSuggestionSearch(suggestion)}
                    >
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <AnnouncementBar />
      <header className="relative z-50 w-full border-b gradient-header backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-elegant">
        <div className="container flex flex-col gap-3 py-3">
          <div className="flex items-center justify-between gap-2 md:grid md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="flex items-center gap-2 md:gap-4">
              <Link to="/" className="flex min-w-0 flex-1 justify-center">
                <img
                  src="/phresh_logo.jpeg"
                  alt="Phresh - Fresh Juices"
                  className="h-12 w-auto drop-shadow-sm md:h-[90px]"
                  loading="eager"
                  decoding="async"
                />
              </Link>
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="md:hidden" variant="outline" size="icon" aria-label="Open menu">
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
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/profile')}>
                            Profile
                          </Button>
                          <Button variant="outline" size="sm" className="w-full" onClick={() => signOut()}>
                            Sign Out
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full transition-colors hover:bg-primary hover:text-white"
                            onClick={() => navigate('/auth')}
                          >
                            Sign In
                          </Button>
                          <Button size="sm" className="w-full bg-primary text-white" onClick={() => navigate('/auth?mode=signup')}>
                            Sign Up
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {renderSearch(desktopSearchRef, "hidden md:block md:flex-1 md:max-w-md w-full")}
            </div>



            <div className="flex items-center gap-2 md:gap-4 justify-end">
              <Button
                variant="ghost"
                size="icon"
                className={`md:hidden text-gray-700 transition-colors hover:bg-primary hover:text-white ${showMobileSearch ? 'bg-primary/10' : ''}`}
                onClick={() => setShowMobileSearch((prev) => !prev)}
                aria-label="Toggle search"
                aria-pressed={showMobileSearch}
              >
                <Search className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-700 transition-colors hover:bg-primary hover:text-white"
                onClick={() => navigate("/cart")}
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center p-0 text-xs font-medium bg-primary text-white"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>

              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-700 transition-colors hover:bg-primary hover:text-white"
                    onClick={() => navigate("/profile")}
                  >
                    <User className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-400 bg-white/10 text-gray-700 transition-colors hover:bg-primary hover:text-white backdrop-blur font-inter"
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
                    className="text-gray-700 font-inter transition-colors hover:bg-primary hover:text-white"
                    onClick={() => navigate("/auth")}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary text-white shadow-lg hover:bg-primary/90 font-inter"
                    onClick={() => navigate("/auth?mode=signup")}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>

          {renderSearch(mobileSearchRef, `${showMobileSearch ? 'block' : 'hidden'} md:hidden w-full`)}

          <div className="hidden md:flex justify-center">
            <nav className="flex w-full max-w-5xl items-center justify-center">
              <div className="flex items-center justify-center gap-4 lg:gap-6 overflow-hidden whitespace-nowrap">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link key={item.to} to={item.to} className={navLinkClass}>
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
        </div>
      </header>
    </>
  );
};
