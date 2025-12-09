"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getDashboardStats, DashboardStats } from "@/lib/actions/dashboard";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function ControlPanel() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("adventures");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const result = await getDashboardStats();
        
        if (result.success && result.data) {
          setStats(result.data);
        } else {
          setError(result.error || "Failed to load dashboard statistics");
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const result = await getDashboardStats();
      
      if (result.success && result.data) {
        setStats(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to refresh dashboard statistics");
      }
    } catch (err) {
      setError("An unexpected error occurred while refreshing data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "adventures":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Adventures Management</CardTitle>
                <CardDescription>
                  Manage all adventure packages, tours, and experiences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DashboardCard 
                    title="Total Adventures" 
                    value={loading ? "Loading..." : String(stats?.adventures.total || 0)} 
                    description="All adventures" 
                  />
                  <DashboardCard 
                    title="Active Adventures" 
                    value={loading ? "Loading..." : String(stats?.adventures.active || 0)} 
                    description="Upcoming adventures" 
                  />
                </div>
                <div className="mt-6">
                  <Button className="w-full sm:w-auto" asChild>
                    <Link href="/control-panel/adventures">Manage Adventures</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "users":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, permissions, and profiles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DashboardCard 
                    title="Total Users" 
                    value={loading ? "Loading..." : String(stats?.users.total || 0)} 
                    description="Registered users" 
                  />
                  <DashboardCard 
                    title="New Users" 
                    value={loading ? "Loading..." : String(stats?.users.recentlyJoined || 0)} 
                    description="Last 30 days" 
                  />
                </div>
                <div className="mt-6">
                  <Button className="w-full sm:w-auto" asChild>
                    <Link href="/control-panel/users">Manage Users</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "orders":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>
                  Track and manage customer orders and bookings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <DashboardCard 
                    title="Total Orders" 
                    value={loading ? "Loading..." : String(stats?.orders.total || 0)} 
                    description="All time" 
                  />
                  <DashboardCard 
                    title="Pending Orders" 
                    value={loading ? "Loading..." : String(stats?.orders.pending || 0)} 
                    description="Awaiting processing" 
                  />
                  <DashboardCard 
                    title="Recent Revenue" 
                    value={loading ? "Loading..." : formatPrice(stats?.orders.recentRevenue || 0)} 
                    description="Last 30 days" 
                  />
                </div>
                <div className="mt-6">
                  <Button className="w-full sm:w-auto" asChild>
                    <Link href="/control-panel/orders">Manage Orders</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "coupons":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Coupon Management</CardTitle>
                <CardDescription>
                  Create and manage promotional coupons and discounts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DashboardCard 
                    title="Active Coupons" 
                    value={loading ? "Loading..." : String(stats?.coupons.active || 0)} 
                    description="Currently active" 
                  />
                  <DashboardCard 
                    title="Usage Count" 
                    value={loading ? "Loading..." : String(stats?.coupons.usageCount || 0)} 
                    description="Times used" 
                  />
                </div>
                <div className="mt-6">
                  <Button className="w-full sm:w-auto" asChild>
                    <Link href="/control-panel/coupons">Manage Coupons</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "blogs":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Blog Management</CardTitle>
                <CardDescription>
                  Manage blog posts, categories, and comments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 gap-4">
                  <DashboardCard 
                    title="Total Posts" 
                    value={loading ? "Loading..." : String(stats?.blogs.total || 0)} 
                    description="Published posts" 
                  />
                </div>
                <div className="mt-6">
                  <Button className="w-full sm:w-auto" asChild>
                    <Link href="/control-panel/blogs">Manage Blogs</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Control Panel</h1>
        <Button onClick={refreshData} disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Refresh Data"
          )}
        </Button>
      </div>
      
      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="overflow-hidden rounded-lg bg-card">
          <div className="grid grid-cols-2 md:grid-cols-5">
            <div 
              className={`py-2.5 text-center cursor-pointer ${activeTab === "adventures" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`} 
              onClick={() => setActiveTab("adventures")}
            >
              Adventures
            </div>
            <div 
              className={`py-2.5 text-center cursor-pointer ${activeTab === "users" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`} 
              onClick={() => setActiveTab("users")}
            >
              Users
            </div>
            <div 
              className={`py-2.5 text-center cursor-pointer ${activeTab === "orders" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`} 
              onClick={() => setActiveTab("orders")}
            >
              Orders
            </div>
            <div 
              className={`py-2.5 text-center cursor-pointer ${activeTab === "coupons" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`} 
              onClick={() => setActiveTab("coupons")}
            >
              Coupons
            </div>
            <div 
              className={`py-2.5 text-center cursor-pointer ${activeTab === "blogs" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`} 
              onClick={() => setActiveTab("blogs")}
            >
              Blogs
            </div>
          </div>
        </div>
        
        {renderTabContent()}
      </div>
    </div>
  );
}

function DashboardCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold truncate">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
} 