import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthPage } from "./pages/AuthPage";
import { OtpVerificationPage } from "./pages/OtpVerificationPage";
import { ProductsPage } from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import { SearchResultsPage } from "./pages/SearchResultsPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderConfirmationPage } from "./pages/OrderConfirmationPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminLayout } from "./components/admin/AdminLayout";
import { DashboardOverview } from "./components/admin/DashboardOverview";
import { ProductsManagement } from "./components/admin/ProductsManagement";
import { CategoriesManagement } from "./components/admin/CategoriesManagement";
import { OrdersManagement } from "./components/admin/OrdersManagement";
import { CarouselManagement } from "./components/admin/CarouselManagement";
import { FeaturedProductsManagement } from "./components/admin/FeaturedProductsManagement";
import { ShippingManagement } from "./components/admin/ShippingManagement";
import { HomepageCategoriesManagement } from "./components/admin/HomepageCategoriesManagement";
import { ContactQueriesManagement } from "./components/admin/ContactQueriesManagement";
import { CorporateOrdersManagement } from "./components/admin/CorporateOrdersManagement";
import { BlogsManagement } from "./components/admin/BlogsManagement";
import { ReviewsManagement } from "./components/admin/ReviewsManagement";
import { AnnouncementBarManagement } from "./components/admin/AnnouncementBarManagement";
import { PaymentOptionsManagement } from "./components/admin/PaymentOptionsManagement";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContactUs from "./pages/ContactUs";
import CorporateOrder from "./pages/CorporateOrder";
import BlogsPage from "./pages/BlogsPage";
import BlogDetailPage from "./pages/BlogDetailPage";

const queryClient = new QueryClient();

// Component to handle scroll restoration
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable browser scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Scroll to top on route change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Also scroll after a small delay to ensure it works
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};

const AppRoutes = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/verify" element={<OtpVerificationPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/blogs" element={<BlogsPage />} />
          <Route path="/blogs/:slug" element={<BlogDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/corporate-order" element={<CorporateOrder />} />
          
          {/* Admin Dashboard with nested routes */}
          <Route path="/admin-dashboard" element={<AdminLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="categories" element={<CategoriesManagement />} />
            <Route path="homepage-categories" element={<HomepageCategoriesManagement />} />
            <Route path="carousel" element={<CarouselManagement />} />
            <Route path="featured" element={<FeaturedProductsManagement />} />
            <Route path="shipping" element={<ShippingManagement />} />
            <Route path="announcement" element={<AnnouncementBarManagement />} />
            <Route path="reviews" element={<ReviewsManagement />} />
            <Route path="payment-options" element={<PaymentOptionsManagement />} />
            <Route path="contact-queries" element={<ContactQueriesManagement />} />
            <Route path="corporate-orders" element={<CorporateOrdersManagement />} />
            <Route path="blogs" element={<BlogsManagement />} />
          </Route>
          
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
