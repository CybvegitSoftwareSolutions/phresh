import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { apiService } from "@/services/api";

export const AdminLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Wait until auth loading finishes before access checks
    console.log('AdminLayout: authLoading:', authLoading, 'user:', user?.email || 'none', 'role:', user?.role || 'none');
    
    const checkAdminAccess = async () => {
      // If auth is still loading, don't make a decision yet
      if (authLoading) {
        console.log('AdminLayout: Still loading auth, waiting...');
        return;
      }

      // If no user at all, redirect to admin login
      if (!user) {
        console.log('AdminLayout: No user after auth load, redirecting to login');
        setLoading(false);
        setIsAdmin(false);
        navigate('/admin', { replace: true });
        return;
      }

      console.log('AdminLayout: Checking admin status for user:', user.email, 'role:', user.role, 'full user:', user);

      // Always reload profile to ensure we have the latest role from backend
      let userRole = user.role;
      try {
        const userId = localStorage.getItem('user_id') || user._id;
        if (userId) {
          console.log('AdminLayout: Reloading profile with userId:', userId);
          const profileResponse = await apiService.getProfile(userId);
          if (profileResponse.success && profileResponse.data) {
            console.log('AdminLayout: Reloaded profile, role:', profileResponse.data.role);
            userRole = profileResponse.data.role;
          } else {
            console.error('AdminLayout: Profile reload failed:', profileResponse);
          }
        }
      } catch (error) {
        console.error('AdminLayout: Error reloading profile:', error);
      }

      // Check if user has admin role from backend
      if (userRole !== 'admin') {
        console.log('AdminLayout: User is not admin, role:', userRole, 'type:', typeof userRole);
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive"
        });
        setLoading(false);
        setIsAdmin(false);
        navigate('/', { replace: true });
        return;
      }

      console.log('AdminLayout: User is admin, loading dashboard');
      setIsAdmin(true);
      setLoading(false);
    };

    if (!authLoading) {
      checkAdminAccess();
    }
  }, [user, authLoading, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // If user is not admin, the component will redirect, so we don't render anything
  if (!isAdmin || !user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-12 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger className="mr-2" />
            <h1 className="font-semibold">Admin Dashboard</h1>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
