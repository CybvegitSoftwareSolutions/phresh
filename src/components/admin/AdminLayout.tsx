import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

export const AdminLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait until auth loading finishes before access checks
    console.log('AdminLayout: authLoading:', authLoading, 'user:', user?.email || 'none');
    if (!authLoading) {
      checkAdminAccess();
    }
  }, [user, authLoading]);

  const checkAdminAccess = async () => {
    // If auth is still loading, don't make a decision yet
    if (authLoading) return;

    // If no user at all, redirect to admin login
    if (!user) {
      console.log('AdminLayout: No user after auth load, redirecting to login');
      setLoading(false);
      navigate('/admin', { replace: true });
      return;
    }

    console.log('AdminLayout: Checking admin status for user:', user.email, 'role:', user.role);

    // Check if user has admin role from backend
    if (user.role !== 'admin') {
      console.log('AdminLayout: User is not admin, role:', user.role);
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive"
      });
      setLoading(false);
      navigate('/', { replace: true });
      return;
    }

    console.log('AdminLayout: User is admin, loading dashboard');
    setLoading(false);
  };

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
  if (!user || user.role !== 'admin') {
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
