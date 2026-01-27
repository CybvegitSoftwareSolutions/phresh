import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, ShoppingCart, Star, Users, TrendingUp } from "lucide-react";
import { apiService } from "@/services/api";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  featuredProducts: number;
  totalCategories: number;
}

export const DashboardOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalProducts: 0,
    featuredProducts: 0,
    totalCategories: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch dashboard stats from backend
      const response = await apiService.getDashboardStats();
      
      if (response.success && response.data) {
        setStats({
          totalOrders: response.data.totalOrders || 0,
          totalRevenue: response.data.totalRevenue || 0,
          pendingOrders: response.data.pendingOrders || 0,
          totalProducts: response.data.totalProducts || 0,
          featuredProducts: response.data.featuredProducts || 0,
          totalCategories: response.data.totalCategories || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      description: "All time orders",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Total Revenue",
      value: `£${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Total earnings",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: TrendingUp,
      description: "Orders to process",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20"
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      description: "In inventory",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      title: "Featured Products",
      value: stats.featuredProducts,
      icon: Star,
      description: "Highlighted items",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20"
    },
    {
      title: "Categories",
      value: stats.totalCategories,
      icon: Users,
      description: "Product categories",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20"
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-1"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Get a quick overview of your store performance and key metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="transition-all hover:shadow-md border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">New order received</p>
                    <p className="text-sm text-muted-foreground">Order #SA20250101001</p>
                  </div>
                </div>
                <Badge variant="secondary">New</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Product updated</p>
                    <p className="text-sm text-muted-foreground">Luxury Rose Perfume</p>
                  </div>
                </div>
                <Badge variant="outline">Updated</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left">
                <Package className="h-5 w-5 mb-2 text-blue-600" />
                <p className="font-medium text-sm">Add Product</p>
              </button>
              
              <button className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left">
                <Users className="h-5 w-5 mb-2 text-green-600" />
                <p className="font-medium text-sm">Add Category</p>
              </button>
              
              <button className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left">
                <Star className="h-5 w-5 mb-2 text-yellow-600" />
                <p className="font-medium text-sm">Feature Product</p>
              </button>
              
              <button className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left">
                <ShoppingCart className="h-5 w-5 mb-2 text-purple-600" />
                <p className="font-medium text-sm">View Orders</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};